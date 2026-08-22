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
        if (!update.message) {
          return new Response("OK");
        }

        const chatId = update.message.chat.id;
        const text = update.message.text || "";
        
        const telegramUsername = update.message.from?.username
? "@" + update.message.from.username
: "не указан";

const telegramName = update.message.from?.first_name || "не указано";

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
["🌸 Букеты", "🎓 1 сентября"],
["💰 Цены", "📝 Заказать букет"],
["🚚 Доставка", "💬 Задать вопрос"],
["👨‍💼 Позвать менеджера"]
          ]
          );

          return new Response("OK");
        }

        // Каталог
        if (text === "🌸 Букеты") {
          await sendMessage(
            env,
            chatId,
            "🌸 НАШИ БУКЕТЫ\n\n" +
              "💐 Классический — от 2 500 ₽\n" +
              "🌷 Нежный — от 3 000 ₽\n" +
              "🌹 Розовый — от 3 500 ₽\n" +
              "🌼 Яркий — от 3 500 ₽\n" +
              "✨ Авторский — от 4 000 ₽\n\n" +
              "Для заказа нажмите «📝 Заказать букет»."
          );

          return new Response("OK");
        }

        // 1 сентября
        if (text === "🎓 1 сентября") {
          await sendMessage(
            env,
            chatId,
            "🎓 БУКЕТЫ К 1 СЕНТЯБРЯ 🌸\n\n" +
              "🌸 Компактные — от 2 500 ₽\n" +
              "💐 Средние — от 3 500 ₽\n" +
              "🌹 Большие — от 4 500 ₽\n" +
              "✨ Авторские — от 5 000 ₽\n\n" +
              "Можно подобрать букет под ваш бюджет 💐\n\n" +
              "Для заказа нажмите «📝 Заказать букет»."
          );

          return new Response("OK");
        }

        // Цены
        if (text === "💰 Цены") {
          await sendMessage(
            env,
            chatId,
            "💰 ЦЕНЫ\n\n" +
              "🌸 Букеты — от 2 500 ₽\n" +
              "🎓 Букеты к 1 сентября — от 2 500 ₽\n" +
              "✨ Авторские букеты — от 4 000 ₽\n\n" +
              "Напишите ваш бюджет — предложим подходящий вариант."
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
              "«Букет к 1 сентября»"
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
              "«1 сентября к 10:00»"
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

// Удаляем заказ из KV
await env.ORDERS.delete(String(chatId));

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

// Подтверждение клиенту
await sendMessage(
env,
chatId,
"✅ Спасибо! Заявка принята.\n\n" +
"Мы проверим детали заказа и свяжемся с вами для подтверждения. 🌸\n\n" +
"Если хотите, можете задать любой вопрос."
);

return new Response("OK");
}

// Обычный вопрос → AI
const answer = await askAI(env, chatId, text);

// Отправляем клиенту ответ AI
await sendMessage(env, chatId, answer);

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
console.error(error);
return new Response("OK");
}
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

async function sendAdminMenu(env, chatId) {
  await sendMessage(
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

async function sendAdminOrders(env, chatId) {
  if (!env.CRM) {
    await sendMessage(
      env,
      chatId,
      "⚠️ CRM KV не подключён."
    );

    return;
  }

  const list = await env.CRM.list();

  if (!list.keys.length) {
    await sendMessage(
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
      await sendMessage(
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

"ТВОЯ ЦЕЛЬ:\n" +
"Помочь клиенту выбрать букет и мягко привести его к оформлению заказа.\n\n" +

"ИНФОРМАЦИЯ О МАГАЗИНЕ:\n" +
"- Букеты создаются под заказ.\n" +
"- Классические букеты — от 2 500 ₽.\n" +
"- Нежные букеты — от 3 000 ₽.\n" +
"- Розовые букеты — от 3 500 ₽.\n" +
"- Яркие букеты — от 3 500 ₽.\n" +
"- Авторские букеты — от 4 000 ₽.\n" +
"- Букеты к 1 сентября: компактные — от 2 500 ₽, средние — от 3 500 ₽, большие — от 4 500 ₽, авторские — от 5 000 ₽.\n" +
"- Доставка рассчитывается индивидуально по адресу и времени.\n" +
"- Точный состав букета, наличие конкретных цветов и возможность собрать конкретный букет подтверждает менеджер.\n\n" +

"СТИЛЬ:\n" +
"- Общайся естественно, как живой консультант цветочного магазина.\n" +
"- Отвечай коротко: обычно 2–5 предложений.\n" +
"- Будь доброжелательным и уверенным.\n" +
"- Используй эмодзи умеренно.\n" +
"- Не начинай каждый ответ со слов «Конечно!» или «Отличный выбор!».\n" +
"- Не повторяй один и тот же вопрос, если клиент уже дал на него ответ.\n" +
"- Используй информацию из предыдущих сообщений клиента.\n\n" +

"ЗАПРЕТ НА ВЫДУМЫВАНИЕ:\n" +
"- Не придумывай наличие цветов.\n" +
"- Не придумывай количество цветов.\n" +
"- Не придумывай состав букета.\n" +
"- Не придумывай сорта цветов.\n" +
"- Не придумывай точную цену, если её нет в информации магазина.\n" +
"- Не обещай доставку к конкретному времени.\n" +
"- Не говори, что заказ подтверждён.\n" +
"- Если клиент спрашивает то, чего ты не знаешь, честно скажи: «Точное наличие и возможность уточним у менеджера».\n\n" +

"ЕСЛИ КЛИЕНТ СПРАШИВАЕТ О ЦВЕТАХ:\n" +
"Можно рассказать о символике, цветах, сочетаниях и общих особенностях растений. " +
"Но нельзя утверждать, что конкретный цветок есть в наличии.\n\n" +

"ЕСЛИ КЛИЕНТ НАЗВАЛ БЮДЖЕТ:\n" +
"Не придумывай конкретный состав букета.\n" +
"Ориентируйся на указанные цены магазина и объясни, что точный состав зависит от цветов и их наличия.\n\n" +

"ЕСЛИ КЛИЕНТ СПРАШИВАЕТ «ЧТО ПОДАРИТЬ ДЕВУШКЕ»:\n" +
"Уточни повод и бюджет, если они ещё неизвестны.\n" +
"Если повод и бюджет уже известны из истории — не спрашивай их повторно.\n\n" +

"ЕСЛИ КЛИЕНТ СПРАШИВАЕТ «ЧТО ПОДАРИТЬ МАМЕ»:\n" +
"Можно предложить нежные, классические или яркие варианты, но не придумывай конкретный состав.\n\n" +

"ЕСЛИ КЛИЕНТ НАЗЫВАЕТ КОНКРЕТНЫЙ БУКЕТ ИЛИ КОЛИЧЕСТВО ЦВЕТОВ:\n" +
"Не говори, что это невозможно, если у тебя нет такой информации.\n" +
"Скажи, что возможность собрать такой букет нужно уточнить у менеджера.\n\n" +

"ЕСЛИ КЛИЕНТ ГОТОВ ЗАКАЗАТЬ:\n" +
"Предложи нажать кнопку «📝 Заказать букет».\n\n" +

"ЕСЛИ КЛИЕНТ ХОЧЕТ МЕНЕДЖЕРА:\n" +
"Не продолжай консультацию. Клиент уже может воспользоваться кнопкой «👨‍💼 Позвать менеджера».\n\n" +

"ПАМЯТЬ ДИАЛОГА:\n" +
"Учитывай предыдущие сообщения клиента.\n" +
"Если клиент уже сказал повод, бюджет, получателя или предпочтения — используй эти данные дальше.\n" +
"Не заставляй клиента повторять информацию.\n\n" +

"ВАЖНО:\n" +
"Ты консультант, а не менеджер. Не выдавай предположения за факты.\n" +
"Если информации недостаточно — лучше задать один короткий уточняющий вопрос.\n\n" +

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
//Test deployment
