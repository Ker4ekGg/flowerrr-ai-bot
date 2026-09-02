export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Тест Admin Bot
if (url.pathname === "/admin-test") {
const response = await fetch(
"https://api.telegram.org/bot" +
env.ADMIN_BOT_TOKEN +
"/sendMessage?chat_id=641017166&text=" +
encodeURIComponent("🧪 ADMIN BOT TEST\n\nFlower Admin успешно подключён! 🌸")
);

const result = await response.json();

return new Response(JSON.stringify(result, null, 2), {
headers: {
"Content-Type": "application/json"
}
});
}

    // Проверка обоих Telegram-ботов
if (url.pathname === "/bot-info") {
  const clientResponse = await fetch(
    "https://api.telegram.org/bot" +
    env.TELEGRAM_TOKEN +
    "/getMe"
  );

  const adminResponse = await fetch(
    "https://api.telegram.org/bot" +
    env.ADMIN_BOT_TOKEN +
    "/getMe"
  );

  const clientBot = await clientResponse.json();
  const adminBot = await adminResponse.json();

  return new Response(
    JSON.stringify(
      {
        client_bot: clientBot,
        admin_bot: adminBot
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
    // Проверка webhook обоих ботов
if (url.pathname === "/webhook-info") {

  const clientResponse = await fetch(
    "https://api.telegram.org/bot" +
    env.TELEGRAM_TOKEN +
    "/getWebhookInfo"
  );

  const adminResponse = await fetch(
    "https://api.telegram.org/bot" +
    env.ADMIN_BOT_TOKEN +
    "/getWebhookInfo"
  );

  const clientWebhook = await clientResponse.json();
  const adminWebhook = await adminResponse.json();

  return new Response(
    JSON.stringify(
      {
        client_bot: clientWebhook,
        admin_bot: adminWebhook
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
    
    // Проверка Worker
    if (url.pathname === "/") {
      return new Response("FLOWERRR AI 🌸 Бот работает!");
    }

    // Установка webhook для обоих Telegram-ботов
if (url.pathname === "/setup") {

  // Основной FLOWERRR AI бот
  const clientWebhookUrl = url.origin + "/telegram";

  const clientTelegramUrl =
    "https://api.telegram.org/bot" +
    env.TELEGRAM_TOKEN +
    "/setWebhook?url=" +
    encodeURIComponent(clientWebhookUrl);

  const clientResponse = await fetch(clientTelegramUrl);
  const clientResult = await clientResponse.json();


  // Flower Admin Bot
  const adminWebhookUrl = url.origin + "/admin-telegram";

  const adminTelegramUrl =
    "https://api.telegram.org/bot" +
    env.ADMIN_BOT_TOKEN +
    "/setWebhook?url=" +
    encodeURIComponent(adminWebhookUrl);

  const adminResponse = await fetch(adminTelegramUrl);
  const adminResult = await adminResponse.json();


  return new Response(
    JSON.stringify(
      {
        client_bot: clientResult,
        admin_bot: adminResult
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

    // Flower Admin Bot webhook
if (url.pathname === "/admin-telegram" && request.method === "POST") {
  try {
    const update = await request.json();

    console.log(
      "ADMIN TELEGRAM UPDATE:",
      JSON.stringify(update)
    );

    if (!update.message) {
      return new Response("OK");
    }

    const chatId = update.message.chat.id;
    const text = update.message.text || "";

// ================================
// ПОЛУЧЕНИЕ PHOTO FILE ID
// ================================

if (update.message.photo) {
  const photos = update.message.photo;
  const photo = photos[photos.length - 1];

  // Проверяем, ожидаем ли мы чек оплаты
  const paymentOrder =
    env.ORDERS
      ? await env.ORDERS.get(
          String(chatId),
          "json"
        )
      : null;

  // ================================
  // ЧЕК ОПЛАТЫ
  // ================================

  if (
    paymentOrder &&
    paymentOrder.step === "payment_waiting"
  ) {
    const paymentAmount =
      paymentOrder.bouquetPrice ||
      paymentOrder.budget ||
      "Сумма уточняется";

    paymentOrder.paymentStatus = "screenshot_received";

    await env.ORDERS.put(
      String(chatId),
      JSON.stringify(paymentOrder),
      {
        expirationTtl: 86400
      }
    );

    await sendAdminMessage(
      env,
      "💳 ОПЛАТА ОЖИДАЕТ ПРОВЕРКИ\n\n" +

      "🔢 Заказ: " +
      (paymentOrder.orderNumber || "—") + "\n" +

      "💐 Букет: " +
      (paymentOrder.bouquet || "—") + "\n" +

      "💰 Сумма: " +
      paymentAmount + "\n\n" +

      "👤 Клиент: " +
      telegramName + "\n" +

      "📱 Telegram: " +
      telegramUsername + "\n" +

      "🆔 ID: " +
      chatId + "\n\n" +

      "📸 Клиент отправил скриншот оплаты.\n\n" +

      "Проверьте поступление денег в Яндекс Пэй.\n\n" +

      "PHOTO FILE ID:\n" +
      photo.file_id
    );

    await sendMessage(
      env,
      chatId,
      "✅ Скриншот оплаты получил!\n\n" +
      "Менеджер проверит поступление денег и подтвердит заказ. 🌸"
    );

    return new Response("OK");
  }

  // ================================
  // ОБЫЧНОЕ ФОТО 
  // ================================
await sendAdminBotMessage( 
  env,
  chatId,
  "📸 PHOTO FILE ID:\n\n" + 
  photo.file_id
);

  return new Response("OK"); 
}
     // Разрешаем доступ только владельцу
    if (text === "/start" || text === "/admin") {
      await sendAdminMenu(env, chatId);
      return new Response("OK");
    }

    if (text === "🌸 FLOWERRR CRM") {
      await sendAdminMenu(env, chatId);
      return new Response("OK");
    }

    if (text === "📋 Заказы") {
      await sendAdminOrders(env, chatId);
      return new Response("OK");
    }

    if (text === "👥 Клиенты") {
  await sendAdminClients(env, chatId);

  return new Response("OK");
}
    if (text === "💬 Диалоги") {
  await sendAdminBotMessage(
    env,
    chatId,
    "💬 ДИАЛОГИ\n\n" +
    "История общения с клиентами сохраняется автоматически.\n\n" +
    "Для просмотра полной истории пока используем логи Worker."
  );

  return new Response("OK");
}
    if (text === "📊 Статистика") {
  if (!env.CRM) {
    await sendAdminBotMessage(
      env,
      chatId,
      "⚠️ CRM KV не подключён."
    );

    return new Response("OK");
  }

  const list = await env.CRM.list();

  let clients = 0;
  let orders = 0;

  for (const key of list.keys) {
    const client = await env.CRM.get(key.name, "json");

    if (!client) {
      continue;
    }

    clients++;

    if (Array.isArray(client.orders)) {
      orders += client.orders.length;
    }
  }

  await sendAdminBotMessage(
    env,
    chatId,
    "📊 СТАТИСТИКА\n\n" +
    "👥 Клиентов: " + clients + "\n" +
    "📦 Заказов: " + orders + "\n\n" +
    "🌸 FLOWERRR CRM"
  );

  return new Response("OK");
}
    return new Response("OK");

  } catch (error) {
    console.error("ADMIN BOT ERROR:", error);
    return new Response("OK");
  }
}
    
    // Telegram webhook
    if (url.pathname === "/telegram" && request.method === "POST") {
      try {
        const update = await request.json();
        
        console.log("TELEGRAM UPDATE:", JSON.stringify(update));

        // ================================
        // КАТАЛОГ FLOWERRR
        // ================================

const bouquets = [
  {
    name: "NOIR DESIRE",
    price: "6 490 ₽",
    feature: "🎵 Ваша песня по QR-коду",
    photo: "AgACAgIAAxkBAAIBcWqPjhdliaEB61u0RUPPfhdX15nBAAJuJmsbj7R4SNAjKTokLwHVAQADAgADeAADPQQ"
  },
  {
    name: "SUNSET SYMPHONY",
    price: "5 990 ₽",
    feature: "💌 Личное послание",
    photo: "AgACAgIAAxkBAAIBdmqPj-HJFiXZU61pPTvDzIT6GuQOAAJvJmsbj7R4SC5n22dHCW0ZAQADAgADeAADPQQ"
  },
  {
    name: "CLOUD WHISPER",
    price: "5 790 ₽",
    feature: "📸 Ваше фото в букете",
    photo: "AgACAgIAAxkBAAIBd2qPj-XTaRpkGV7qSHRaM9fN-E48AAJwJmsbj7R4SEJ_MplBfpEtAQADAgADeAADPQQ"
  },
  {
    name: "BERRY CRUSH",
    price: "5 490 ₽",
    feature: "📍 Координаты особенного места",
    photo: "AgACAgIAAxkBAAIBeGqPj-g9Jrb4mdlHnw_2j9yGOETtAAJxJmsbj7R4SHsSpCizM2yEAQADAgADeAADPQQ"
  },
  {
    name: "RED FLAG",
    price: "5 990 ₽",
    feature: "📅 Ваша важная дата",
    photo: "AgACAgIAAxkBAAIBeWqPj-z9HX4QMO_d67fnY1m2Hh1eAAJyJmsbj7R4SLCc1c9wri3MAQADAgADeAADPQQ"
  },
  {
    name: "POP FICTION",
    price: "5 490 ₽",
    feature: "🎁 Маленький подарок-сюрприз",
    photo: "AgACAgIAAxkBAAIBemqPj-8DMD1BTXVtUHmuGh7kJ_RFAAJzJmsbj7R4SDIVfsfgojRNAQADAgADeAADPQQ"
  },
  {
    name: "WILD POETRY",
    price: "6 290 ₽",
    feature: "🪄 Букет с секретом",
    photo: "AgACAgIAAxkBAAIBe2qPj_MFrWvJjqKZov_eMZwazw5fAAJ0Jmsbj7R4SMlUE8sOukTTAQADAgADeAADPQQ"
  },
  {
    name: "AFTER MIDNIGHT",
    price: "5 990 ₽",
    feature: "🕯️ Оформим букет под особенный момент",
    photo: "AgACAgIAAxkBAAIBfGqPj_WFDHjJWjLwKakpAydIpV7ZAAJ1Jmsbj7R4SO1-nmvDZFbBAQADAgADeAADPQQ"
  }
];
        // ================================
        // INLINE-КНОПКИ КАТАЛОГА
        // ================================

        if (update.callback_query) {
  const callback = update.callback_query;
  const callbackChatId = callback.message.chat.id;
  const callbackMessageId = callback.message.message_id;
  const callbackData = callback.data;

  // Убираем "часики" на кнопке Telegram

  await fetch(
    "https://api.telegram.org/bot" +
      env.TELEGRAM_TOKEN +
      "/answerCallbackQuery",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        callback_query_id: callback.id
      })
    }
  );

  // Получаем состояние каталога

  const catalogState =
    env.ORDERS
      ? await env.ORDERS.get(
          String(callbackChatId),
          "json"
        )
      : null;
          
  if (
    !catalogState ||
    catalogState.step !== "catalog"
  ) {
    return new Response("OK");
  }

  // ================================
  // СЛЕДУЮЩИЙ БУКЕТ
  // ================================

  if (callbackData === "catalog_next") {
    
    const nextIndex =
      (catalogState.bouquetIndex + 1) %
      bouquets.length;
    
    const bouquet = bouquets[nextIndex];

    const caption =
      "🌸 " + bouquet.name + "\n\n" +
      "💰 " + bouquet.price + "\n\n" +
      bouquet.feature + "\n\n" +
      "Букет " + (nextIndex + 1) +
      " из " + bouquets.length;
    
    await env.ORDERS.put(
      String(callbackChatId),
      JSON.stringify({
        step: "catalog",
        bouquetIndex: nextIndex,
        messageId: callbackMessageId
      }),
      {
        expirationTtl: 3600
      }
    );

    await editCatalogPhoto(
      env,
      callbackChatId,
      callbackMessageId,
      bouquet.photo,
      caption
    );

    return new Response("OK");
  }

  // ================================
  // ПРЕДЫДУЩИЙ БУКЕТ
  // ================================

  if (callbackData === "catalog_prev") {
    
    let previousIndex =
      catalogState.bouquetIndex - 1;

    if (previousIndex < 0) {
      previousIndex = bouquets.length - 1;
    }

    const bouquet = bouquets[previousIndex];

    const caption =
      "🌸 " + bouquet.name + "\n\n" +
      "💰 " + bouquet.price + "\n\n" +
      bouquet.feature + "\n\n" +
      "Букет " + (previousIndex + 1) +
      " из " + bouquets.length;
   
    await env.ORDERS.put(
      String(callbackChatId),
      JSON.stringify({
        step: "catalog",
        bouquetIndex: previousIndex,
        messageId: callbackMessageId
      }),
      {
        expirationTtl: 3600
      }
    );

    await editCatalogPhoto(
      env,callbackChatId,
      callbackMessageId,
      bouquet.photo,
      caption
    );

    return new Response("OK");
  }

  // ================================
  // ЗАКАЗАТЬ ТЕКУЩИЙ БУКЕТ
  // ================================

  if (callbackData === "catalog_order") {
    
    const bouquet =
      bouquets[catalogState.bouquetIndex];
    
    const order = {
      orderNumber: "FLOW-" + Date.now(),
      step: "budget",
      bouquet: bouquet.name,
      bouquetPrice: bouquet.price,
      createdAt: new Date().toISOString()
    };

    await env.ORDERS.put(
      String(callbackChatId),
      JSON.stringify(order),
      {
        expirationTtl: 86400
      }
    );

    await sendMessage(
      env,
      callbackChatId,
      "🌸 Вы выбрали:\n\n" +
      "💐 " + bouquet.name + "\n" +
      "💰 " + bouquet.price + "\n\n" +
      "Отлично! Давайте оформим заказ.\n\n" +
      "💰 Шаг 1 из 4\n\n" +
      "Укажите ваш бюджет.\n\n" +
      "Если хотите заказать именно этот букет по указанной цене — просто напишите:\n" +
      "«По цене из каталога»"
    );

    return new Response("OK");
  }

  // ================================
  // В МЕНЮ
  // ================================

  if (callbackData === "catalog_menu") {

    if (env.ORDERS) {
      await env.ORDERS.delete(
        String(callbackChatId)
      );
    }

    await sendMessage(
      env,
      callbackChatId,
      "🌸 Главное меню\n\n" +
      "Выберите нужный раздел:",
      [
        ["💐 Каталог", "💰 Цены"],
        ["📝 Заказать букет", "🚚 Доставка"],
        ["💬 Задать вопрос", "👨‍💼 Позвать менеджера"]
      ]
    );

    return new Response("OK");
  }

  return new Response("OK");
}

// ================================
// ОБЫЧНОЕ СООБЩЕНИЕ
// ================================

if (!update.message) {
  return new Response("OK");
}

const chatId = update.message.chat.id;
const text = update.message.text || "";

// ================================
// ОПЛАТА — КЛИЕНТ НАЖАЛ «Я ОПЛАТИЛ»
// ================================

if (text === "📸 Я оплатил") {
  const paymentOrder =
    env.ORDERS
      ? await env.ORDERS.get(
          String(chatId),
          "json"
        )
      : null;

  if (!paymentOrder) {
    await sendMessage(
      env,
      chatId,
      "⚠️ Активный заказ не найден.\n\n" +
      "Пожалуйста, обратитесь к менеджеру."
    );

    return new Response("OK");
  }

  paymentOrder.step = "payment_waiting";

  await env.ORDERS.put(
    String(chatId),
    JSON.stringify(paymentOrder),
    {
      expirationTtl: 86400
    }
  );

  await sendMessage(
    env,
    chatId,
    "📸 Отлично!\n\n" +
    "Теперь отправьте сюда скриншот перевода.\n\n" +
    "После этого менеджер проверит поступление оплаты и подтвердит заказ. 🌸"
  );

  return new Response("OK");
}
        
const telegramUsername =
  update.message.from?.username
    ? "@" + update.message.from.username
    : "не указан";

const telegramName =
  update.message.from?.first_name || "не указано";

        // CRM — создаём карточку клиента при первом обращении
if (env.CRM) {
  const crmKey = String(chatId);

  let client = await env.CRM.get(crmKey, "json");

  if (!client) {
    client = {
      chatId: chatId,
      telegramUsername: telegramUsername,
      telegramName: telegramName,
      status: "new",
      ordersCount: 0,
      orders: [],
      firstContact: new Date().toISOString(),
      lastContact: new Date().toISOString()
    };

    await env.CRM.put(
      crmKey,
      JSON.stringify(client)
    );
  } else {
    client.telegramUsername = telegramUsername;
    client.telegramName = telegramName;
    client.lastContact = new Date().toISOString();

    await env.CRM.put(
      crmKey,
      JSON.stringify(client)
    );
  }
}
        
        // CRM — создаём или обновляем карточку клиента
if (env.CRM) {
  const crmKey = String(chatId);

  let client = await env.CRM.get(crmKey, "json");

  if (!client) {
    client = {
      chatId: chatId,
      telegramUsername: telegramUsername,
      telegramName: telegramName,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      ordersCount: 0,
      lastMessage: text
    };
  } else {
    client.telegramUsername = telegramUsername;
    client.telegramName = telegramName;
    client.lastSeen = new Date().toISOString();
    client.lastMessage = text;
  }

  await env.CRM.put(
    crmKey,
    JSON.stringify(client)
  );
}

        // Получаем текущее состояние заказа
       const savedOrder = env.ORDERS
  ? await env.ORDERS.get(String(chatId), "json")
  : null;
        // /start
        if (text === "/start") {
          if (env.ORDERS) {
            await env.ORDERS.delete(String(chatId));
}
if (env.CHAT_HISTORY) {
await env.CHAT_HISTORY.delete(String(chatId));
}
          await sendMessage(
            env,
            chatId,
            "🌸 Добро пожаловать в «Цветы/букеты под заказ»!\n\n" +
              "Поможем выбрать красивый букет под ваш повод и бюджет 💐\n\n" +
              "Выберите нужный раздел:",
           [
["💐 Каталог", "💰 Цены"],
["📝 Заказать букет", "🚚 Доставка"],
["💬 Задать вопрос", "👨‍💼 Позвать менеджера"]
          ]
          );

          return new Response("OK");
        }

// ================================
// КАТАЛОГ FLOWERRR
// ================================

if (text === "💐 Каталог") {

  const bouquet = bouquets[0];
  const bouquetIndex = 0;

  const caption = 
    "🌸 " + bouquet.name + "\n\n" + 
    "💰 " + bouquet.price + "\n\n" + 
  bouquet.feature + "\n\n" + 
    "Букет " + (bouquetIndex + 1) + 
    " из " + bouquets.length;
  const result = await sendPhoto( 
    env, 
    chatId, 
    bouquet.photo, 
    caption 
  );
if ( 
  result &&
  result.ok &&
  result.result &&
  result.result.message_id
) {
  if (env.ORDERS) {
  await env.ORDERS.put(
    String(chatId),
    JSON.stringify({
      step: "catalog",
      bouquetIndex: bouquetIndex,
      messageId: result.result.message_id
    }),
    {
      expirationTtl: 3600
    }
  );
}

// Добавляем inline-кнопки
await fetch(
  "https://api.telegram.org/bot" +
  env.TELEGRAM_TOKEN +
  "/editMessageReplyMarkup",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: result.result.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⬅️ Предыдущий",
              callback_data: "catalog_prev"
            },
            {
              text: "Следующий ➡️",
              callback_data: "catalog_next"
            }
          ],
          [
            {
              text: "📝 Заказать этот букет",
              callback_data: "catalog_order"
            }
          ],
          [
            {
              text: "🏠 В меню",
              callback_data: "catalog_menu"
            }
          ]
        ]
      }
    })
  }
);
  }

  return new Response("OK"); 
}

        // ================================
        // ЗАКАЗАТЬ ВЫБРАННЫЙ БУКЕТ
        // ================================

        if (text === "📝 Заказать этот букет") {
            if (!env.ORDERS) {
    await sendMessage(
      env,
      chatId,
      "⚠️ Оформление заказа временно недоступно."
    );
                  return new Response("OK");
  }
            const catalogState =
    await env.ORDERS.get(String(chatId), "json");
            if (
    !catalogState ||
    catalogState.step !== "catalog"
  ) {
    await sendMessage(
      env,
      chatId,
      "🌸 Сначала выберите букет в каталоге."
    );
                  return new Response("OK");
  }
            const bouquet =
    bouquets[catalogState.bouquetIndex];
            const order = {
    orderNumber: "FLOW-" + Date.now(),
    step: "budget",
    bouquet: bouquet.name,
    bouquetPrice: bouquet.price,
    createdAt: new Date().toISOString()
  };
            await env.ORDERS.put(
    String(chatId),
    JSON.stringify(order),
    {
      expirationTtl: 86400
    }
  );
            // Уведомление владельцу
  await sendAdminMessage(
    env,
    "🛎 КЛИЕНТ ВЫБРАЛ БУКЕТ\n\n" +
    "💐 Букет: " + bouquet.name + "\n" +
    "💰 Цена: " + bouquet.price + "\n\n" +
    "👤 Имя: " + telegramName + "\n" +
    "📱 Telegram: " + telegramUsername + "\n" +
    "🆔 ID: " + chatId
  );
            await sendMessage(
    env,
    chatId,
    "🌸 Вы выбрали:\n\n" +
    "💐 " + bouquet.name + "\n" +
    "💰 " + bouquet.price + "\n\n" +
    "Отлично! Давайте оформим заказ.\n\n" +
    "💰 Шаг 1 из 4\n\n" +
    "Укажите ваш бюджет.\n\n" +
    "Если хотите заказать именно этот букет по указанной цене — просто напишите:\n" +
    "«По цене из каталога»"
  );
            return new Response("OK");
}
        // ================================
        // СЛЕДУЮЩИЙ БУКЕТ
        // ================================

        if (text === "➡️ Следующий") {
          if (!env.ORDERS) {
    await sendMessage(
      env,
      chatId,
      "⚠️ Каталог временно недоступен."
    );
            
      return new Response("OK");
  }
  const catalogState =
    await env.ORDERS.get(String(chatId), "json");
            if (
    !catalogState ||
    catalogState.step !== "catalog"
  ) {
    await sendMessage(
      env,
      chatId,
      "🌸 Сначала откройте каталог."
    );
                  return new Response("OK");
  }
            let nextIndex =
    (catalogState.bouquetIndex + 1) % bouquets.length;
          
            const bouquet = bouquets[nextIndex];
          
            await env.ORDERS.put(
    String(chatId),
    JSON.stringify({
      step: "catalog",
      bouquetIndex: nextIndex
    }),
    {
      expirationTtl: 3600
    }
  );
            await sendPhoto(
    env,
    chatId,
    bouquet.photo,
    "🌸 " + bouquet.name + "\n\n" +
    "💰 " + bouquet.price + "\n\n" +
    bouquet.feature + "\n\n" +
    "Букет " + (nextIndex + 1) + " из " + bouquets.length,
    [
      ["⬅️ Предыдущий", "➡️ Следующий"],
      ["📝 Заказать этот букет"],
      ["🏠 В меню"]
    ]
  );
            return new Response("OK");
}
        // ================================
        // ПРЕДЫДУЩИЙ БУКЕТ
        // ================================

        if (text === "⬅️ Предыдущий") {
            if (!env.ORDERS) {
    await sendMessage(
      env,
      chatId,
      "⚠️ Каталог временно недоступен."
    );
                  return new Response("OK");
  }
            const catalogState =
    await env.ORDERS.get(String(chatId), "json");
            if (
    !catalogState ||
    catalogState.step !== "catalog"
  ) {
    await sendMessage(
      env,
      chatId,
      "🌸 Сначала откройте каталог."
    );
                  return new Response("OK");
  }
            let previousIndex =
    catalogState.bouquetIndex - 1;
            if (previousIndex < 0) {
    previousIndex = bouquets.length - 1;
  }
            const bouquet = bouquets[previousIndex];

            await env.ORDERS.put(
    String(chatId),
    JSON.stringify({
      step: "catalog",
      bouquetIndex: previousIndex
    }),
    {
      expirationTtl: 3600
    }
  );
            await sendPhoto(
    env,
    chatId,
    bouquet.photo,
    "🌸 " + bouquet.name + "\n\n" +
    "💰 " + bouquet.price + "\n\n" +
    bouquet.feature + "\n\n" +
    "Букет " + (previousIndex + 1) + " из " + bouquets.length,
    [
      ["⬅️ Предыдущий", "➡️ Следующий"],
      ["📝 Заказать этот букет"],
      ["🏠 В меню"]
    ]
  );
            return new Response("OK");
}

       // Цены
if (text === "💰 Цены") {
  await sendMessage(
    env,
    chatId,
    "💰 НАШИ ЦЕНЫ\n\n" +
    "🌸 КАТАЛОГ FLOWERRR\n" +
    "8 авторских букетов\n" +
    "от 5 490 ₽ до 6 490 ₽\n\n" +
    "✨ SPECIAL BOUQUETS\n" +
    "Сладкие и необычные букеты\n" +
    "от 4 990 ₽ до 11 990 ₽\n\n" +
    "🚚 Доставка\n" +
    "Рассчитывается индивидуально\n\n" +
    "💬 Не знаете, что выбрать?\n" +
    "Напишите повод + бюджет —\n" +
    "мы подберём подходящий вариант."
  );

  return new Response("OK");
}

        // Доставка
        if (text === "🚚 Доставка") {
          await sendMessage(
            env,
            chatId,
            "🚚 ДОСТАВКА\n\n" +
              "Стоимость доставки зависит от адреса и времени.\n\n" +
              "Напишите адрес — мы уточним стоимость."
          );

          return new Response("OK");
        }

        // Позвать менеджера
const managerRequest =
text === "👨‍💼 Позвать менеджера" ||
text.toLowerCase().includes("хочу менеджера") ||
text.toLowerCase().includes("позовите менеджера") ||
text.toLowerCase().includes("позвать менеджера") ||
text.toLowerCase().includes("соедините с менеджером") ||
text.toLowerCase().includes("поговорить с менеджером") ||
text.toLowerCase().includes("поговорить с человеком") ||
text.toLowerCase().includes("хочу поговорить с человеком") ||
text.toLowerCase().includes("с человеком");

if (managerRequest) {
await sendAdminMessage(
env,
"🔔 КЛИЕНТ ПРОСИТ МЕНЕДЖЕРА\n\n" +
"👤 Имя: " + telegramName + "\n" +
"📱 Telegram: " + telegramUsername + "\n" +
"🆔 ID: " + chatId + "\n\n" +
"💬 Сообщение клиента: " + text
);

await sendMessage(
env,
chatId,
"👨‍💼 Конечно! Передаю вас менеджеру.\n\n" +
"Мы скоро свяжемся с вами. 🌸"
);

return new Response("OK");
}

      // Начало оформления заказа
if (text === "📝 Заказать букет") {
const order = {
orderNumber: "FLOW-" + Date.now(),
step: "bouquet",
createdAt: new Date().toISOString()
};

// Уведомление владельцу
await sendAdminMessage(
env,
"🛎 НОВЫЙ КЛИЕНТ НАЧАЛ ОФОРМЛЕНИЕ\n\n" +
"👤 Имя: " + telegramName + "\n" +
"📱 Telegram: " + telegramUsername + "\n" +
"🆔 ID: " + chatId + "\n\n" +
"📝 Клиент нажал «Заказать букет»."
);

await env.ORDERS.put(
String(chatId),
JSON.stringify(order),
{ expirationTtl: 86400 }
);

          await sendMessage(
            env,
            chatId,
            "📝 ОФОРМЛЕНИЕ ЗАКАЗА\n\n" +
              "Шаг 1 из 5 🌸\n\n" +"Какой букет вы хотите?\n\n" +
              "Например:\n" +
              "«Нежный букет из роз»\n" +
              "или\n" +
              "«Букет на день рождения»"
          );

          return new Response("OK");
        }

        // Шаг 1 — букет
        if (savedOrder && savedOrder.step === "bouquet") {
          savedOrder.bouquet = text;
          savedOrder.step = "budget";

          await env.ORDERS.put(
            String(chatId),
            JSON.stringify(savedOrder),
            { expirationTtl: 86400 }
          );

          await sendMessage(
            env,
            chatId,
            "💰 Шаг 2 из 5\n\n" +
              "Какой у вас бюджет на букет?\n\n" +
              "Например: 3500 ₽"
          );

          return new Response("OK");
        }

        // Шаг 2 — бюджет
        if (savedOrder && savedOrder.step === "budget") {
          savedOrder.budget = text;
          savedOrder.step = "date";

          await env.ORDERS.put(
            String(chatId),
            JSON.stringify(savedOrder),
            { expirationTtl: 86400 }
          );

          await sendMessage(
            env,
            chatId,
            "📅 Шаг 3 из 5\n\n" +
              "На какую дату и время нужен букет?\n\n" +
              "Например:\n" +
              "«21 ноября к 19:00»"
          );

          return new Response("OK");
        }

        // Шаг 3 — дата и время
        if (savedOrder && savedOrder.step === "date") {
          savedOrder.date = text;
          savedOrder.step = "delivery";

          await env.ORDERS.put(
            String(chatId),
            JSON.stringify(savedOrder),
            { expirationTtl: 86400 }
          );

          await sendMessage(
            env,
            chatId,
            "🚚 Шаг 4 из 5\n\n" +
              "Как вы хотите получить букет?\n\n" +
              "Напишите:\n" +
              "• Доставка\n" +
              "или\n" +
              "• Самовывоз"
          );

          return new Response("OK");
        }

        // Шаг 4 — доставка
        if (savedOrder && savedOrder.step === "delivery") {
          savedOrder.delivery = text;

          if (
            text.toLowerCase().includes("достав") ||
            text.toLowerCase().includes("курьер")
          ) {
            savedOrder.step = "address";

            await env.ORDERS.put(
              String(chatId),
              JSON.stringify(savedOrder),
              { expirationTtl: 86400 }
            );

            await sendMessage(
              env,
              chatId,
              "📍 Шаг 5 из 5\n\n" +
                "Напишите адрес доставки."
            );

            return new Response("OK");
          }

          savedOrder.address = "Самовывоз";
          savedOrder.step = "name";

          await env.ORDERS.put(
            String(chatId),
            JSON.stringify(savedOrder),
            { expirationTtl: 86400 }
          );

          await sendMessage(
            env,
            chatId,
            "👤 Напишите ваше имя и номер телефона одним сообщением.\n\n" +
              "Например:\n" +
              "Иван, +7 999 123-45-67"
          );

          return new Response("OK");
        }

        // Адрес доставки
        if (savedOrder && savedOrder.step === "address") {
          savedOrder.address = text;
          savedOrder.step = "name";

          await env.ORDERS.put(
            String(chatId),
            JSON.stringify(savedOrder),
            { expirationTtl: 86400 }
          );

          await sendMessage(
            env,
            chatId,
            "👤 Последний шаг!\n\n" +
              "Напишите ваше имя и номер телефона одним сообщением.\n\n" +
              "Например:\n" +
              "Иван, +7 999 123-45-67"
          );

          return new Response("OK");
        }
        
// Имя и телефон + проверка телефона
if (savedOrder && savedOrder.step === "name") {

const phoneMatch = text.match(
/(?:\+7|8)\s*(?:\d{3})?[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/
);

if (!phoneMatch) {
await sendMessage(
env,
chatId,
"⚠️ Не удалось найти номер телефона.\n\n" +
"Пожалуйста, напишите имя и номер телефона одним сообщением.\n\n" +
"Например:\n" +
"Иван, +7 999 123-45-67"
);

return new Response("OK");
}

savedOrder.name = text;

const orderText =
"🌸 НОВЫЙ ЗАКАЗ\n\n" +
"🔢 Номер: " + savedOrder.orderNumber + "\n" +
"💐 Букет: " + savedOrder.bouquet + "\n" +
"💰 Бюджет: " + savedOrder.budget + "\n" +
"📅 Дата и время: " + savedOrder.date + "\n" +
"🚚 Получение: " + savedOrder.delivery + "\n" +
"📍 Адрес: " + (savedOrder.address || "Самовывоз") + "\n" +
"👤 Клиент: " + savedOrder.name + "\n\n" +
"📱 Telegram: " + telegramUsername + "\n" +
"👋 Имя в Telegram: " + telegramName + "\n" +
"🆔 ID: " + chatId;

console.log("NEW ORDER:", orderText);

// Отправляем заказ в Flower Admin
await sendAdminMessage(
env,
orderText
);

// Пока оставляем старую отправку как резерв
await sendMessage(
env,
"641017166",
orderText
);

// Сохраняем заказ в KV до подтверждения оплаты
savedOrder.step = "payment_pending";
savedOrder.paymentStatus = "pending";

await env.ORDERS.put(
  String(chatId),
  JSON.stringify(savedOrder),
  { expirationTtl: 86400 }
);

  // CRM — сохраняем информацию о заказе
if (env.CRM) {
  const crmKey = String(chatId);

  let client = await env.CRM.get(crmKey, "json");

  if (client) {
    // Увеличиваем количество заказов
    client.ordersCount = (client.ordersCount || 0) + 1;

    // Создаём массив истории, если его ещё нет
    if (!Array.isArray(client.orders)) {
      client.orders = [];
    }

    // Создаём новый заказ
    const newOrder = {
      orderNumber: savedOrder.orderNumber,
      bouquet: savedOrder.bouquet,
      budget: savedOrder.budget,
      date: savedOrder.date,
      delivery: savedOrder.delivery,
      address: savedOrder.address || "Самовывоз",
      clientName: savedOrder.name,
      createdAt: new Date().toISOString()
    };

    // Добавляем новый заказ в историю
    client.orders.push(newOrder);

    // Последний заказ
    client.lastOrder = newOrder;

    // Статус клиента
    client.status =
      client.ordersCount > 1
        ? "repeat"
        : "ordered";

    // Последний контакт
    client.lastContact = new Date().toISOString();

    await env.CRM.put(
      crmKey,
      JSON.stringify(client)
    );
  }
}

// ================================
// ОПЛАТА ЗАКАЗА
// ================================

const paymentAmount =
  savedOrder.bouquetPrice ||
  savedOrder.budget ||
  "Сумма уточняется";

await sendMessage(
  env,
  chatId,
  "🌸 ЗАКАЗ " + savedOrder.orderNumber + "\n\n" +
  "💐 Букет: " + savedOrder.bouquet + "\n" +
  "💰 К оплате: " + paymentAmount + "\n\n" +

  "💳 ОПЛАТА ПЕРЕВОДОМ\n\n" +

  "Переведите указанную сумму на карту Яндекс Пэй:\n\n" +
  "💳 " + env.PAYMENT_CARD + "\n\n" +

  "После перевода нажмите кнопку «📸 Я оплатил».\n" +
  "Затем отправьте скриншот перевода.\n\n" +

  "После проверки платежа менеджер подтвердит заказ. 🌸",
  [
    ["📸 Я оплатил"]
  ]
);

return new Response("OK");

        // ================================
        // ПОЛУЧЕНИЕ PHOTO FILE ID
        // ================================

if (update.message.photo) {

  const photos = update.message.photo;
  const photo = photos[photos.length - 1];

  await sendAdminBotMessage(
    env,
    chatId,
    "📸 PHOTO FILE ID:\n\n" +
    photo.file_id
  );

  return new Response("OK");
}
// Обычный вопрос → AI
const answer = await askAI(
  env,
  chatId,
  text
);

// Отправляем клиенту ответ AI
await sendMessage(
  env,
  chatId,
  answer
);

// Сохраняем лог общения для Flower Admin
await sendAdminMessage(
  env,
  "💬 ДИАЛОГ С КЛИЕНТОМ\n\n" +
  "👤 Имя: " + telegramName + "\n" +
  "📱 Telegram: " + telegramUsername + "\n" +
  "🆔 ID: " + chatId + "\n\n" +
  "👤 Клиент:\n" +
  text + "\n\n" +
  "🤖 FLOWERRR AI:\n" +
  answer
);

return new Response("OK");

    } catch (error) {

      console.error("TELEGRAM WEBHOOK ERROR:", error);

      return new Response("OK");
    }

    return new Response("FLOWERRR AI 🌸");
  }
};

// Отправка сообщения владельцу через Admin Bot
async function sendAdminMessage(env, text) {
const response = await fetch(
"https://api.telegram.org/bot" +
env.ADMIN_BOT_TOKEN +
"/sendMessage",
{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
chat_id: "641017166",
text: text
})
}
);

const result = await response.json();

console.log(
"ADMIN BOT RESPONSE:",
JSON.stringify(result)
);

return result;
}

async function sendAdminBotMessage(env, chatId, text, keyboard) {
  const body = {
    chat_id: chatId,
    text: text
  };

  if (keyboard) {
    body.reply_markup = {
      keyboard: keyboard,
      resize_keyboard: true
    };
  }

  const telegramUrl =
    "https://api.telegram.org/bot" +
    env.ADMIN_BOT_TOKEN +
    "/sendMessage";

  const response = await fetch(telegramUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const result = await response.text();

  console.log("Admin Telegram response:", result);
}

async function sendAdminMenu(env, chatId) {
  await sendAdminBotMessage(
    env,
    chatId,
    "🌸 FLOWERRR CRM\n\n" +
    "Добро пожаловать в панель управления.\n\n" +
    "Выберите раздел:",
    [
      ["📋 Заказы", "👥 Клиенты"],
      ["💬 Диалоги", "📊 Статистика"]
    ]
  );
}

async function sendAdminClients(env, chatId) {
  if (!env.CRM) {
    await sendAdminBotMessage(
      env,
      chatId,
      "⚠️ CRM KV не подключён."
    );

    return;
  }

  const list = await env.CRM.list();

  if (!list.keys.length) {
    await sendAdminBotMessage(
      env,
      chatId,
      "👥 КЛИЕНТЫ\n\n" +
      "Пока клиентов нет."
    );

    return;
  }

  let message = "👥 КЛИЕНТЫ\n\n";

  let number = 1;

  for (const key of list.keys) {
    const client = await env.CRM.get(key.name, "json");

    if (!client) {
      continue;
    }

    const orders = Array.isArray(client.orders)
      ? client.orders
      : [];

    message +=
      number + ". 👤 " +
      (client.telegramName || "Без имени") +
      "\n" +
      "📱 " +
      (client.telegramUsername || "не указан") +
      "\n" +
      "📦 Заказов: " +
      orders.length +
      "\n\n";

    number++;
  }

  await sendAdminBotMessage(
    env,
    chatId,
    message
  );
}

async function sendAdminOrders(env, chatId) {
  if (!env.CRM) {
    await sendAdminBotMessage(
      env,
      chatId,
      "⚠️ CRM KV не подключён."
    );

    return;
  }

  const list = await env.CRM.list();

  if (!list.keys.length) {
    await sendAdminBotMessage(
      env,
      chatId,
      "📋 ЗАКАЗЫ\n\n" +
      "Пока заказов нет."
    );

    return;
  }

  for (const key of list.keys) {
    const client = await env.CRM.get(key.name, "json");

    if (!client) {
      continue;
    }

    const orders = Array.isArray(client.orders)
      ? client.orders
      : [];

    for (const order of orders) {
      await sendAdminBotMessage(
        env,
        chatId,
        "📋 НОВЫЙ ЗАКАЗ\n\n" +
        "🔢 " + (order.orderNumber || "—") + "\n" +
        "👤 " + (client.telegramName || "—") + "\n" +
        "📱 " + (client.telegramUsername || "не указан") + "\n\n" +
        "💐 Букет: " + (order.bouquet || "—") + "\n" +
        "💰 Бюджет: " + (order.budget || "—") + "\n" +
        "📅 Дата: " + (order.date || "—") + "\n" +
        "🚚 Получение: " + (order.delivery || "—") + "\n" +
        "📍 Адрес: " + (order.address || "Самовывоз") + "\n" +
        "👤 Клиент: " + (order.clientName || order.name || "—")
      );
    }
  }
}

async function askAI(env, chatId, userText) {
const historyKey = String(chatId);

// Получаем историю предыдущего диалога
let history = [];

if (env.CHAT_HISTORY) {
history = await env.CHAT_HISTORY.get(historyKey, "json") || [];
}

// Добавляем сообщение клиента
history.push({
role: "user",
content: userText
});

// Оставляем только последние 10 сообщений
if (history.length > 10) {
history = history.slice(-10);
}

const systemPrompt =
"Ты — виртуальный консультант цветочного магазина «FLOWERRR AI 🌸».\n\n" +

"ТВОЯ РОЛЬ:\n" +
"Ты — онлайн-консультант FLOWERRR. Твоя задача — помочь клиенту выбрать подходящий букет, ответить на вопросы и мягко привести клиента к оформлению заказа.\n" +
"Ты не являешься менеджером и не принимаешь окончательное решение по наличию, составу или возможности выполнения индивидуального заказа.\n\n" +

"ИНФОРМАЦИЯ О МАГАЗИНЕ:\n" +
"- FLOWERRR — цветочный магазин с авторскими букетами под заказ.\n" +
"- Основной каталог FLOWERRR включает 8 авторских букетов.\n" +
"- Цены на букеты из основного каталога — от 5 490 ₽ до 6 490 ₽.\n" +
"- Также у FLOWERRR есть отдельный раздел SPECIAL BOUQUETS.\n" +
"- SPECIAL BOUQUETS — это сладкие и необычные букеты.\n" +
"- Цены на SPECIAL BOUQUETS — от 4 990 ₽ до 11 990 ₽.\n" +
"- Букеты создаются под заказ.\n" +
"- Доставка рассчитывается индивидуально в зависимости от адреса и времени.\n" +
"- Точный состав букета, наличие конкретных цветов, сладостей и других элементов, а также возможность собрать индивидуальный вариант подтверждает менеджер.\n\n" +

"ВАЖНЫЕ ЦЕНЫ:\n" +
"- Основной каталог: от 5 490 ₽ до 6 490 ₽.\n" +
"- SPECIAL BOUQUETS: от 4 990 ₽ до 11 990 ₽.\n" +
"- Не используй старые цены «от 2 500 ₽», «от 3 000 ₽» или «от 4 000 ₽» как актуальные цены FLOWERRR.\n" +
"- Не упоминай старые категории цен, которых сейчас нет в информации магазина.\n" +
"- Не упоминай букеты к 1 сентября и другие сезонные предложения, если клиент сам прямо об этом не спрашивает.\n\n" +

"СТИЛЬ ОБЩЕНИЯ:\n" +
"- Общайся естественно, как живой консультант премиального цветочного магазина.\n" +
"- Отвечай коротко и по делу: обычно 2–5 предложений.\n" +
"- Будь доброжелательным, уверенным и ненавязчивым.\n" +
"- Используй эмодзи умеренно.\n" +
"- Не начинай каждый ответ со слов «Конечно!» или «Отличный выбор!».\n" +
"- Не используй слишком официальный или роботизированный язык.\n" +
"- Не перегружай клиента длинными описаниями без необходимости.\n" +
"- Если клиент хочет выбрать подарок, помоги ему принять решение, а не просто перечисляй варианты.\n\n" +

"ЗАПРЕТ НА ВЫДУМЫВАНИЕ:\n" +
"- Не придумывай наличие цветов.\n" +
"- Не придумывай наличие сладостей или других элементов SPECIAL BOUQUETS.\n" +
"- Не придумывай количество цветов или сладостей.\n" +
"- Не придумывай состав конкретного букета, если он не указан в доступной информации.\n" +
"- Не придумывай сорта цветов.\n" +
"- Не придумывай точную цену конкретного букета, если она тебе неизвестна.\n" +
"- Не обещай доставку к конкретному времени.\n" +
"- Не говори, что заказ подтверждён.\n" +
"- Не говори, что товар есть в наличии, если это не указано явно.\n" +
"- Если клиент спрашивает то, чего ты не знаешь, честно скажи: «Точное наличие и возможность уточним у менеджера».\n\n" +

"ОСНОВНОЙ КАТАЛОГ:\n" +
"- В основном каталоге 8 авторских букетов.\n" +
"- Их актуальный диапазон цен: от 5 490 ₽ до 6 490 ₽.\n" +
"- Если клиент спрашивает о каталоге, можно предложить открыть раздел «💐 Каталог».\n" +
"- Если клиент называет конкретное название букета из каталога, не придумывай его состав, если состав не указан в доступной информации.\n" +
"- Для просмотра конкретного букета предложи открыть каталог.\n\n" +

"SPECIAL BOUQUETS:\n" +
"- SPECIAL BOUQUETS — отдельный раздел FLOWERRR.\n" +
"- В нём представлены сладкие и необычные букеты.\n" +
"- Диапазон цен SPECIAL BOUQUETS: от 4 990 ₽ до 11 990 ₽.\n" +
"- Если клиент хочет необычный подарок, можно предложить рассмотреть SPECIAL BOUQUETS.\n" +
"- Не придумывай состав конкретного SPECIAL BOUQUET, если он не указан в информации магазина.\n" +
"- Если клиент спрашивает, можно ли сделать необычный букет с определёнными сладостями или предметами, скажи, что возможность нужно уточнить у менеджера.\n\n" +

"ЕСЛИ КЛИЕНТ СПРАШИВАЕТ О ЦВЕТАХ:\n" +
"Можно рассказать о символике цветов, сочетаниях, настроении и общих особенностях растений.\n" +
"Но нельзя утверждать, что конкретный цветок есть в наличии.\n\n" +

"ЕСЛИ КЛИЕНТ НАЗВАЛ БЮДЖЕТ:\n" +
"- Сначала сравни бюджет клиента с актуальными ценовыми диапазонами FLOWERRR.\n" +
"- Основной каталог: 5 490–6 490 ₽.\n" +
"- SPECIAL BOUQUETS: 4 990–11 990 ₽.\n" +
"- Не придумывай конкретный состав букета только ради того, чтобы уложиться в бюджет.\n" +
"- Если бюджет подходит под один из диапазонов, предложи соответствующий раздел.\n" +
"- Если бюджет ниже минимальной цены, честно сообщи об этом и предложи посмотреть варианты, которые начинаются от актуальной минимальной цены.\n\n" +

"ЕСЛИ КЛИЕНТ СПРАШИВАЕТ «ЧТО ПОДАРИТЬ ДЕВУШКЕ»:\n" +
"- Уточни повод и бюджет, если они ещё неизвестны.\n" +
"- Если повод и бюджет уже известны из истории диалога — не спрашивай их повторно.\n" +
"- После этого предложи подходящее направление: основной каталог или SPECIAL BOUQUETS.\n\n" +

"ЕСЛИ КЛИЕНТ СПРАШИВАЕТ «ЧТО ПОДАРИТЬ МАМЕ»:\n" +
"- Можно предложить классический или авторский цветочный букет либо необычный SPECIAL BOUQUET.\n" +
"- Не придумывай конкретный состав, если он не указан.\n\n" +

"ЕСЛИ КЛИЕНТ ХОЧЕТ НЕОБЫЧНЫЙ ПОДАРОК:\n" +
"- В первую очередь предложи посмотреть SPECIAL BOUQUETS.\n" +
"- Объясни, что там представлены сладкие и необычные букеты.\n" +
"- Если клиент хочет конкретную идею, которой нет в известной тебе информации, скажи, что возможность реализации уточнит менеджер.\n\n" +

"ЕСЛИ КЛИЕНТ НАЗЫВАЕТ КОНКРЕТНЫЙ БУКЕТ ИЛИ КОЛИЧЕСТВО ЦВЕТОВ:\n" +
"- Не говори, что это невозможно, если у тебя нет такой информации.\n" +
"- Скажи, что возможность собрать такой вариант нужно уточнить у менеджера.\n\n" +

"ЕСЛИ КЛИЕНТ ГОТОВ ЗАКАЗАТЬ:\n" +
"- Предложи нажать кнопку «📝 Заказать букет».\n" +
"- Не говори, что заказ уже принят или подтверждён, пока клиент не прошёл оформление.\n\n" +

"ЕСЛИ КЛИЕНТ ХОЧЕТ МЕНЕДЖЕРА:\n" +
"- Не продолжай консультацию вместо менеджера.\n" +
"- Напомни, что можно воспользоваться кнопкой «👨‍💼 Позвать менеджера».\n\n" +

"ПАМЯТЬ ДИАЛОГА:\n" +
"- Учитывай предыдущие сообщения клиента.\n" +
"- Если клиент уже сообщил повод, бюджет, получателя, дату или предпочтения — используй эти данные дальше.\n" +
"- Не заставляй клиента повторять информацию.\n" +
"- Если клиент сначала говорил о букете для девушки, а потом спрашивает о вариантах, учитывай первоначальный контекст.\n\n" +

"ДОСТАВКА:\n" +
"- Доставка рассчитывается индивидуально по адресу и времени.\n" +
"- Не называй стоимость доставки без подтверждённой информации.\n" +
"- Не обещай конкретное время доставки.\n" +
"- Для точного расчёта попроси адрес и необходимое время, после чего передай вопрос менеджеру.\n\n" +

"ЕСЛИ ИНФОРМАЦИИ НЕДОСТАТОЧНО:\n" +
"- Не выдумывай ответ.\n" +
"- Лучше задай один короткий уточняющий вопрос.\n" +
"- Если вопрос требует решения менеджера, прямо скажи об этом.\n\n" +

"ВАЖНО:\n" +
"- Ты консультант FLOWERRR, а не менеджер.\n" +
"- Не выдавай предположения за факты.\n" +
"- Не используй устаревшие цены и старые категории магазина.\n" +
"- Не обещай наличие, доставку или подтверждение заказа без соответствующей информации.\n" +
"- Твоя задача — помочь клиенту быстро сориентироваться и привести его к заказу.\n\n" +

"Отвечай на русском языке.";

const result = await env.AI.run(
"@cf/meta/llama-3.1-8b-instruct-fast",
{
messages: [
{
role: "system",
content: systemPrompt
},
...history
],
max_tokens: 300
}
);

const answer =
result.response ||
"🌸 Сейчас не смогли обработать сообщение. Напишите ещё раз, пожалуйста.";

// Сохраняем ответ AI в историю
history.push({
role: "assistant",
content: answer
});

// Снова ограничиваем историю
if (history.length > 10) {
history = history.slice(-10);
}

// Сохраняем историю в KV
if (env.CHAT_HISTORY) {
await env.CHAT_HISTORY.put(
historyKey,
JSON.stringify(history),
{
expirationTtl: 604800
}
);
}

return answer;
}


async function sendMessage(env, chatId, text, keyboard) {
  const body = {
    chat_id: chatId,
    text: text
  };

  if (keyboard) {
    body.reply_markup = {
      keyboard: keyboard,
      resize_keyboard: true
    };
  }

  const telegramUrl =
    "https://api.telegram.org/bot" +
    env.TELEGRAM_TOKEN +
    "/sendMessage";

  const response = await fetch(telegramUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const result = await response.text();

  console.log("Telegram response:", result);
}

// ================================
// ОТПРАВКА ФОТО
// ================================
async function sendPhoto(env, chatId, photo, caption, keyboard) {
  const body = {
    chat_id: chatId,
    photo: photo,
    caption: caption
  };
  if (keyboard) {
    body.reply_markup = {
      keyboard: keyboard,
      resize_keyboard: true
    };
  }
  const response = await fetch(
    "https://api.telegram.org/bot" +
    env.TELEGRAM_TOKEN +
    "/sendPhoto",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
  const result = await response.json();
  console.log(
    "SEND PHOTO TELEGRAM RESULT:",
    JSON.stringify(result)
  );
  return result;
}

// ================================
// ИЗМЕНЕНИЕ ФОТО В КАТАЛОГЕ
// ================================
async function editCatalogPhoto(
  env,
  chatId,
  messageId,
  photo,
  caption
) {
  const response = await fetch(
    "https://api.telegram.org/bot" +
      env.TELEGRAM_TOKEN +
      "/editMessageMedia",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        media: {
          type: "photo",
          media: photo,
          caption: caption
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "⬅️ Предыдущий",
                callback_data: "catalog_prev"
              },
              {
                text: "Следующий ➡️",
                callback_data: "catalog_next"
              }
            ],
            [
              {
                text: "📝 Заказать этот букет",
                callback_data: "catalog_order"
              }
            ],
            [
              {
                text: "🏠 В меню",
                callback_data: "catalog_menu"
              }
            ]
          ]
        }
      })
    }
  );

  const result = await response.text();

  console.log(
    "EDIT CATALOG PHOTO:",
    result
  );

  return result;
}
//Test deployment
