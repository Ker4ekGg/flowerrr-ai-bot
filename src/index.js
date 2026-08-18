const MENU = {
  "🌸 Букеты": "Показываем каталог букетов",
  "🎓 1 сентября": "Показываем букеты к 1 сентября",
  "💰 Цены": "Показываем цены",
  "📝 Заказать букет": "Помогаем оформить заказ",
  "🚚 Доставка": "Рассказываем про доставку",
  "💬 Задать вопрос": "Передаем вопрос AI"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Одноразовая настройка Telegram webhook
    if (url.pathname === "/setup") {
      const webhookUrl = ${url.origin}/telegram;

      const response = await fetch(
        https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}
      );

      const result = await response.json();

      return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Telegram webhook
    if (url.pathname === "/telegram" && request.method === "POST") {
      try {
        const update = await request.json();

        if (!update.message) {
          return new Response("OK");
        }

        const chatId = update.message.chat.id;
        const text = update.message.text || "";

        // Главное меню
        if (text === "/start") {
          await sendMessage(env, chatId,
            "🌸 Добро пожаловать в «Цветы/букеты под заказ»!\n\n" +
            "Соберём красивый букет под ваш повод и бюджет 💐\n\n" +
            "Выберите нужный раздел ниже:",
            {
              keyboard: [
                ["🌸 Букеты", "🎓 1 сентября"],
                ["💰 Цены", "📝 Заказать букет"],
                ["🚚 Доставка", "💬 Задать вопрос"]
              ]
            }
          );

          return new Response("OK");
        }

        // Каталог
        if (text === "🌸 Букеты") {
          await sendMessage(env, chatId,
            "🌸 НАШИ БУКЕТЫ\n\n" +
            "💐 Классический — от 2 500 ₽\n" +
            "🌷 Нежный — от 3 000 ₽\n" +
            "🌹 Розовый — от 3 500 ₽\n" +
            "🌼 Яркий — от 3 500 ₽\n" +
            "🌸 Авторский — от 4 000 ₽\n\n" +
            "Хотите заказать? Нажмите «📝 Заказать букет»."
          );

          return new Response("OK");
        }

        // 1 сентября
        if (text === "🎓 1 сентября") {
          await sendMessage(env, chatId,
            "🎓 БУКЕТЫ К 1 СЕНТЯБРЯ 🌸\n\n" +
            "Специальная подборка для школьников и учителей.\n\n" +
            "🌸 Компактные букеты — от 2 500 ₽\n" +
            "💐 Средние букеты — от 3 500 ₽\n" +
            "🌹 Большие букеты — от 4 500 ₽\n" +
            "✨ Авторские композиции — от 5 000 ₽\n\n" +
            "Можно подобрать букет под любой бюджет.\n\n" +
            "Для заказа нажмите «📝 Заказать букет»."
          );

          return new Response("OK");
        }

        // Цены
        if (text === "💰 Цены") {
          await sendMessage(env, chatId,
            "💰 ЦЕНЫ\n\n" +
            "Стоимость зависит от цветов, размера и оформления букета.\n\n" +
            "🌸 Букеты — от 2 500 ₽\n" +
            "🎓 Букеты к 1 сентября — от 2 500 ₽\n" +
            "🎁 Авторские букеты — от 4 000 ₽\n\n" +
            "Если напишете ваш бюджет, мы предложим подходящие варианты 💐"
          );

          return new Response("OK");
        }

        // Доставка
        if (text === "🚚 Доставка") {
          await sendMessage(env, chatId,
            "🚚 ДОСТАВКА\n\n" +
            "Доставка рассчитывается индивидуально в зависимости от адреса и времени.\n\n" +
            "Напишите адрес — мы уточним стоимость доставки."
          );

          return new Response("OK");
        }

        // Заказ
        if (text === "📝 Заказать букет") {
          await sendMessage(env, chatId,
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

        // Любой обычный вопрос отправляем в AI
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
  const systemPrompt = `
Ты — консультант цветочного магазина «Цветы/букеты под заказ».

Твоя задача — помогать клиентам выбрать букет, отвечать на вопросы и помогать оформить заказ.

Стиль общения:
- дружелюбно;
- коротко и понятно;
- без сложных терминов;
- используй эмодзи умеренно;
- не выдумывай наличие конкретных цветов;
- если клиент хочет заказать букет, попроси бюджет, дату, время и способ получения.

Важно:
- не говори клиенту, что ты искусственный интеллект;
- если не знаешь точную информацию, скажи, что уточнишь у менеджера;
- цены называй ориентировочно, если клиент не выбрал конкретный букет.

Магазин находится в районе клиента и работает с букетами под заказ.
`;

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

  return result.response || "🌸 Сейчас не смогли обработать сообщение. Напишите ещё раз, пожалуйста.";
}

async function sendMessage(env, chatId, text, options = {}) {
  const body = {
    chat_id: chatId,
    text
  };

  if (options.keyboard) {
    body.reply_markup = {
      keyboard: options.keyboard,
      resize_keyboard: true
    };
  }

  await fetch(
    https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
}
