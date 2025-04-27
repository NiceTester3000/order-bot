// Переменные
let itemCount = 1;
const botToken = "7591200004:AAGQN8C0P8SsaaDrWZLqXfSiLe4WJ75rhAI"; // Ваш токен бота
const adminChatId = "5848581114"; // Вставьте ваш chat_id
let userId;

// Инициализация Telegram Web App
window.Telegram.WebApp.ready();
userId = window.Telegram.WebApp.initDataUnsafe.user.id;

// Функция добавления нового товара
function addItem() {
  itemCount++;
  const newItem = document.createElement('div');
  newItem.className = 'item';
  newItem.id = `item-${itemCount}`;
  newItem.innerHTML = `
    <h3>Товар ${itemCount}</h3>
    <div class="form-group">
      <label>Ссылка на товар</label>
      <input type="text" name="link" placeholder="Введите ссылку" required>
    </div>
    <div class="form-group">
      <label>Размер</label>
      <input type="text" name="size" placeholder="Введите размер" required>
    </div>
    <div class="form-group">
      <label>Количество</label>
      <input type="number" name="quantity" placeholder="Введите количество" required>
    </div>
    <div class="form-group">
      <label>Цена (юани)</label>
      <input type="number" name="price" placeholder="Введите цену" required>
    </div>
    <div class="form-group">
      <label>Цвет</label>
      <input type="text" name="color" placeholder="Введите цвет" required>
    </div>
  `;
  document.getElementById('items').appendChild(newItem);
}

// Функция отправки заказа
async function submitOrder() {
  try {
    const orderNumber = document.getElementById('order-number').value;
    if (!orderNumber) {
      window.Telegram.WebApp.showAlert('Пожалуйста, укажите номер заказа');
      return;
    }

    const items = [];
    let totalItems = 0;

    for (let i = 1; i <= itemCount; i++) {
      const item = document.getElementById(`item-${i}`);
      const inputs = item.querySelectorAll('input');
      const link = inputs[0].value;
      const size = inputs[1].value;
      const quantity = parseInt(inputs[2].value);
      const price = parseFloat(inputs[3].value);
      const color = inputs[4].value;

      if (!link || !size || !quantity || !price || !color) {
        window.Telegram.WebApp.showAlert('Пожалуйста, заполните все поля для товара ' + i);
        return;
      }

      totalItems += quantity;
      items.push({ orderNumber, link, size, quantity, price, color, photo: `Ожидается фото для товара ${i}` });
    }

    const deliveryPerItem = totalItems > 20 ? 15 : totalItems >= 10 ? 20 : 30;
    const itemsWithDelivery = items.map(item => {
      const totalDelivery = deliveryPerItem * item.quantity;
      const totalWithDelivery = (item.quantity * item.price) + totalDelivery;
      return {
        ...item,
        totalItems,
        deliveryPerItem,
        totalDelivery,
        totalWithDelivery
      };
    });

    showFilledData(itemsWithDelivery);

    // Отправляем данные на сервер
    const response = await fetch('https://order-bot-shjq.onrender.com/submit-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemsWithDelivery)
    });

    if (!response.ok) {
      throw new Error('Ошибка при отправке заказа на сервер');
    }

    await notifyUser(userId, itemsWithDelivery);
    await requestPhotos(userId, orderNumber, itemCount);
  } catch (error) {
    window.Telegram.WebApp.showAlert('Произошла ошибка: ' + error.message);
  }
}

// Функция отображения заполненных данных
function showFilledData(items) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <h3>Ваш заказ:</h3>
    <table>
      <tr>
        <th>Номер заказа</th>
        <th>Ссылка</th>
        <th>Размер</th>
        <th>Кол-во</th>
        <th>Цена</th>
        <th>Цвет</th>
        <th>Кол-во позиций</th>
        <th>Доставка за позицию</th>
        <th>Общая доставка</th>
        <th>Итог (с доставкой)</th>
      </tr>
      ${items.map(item => `
        <tr>
          <td>${item.orderNumber}</td>
          <td>${item.link}</td>
          <td>${item.size}</td>
          <td>${item.quantity}</td>
          <td>${item.price}</td>
          <td>${item.color}</td>
          <td>${item.totalItems}</td>
          <td>${item.deliveryPerItem}</td>
          <td>${item.totalDelivery}</td>
          <td>${item.totalWithDelivery}</td>
        </tr>
      `).join('')}
    </table>
    <p>Пожалуйста, отправьте фото для каждого товара боту. Укажите, к какому товару относится фото (например, "Фото для товара 1").</p>
  `;
}

// Функция отправки уведомления клиенту
async function notifyUser(userId, items) {
  const message = items.map(item => `Товар: ${item.link}, Размер: ${item.size}, Кол-во: ${item.quantity}, Цена: ${item.price}, Цвет: ${item.color}`).join('\n');
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: userId,
      text: `Ваш заказ (${items[0].orderNumber}):\n${message}`
    })
  });
}

// Функция запроса фото у клиента
async function requestPhotos(userId, orderNumber, itemCount) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: userId,
      text: `Ваш заказ (${orderNumber}) принят! Пожалуйста, отправьте фото для каждого товара (${itemCount} шт.). Укажите, к какому товару относится фото (например, "Фото для товара 1").`
    })
  });
}