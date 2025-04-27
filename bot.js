const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const botToken = "7591200004:AAGQN8C0P8SsaaDrWZLqXfSiLe4WJ75rhAI";
const adminChatId = "5848581114";
const miniAppUrl = "https://inquisitive-platypus-5eaa83.netlify.app";

const bot = new TelegramBot(botToken, { polling: true });
const photoStorage = {};

// Настройка Multer для обработки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Bot is running!');
});

app.post('/submit-order', upload.any(), async (req, res) => {
  try {
    console.log("Получен запрос на /submit-order");

    const items = JSON.parse(req.body.items);

    if (!items || items.length === 0) {
      console.log("Ошибка: Нет данных для заказа");
      return res.status(400).send('Нет данных для заказа');
    }

    console.log("Данные заказа:", items);

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Заказы');

    worksheet.columns = [
      { header: 'Товар', key: 'itemNumber', width: 10 },
      { header: 'Ссылка', key: 'link', width: 30 },
      { header: 'Фото или ссылка на фото', key: 'photoLink', width: 50 },
      { header: 'Размер', key: 'size', width: 10 },
      { header: 'Кол-во', key: 'quantity', width: 10 },
      { header: 'Цена', key: 'price', width: 10 },
      { header: 'Цвет', key: 'color', width: 10 },
      { header: 'Количество', key: 'totalItems', width: 15 },
      { header: 'Доставка за позицию', key: 'deliveryPerItem', width: 20 },
      { header: 'Общая доставка', key: 'totalDelivery', width: 15 },
      { header: 'Итог (с доставкой)', key: 'totalWithDelivery', width: 15 }
    ];

    // Временно убираем работу с фото для теста
    const photoLinks = req.files.map((_, index) => `Фото для товара ${index + 1} (заглушка)`);

    console.log("Добавляем данные в таблицу...");
    items.forEach((item, index) => {
      worksheet.addRow({
        itemNumber: item.itemNumber,
        link: item.link,
        photoLink: photoLinks[index] || 'Не загружено',
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        color: item.color,
        totalItems: item.totalItems,
        deliveryPerItem: item.deliveryPerItem,
        totalDelivery: item.totalDelivery,
        totalWithDelivery: item.totalWithDelivery
      });
    });

    console.log("Создаём Excel-файл...");
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `order_${items[0].username}.xlsx`;

    console.log("Отправляем Excel-файл админу...");
    await bot.sendDocument(adminChatId, buffer, {}, { filename: fileName, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    console.log("Заказ успешно обработан!");
    res.status(200).send('Заказ отправлен!');
  } catch (error) {
    console.error('Ошибка при обработке заказа:', error.message);
    res.status(500).send('Ошибка сервера: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Нажмите на кнопку ниже, чтобы оформить заказ:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Открыть форму заказа",
            web_app: { url: miniAppUrl }
          }
        ]
      ]
    }
  });
});

bot.on('polling_error', (error) => {
  console.error('Ошибка при поллинге:', error.message);
});