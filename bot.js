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

app.get('/', (req, res) => {
  res.status(200).send('Bot is running!');
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