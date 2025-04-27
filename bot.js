const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const botToken = "7591200004:AAGQN8C0P8SsaaDrWZLqXfSiLe4WJ75rhAI";
const adminChatId = "5848581114";
const miniAppUrl = "https://inquisitive-platypus-5eaa83.netlify.app";

const bot = new TelegramBot(botToken, { polling: true });
const photoStorage = {};

// Настройка Express сервера
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Для обработки JSON

app.get('/', (req, res) => {
  res.status(200).send('Bot is running!');
});

app.post('/submit-order', async (req, res) => {
  const items = req.body;

  // Создаем Excel-файл
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Заказы');

  worksheet.columns = [
    { header: 'Номер заказа', key: 'orderNumber', width: 15 },
    { header: 'Ссылка', key: 'link', width: 30 },
    { header: 'Размер', key: 'size', width: 10 },
    { header: 'Фото', key: 'photo', width: 30 },
    { header: 'Кол-во', key: 'quantity', width: 10 },
    { header: 'Цена', key: 'price', width: 10 },
    { header: 'Цвет', key: 'color', width: 10 },
    { header: 'Кол-во позиций', key: 'totalItems', width: 15 },
    { header: 'Доставка за позицию', key: 'deliveryPerItem', width: 20 },
    { header: 'Общая доставка', key: 'totalDelivery', width: 15 },
    { header: 'Итог (с доставкой)', key: 'totalWithDelivery', width: 15 }
  ];

  items.forEach(item => {
    worksheet.addRow({
      orderNumber: item.orderNumber,
      link: item.link,
      size: item.size,
      photo: item.photo,
      quantity: item.quantity,
      price: item.price,
      color: item.color,
      totalItems: item.totalItems,
      deliveryPerItem: item.deliveryPerItem,
      totalDelivery: item.totalDelivery,
      totalWithDelivery: item.totalWithDelivery
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `order_${items[0].orderNumber}.xlsx`;

  // Отправляем файл админу
  await bot.sendDocument(adminChatId, buffer, {}, { filename: fileName, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  res.status(200).send('Заказ отправлен!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Логика бота
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

bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const caption = msg.caption || `Фото для заказа от ${chatId}`;

  if (!photoStorage[chatId]) photoStorage[chatId] = [];
  photoStorage[chatId].push({ fileId, caption });

  bot.sendMessage(chatId, `Фото "${caption}" получено. Если у вас есть ещё фото, отправьте их.`);
  bot.sendPhoto(adminChatId, fileId, { caption });
});

bot.on('polling_error', (error) => {
  console.error('Ошибка при поллинге:', error.message);
});

app.use(express.json()); // Для обработки JSON

app.post('/submit-order', async (req, res) => {
  const items = req.body;

  // Создаем Excel-файл
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Заказы');

  worksheet.columns = [
    { header: 'Номер заказа', key: 'orderNumber', width: 15 },
    { header: 'Ссылка', key: 'link', width: 30 },
    { header: 'Размер', key: 'size', width: 10 },
    { header: 'Фото', key: 'photo', width: 30 },
    { header: 'Кол-во', key: 'quantity', width: 10 },
    { header: 'Цена', key: 'price', width: 10 },
    { header: 'Цвет', key: 'color', width: 10 },
    { header: 'Кол-во позиций', key: 'totalItems', width: 15 },
    { header: 'Доставка за позицию', key: 'deliveryPerItem', width: 20 },
    { header: 'Общая доставка', key: 'totalDelivery', width: 15 },
    { header: 'Итог (с доставкой)', key: 'totalWithDelivery', width: 15 }
  ];

  items.forEach(item => {
    worksheet.addRow({
      orderNumber: item.orderNumber,
      link: item.link,
      size: item.size,
      photo: item.photo,
      quantity: item.quantity,
      price: item.price,
      color: item.color,
      totalItems: item.totalItems,
      deliveryPerItem: item.deliveryPerItem,
      totalDelivery: item.totalDelivery,
      totalWithDelivery: item.totalWithDelivery
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `order_${items[0].orderNumber}.xlsx`;

  // Отправляем файл админу
  await bot.sendDocument(adminChatId, buffer, {}, { filename: fileName, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  res.status(200).send('Заказ отправлен!');
});

app.post('/submit-order', async (req, res) => {
  try {
    const items = req.body;

    if (!items || items.length === 0) {
      return res.status(400).send('Нет данных для заказа');
    }

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Заказы');

    worksheet.columns = [
      { header: 'Номер заказа', key: 'orderNumber', width: 15 },
      { header: 'Ссылка', key: 'link', width: 30 },
      { header: 'Размер', key: 'size', width: 10 },
      { header: 'Фото', key: 'photo', width: 30 },
      { header: 'Кол-во', key: 'quantity', width: 10 },
      { header: 'Цена', key: 'price', width: 10 },
      { header: 'Цвет', key: 'color', width: 10 },
      { header: 'Кол-во позиций', key: 'totalItems', width: 15 },
      { header: 'Доставка за позицию', key: 'deliveryPerItem', width: 20 },
      { header: 'Общая доставка', key: 'totalDelivery', width: 15 },
      { header: 'Итог (с доставкой)', key: 'totalWithDelivery', width: 15 }
    ];

    items.forEach(item => {
      worksheet.addRow({
        orderNumber: item.orderNumber,
        link: item.link,
        size: item.size,
        photo: item.photo,
        quantity: item.quantity,
        price: item.price,
        color: item.color,
        totalItems: item.totalItems,
        deliveryPerItem: item.deliveryPerItem,
        totalDelivery: item.totalDelivery,
        totalWithDelivery: item.totalWithDelivery
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `order_${items[0].orderNumber}.xlsx`;

    await bot.sendDocument(adminChatId, buffer, {}, { filename: fileName, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    res.status(200).send('Заказ отправлен!');
  } catch (error) {
    console.error('Ошибка при обработке заказа:', error.message);
    res.status(500).send('Ошибка сервера: ' + error.message);
  }
});