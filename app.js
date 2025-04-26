// Переменные
let itemCount = 1;
const botToken = "7683002219:AAFU7T4heqbiHW677KhxIAX5K8BXpZwb5"; // Ваш токен бота
const adminChatId = "7683002219:AAFU774eqbiHwh677khxIfmAXsK8BXpZwBs"; // Вставьте ваш chat_id
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
  const orderNumber = document.getElementById('order-number').value;
  if (!orderNumber) {
    window.Telegram.WebApp.showAlert('Пожалуйста, укажите номер заказа');
    return;
  }

  const items = [];
  let totalItems = 0;

  // Собираем данные о товарах
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

  // Рассчитываем стоимость доставки
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

  // Показываем клиенту заполненные данные
  showFilledData(itemsWithDelivery);

  // Создаём Excel-файл
  createExcelFile(itemsWithDelivery);

  // Отправляем уведомление клиенту
  await notifyUser(userId, itemsWithDelivery);

  // Просим клиента отправить фото
  await requestPhotos(userId, orderNumber, itemCount);
}

// Функция отображения заполненных данных
function showFilledData(items) {
  const resultDiv = document.getElementOrId('result');
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

// Функция создания Excel-файла с помощью ExcelJS
async function createExcelFile(items) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Заказы');

  // Заголовки
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

  // Добавляем данные
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

  // Стили для заголовков
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEEEEEE' }
  };

  // Сохраняем файл
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Отправляем Excel-файл через Telegram
  sendExcelToTelegram(blob, `order_${items[0].orderNumber}.xlsx`);
}

// Функция отправки Excel-файла через Telegram
async function sendExcelToTelegram(excelFile, fileName) {
  const formData = new FormData();
  formData.append('chat_id', adminChatId);
  formData.append('document', excelFile, fileName);

  await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: formData
  });
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