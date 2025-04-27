// Переменные
let itemCount = 1;
const botToken = "7591200004:AAGQN8C0P8SsaaDrWZLqXfSiLe4WJ75rhAI";
const adminChatId = "5848581114";
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
    <div class="form-group">
      <label>Фото товара</label>
      <input type="file" name="photo" accept="image/*" required>
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

    const formData = new FormData();

    for (let i = 1; i <= itemCount; i++) {
      const item = document.getElementById(`item-${i}`);
      const inputs = item.querySelectorAll('input');
      const link = inputs[0].value;
      const size = inputs[1].value;
      const quantity = parseInt(inputs[2].value);
      const price = parseFloat(inputs[3].value);
      const color = inputs[4].value;
      const photoInput = inputs[5];

      if (!link || !size || !quantity || !price || !color) {
        window.Telegram.WebApp.showAlert('Пожалуйста, заполните все поля для товара ' + i);
        return;
      }

      if (!photoInput.files || !photoInput.files[0]) {
        window.Telegram.WebApp.showAlert('Пожалуйста, загрузите фото для товара ' + i);
        return;
      }

      totalItems += 1;

      const itemData = { orderNumber, link, size, quantity, price, color, photo: `Фото для товара ${i}` };
      items.push(itemData);

      formData.append(`photo-${i}`, photoInput.files[0]);
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

    formData.append('items', JSON.stringify(itemsWithDelivery));

    // Отправляем данные и фото на сервер
    const response = await fetch('https://order-bot-shjq.onrender.com/submit-order', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Ошибка при отправке заказа на сервер');
    }

    await notifyUser(userId, itemsWithDelivery);
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
        <th>Количество</th>
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
    <p>Заказ успешно отправлен! Администратор получит ваш заказ и фото.</p>
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
      text: `Ваш заказ (${items[0].orderNumber}) принят!\n${message}`
    })
  });
}