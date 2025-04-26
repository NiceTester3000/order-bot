const axios = require('axios');

const botToken = "7591200004:AAGQN8C0P8SsaaDrWZLqXfSiLe4WJ75rhAI";
const adminChatId = "5848581114";

const miniAppUrl = "https://inquisitive-platypus-5eaa83.netlify.app";

const photoStorage = {};

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

async function handleUpdate(update) {
  const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
  const messageText = update.message?.text;
  const photo = update.message?.photo;

  if (messageText === '/start') {
    await sendMiniAppLink(chatId);
  }

  if (photo) {
    const fileId = photo[photo.length - 1].file_id;
    const caption = update.message.caption || `Фото для заказа от ${chatId}`;
    if (!photoStorage[chatId]) photoStorage[chatId] = [];
    photoStorage[chatId].push({ fileId, caption });

    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: `Фото "${caption}" получено. Если у вас есть ещё фото, отправьте их.`
    });

    await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      chat_id: adminChatId,
      photo: fileId,
      caption: caption
    });
  }
}

async function startBot() {
  let offset = 0;
  while (true) {
    try {
      const response = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`, {
        params: { offset: offset + 1, timeout: 30 }
      });
      const updates = response.data.result;
      for (const update of updates) {
        offset = update.update_id;
        await handleUpdate(update);
      }
    } catch (error) {
      console.error('Ошибка при получении обновлений:', error.message);
    }
  }
}

startBot();