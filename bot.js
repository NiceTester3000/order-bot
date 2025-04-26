const axios = require('axios');
const botToken = "7683002219:AAFU774eqbiHwh677khxIfmAXsK8BXpZwBs"; // Ваш токен бота
const adminChatId = "5848581114"; // Ваш chat_id

// URL вашего Mini App (пока заглушка, обновим после хостинга)
const miniAppUrl = "https://order-bot.vercel.app";

// Хранилище для фото (временное)
const photoStorage = {};

// Функция для отправки сообщения с кнопкой
async function sendMiniAppLink(chatId) {
  await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId,
    text: "Нажмите на кнопку ниже, чтобы оформить заказ:",
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
}

// Обработчик входящих сообщений
async function handleUpdate(update) {
  const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
  const messageText = update.message?.text;
  const photo = update.message?.photo;

  if (messageText === '/start') {
    await sendMiniAppLink(chatId);
  }

  // Обработка фото
  if (photo) {
    const fileId = photo[photo.length - 1].file_id; // Берем фото с самым высоким качеством
    const caption = update.message.caption || `Фото для заказа от ${chatId}`;
    if (!photoStorage[chatId]) photoStorage[chatId] = []; // Исправлено: добавляем проверку и инициализацию массива
    photoStorage[chatId].push({ fileId, caption });

    // Уведомляем клиента
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: `Фото "${caption}" получено. Если у вас есть ещё фото, отправьте их.` // Добавлена точка
    });

    // Отправляем фото администратору
    await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      chat_id: adminChatId,
      photo: fileId,
      caption: caption
    });
  }
}

// Основная функция для получения обновлений (поллинг)
async function startBot() {
  let offset = 0;
  while (true) {
    try {
      const response = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}`);
      const updates = response.data.result;

      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (error) {
      console.error('Ошибка:', error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка 1 сек
  }
}

startBot();