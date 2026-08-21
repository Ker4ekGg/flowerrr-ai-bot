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

    // Проверка Worker
    if (url.pathname === "/") {
      return new Response("FLOWERRR AI 🌸 Бот работает!");
    }

    // Установка Telegram webhook
    if (url.pathname === "/setup") {
      const webhookUrl = url.origin + "/telegram";

      const telegramUrl =
        "https://api.telegram.org/bot" +
        env.TELEGRAM_TOKEN +
        "/setWebhook?url=" +
        encodeURIComponent(webhookUrl);

      const response = await fetch(telegramUrl);
      const result = await response.json();

      return new Response(JSON.stringify(result, null, 2), {
        headers: {
          "Content-Type": "application/json"
        }
      });
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

        // Получаем текущее состояние заказа
       const savedOrder = env.ORDERS
  ? await env.ORDERS.get(String(chatId), "json")
  : null;
        // /start
        if (text === "/start") {
          if (env.ORDERS) {
            await env.ORDERS.delete(String(chatId));
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
              ["🚚 Доставка", "💬 Задать вопрос"]
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

       // Имя и телефон
if (savedOrder && savedOrder.step === "name") {
// Проверяем имя и телефон
if (savedOrder && savedOrder.step === "name") {
const phoneMatch = text.match(/(?:\+7|8)\s*\(?\d{3}\)?[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/);

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
        const answer = await askAI(env, text);

        await sendMessage(env, chatId, answer);

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


async function askAI(env, userText) {
  const systemPrompt =
    "Ты — консультант цветочного магазина «Цветы/букеты под заказ».\n\n" +
    "Помогай клиентам выбрать букет, отвечай на вопросы и помогай оформить заказ.\n\n" +
    "Общайся дружелюбно, коротко и понятно.\n" +
    "Используй эмодзи умеренно.\n" +
    "Не выдумывай наличие конкретных цветов.\n" +
    "Если клиент хочет заказать букет, предложи нажать «📝 Заказать букет».\n" +
    "Если не знаешь точную информацию, скажи, что уточнишь у менеджера.\n\n" +
    "Магазин продаёт букеты под заказ.";

  const result = await env.AI.run(
    "@cf/meta/llama-3.1-8b-instruct-fast",
    {
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userText
        }
      ],
      max_tokens: 300
    }
  );

  return (
    result.response ||
    "🌸 Сейчас не смогли обработать сообщение. Напишите ещё раз, пожалуйста."
  );
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
