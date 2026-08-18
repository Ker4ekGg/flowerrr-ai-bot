export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Проверка Worker
    if (url.pathname === "/") {
      return new Response("FLOWERRR AI 🌸 Бот работает!");
    }

    // Одноразовая установка Telegram webhook
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

    // Получение сообщений от Telegram
    if (url.pathname === "/telegram" && request.method === "POST") {
      try {
        const update = await request.json();

        if (!update.message) {
          return new Response("OK");
        }

        const chatId = update.message.chat.id;
        const text = update.message.text || "";

        // Команда /start
        if (text === "/start") {
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

        // Букеты к 1 сентября
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

        // Заказ
        if (text === "📝 Заказать букет") {
          await sendMessage(
            env,
            chatId,
            "📝 ОФОРМЛЕНИЕ ЗАКАЗА\n\n" +
              "Напишите одним сообщением:\n\n" +
              "1️⃣ Какой букет хотите\n" +
              "2️⃣ Ваш бюджет\n" +
              "3️⃣ Дата и время получения\n" +
              "4️⃣ Самовывоз или доставка\n\n" +
              "Например:\n" +
              "«Нужен букет на 1 сентября, бюджет 3500 ₽, заберу утром» 💐"
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


async function askAI(env, userText) {
  const systemPrompt =
    "Ты — консультант цветочного магазина «Цветы/букеты под заказ».\n\n" +
    "Помогай клиентам выбрать букет, отвечай на вопросы и помогай оформить заказ.\n\n" +
    "Общайся дружелюбно, коротко и понятно.\n" +
    "Используй эмодзи умеренно.\n" +
    "Не выдумывай наличие конкретных цветов.\n" +
    "Если клиент хочет заказать букет, попроси бюджет, дату, время и способ получения.\n" +
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
