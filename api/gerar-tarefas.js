// api/gerar-tarefas.js
const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

module.exports = async (req, res) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://todolist-local-cicd.netlify.app",
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const input = req.body?.input;
  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "Input inválido" });
  }

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            'Você é um assistente que gera tarefas em formato JSON para uma lista de tarefas. Cada item deve conter "title", "description" e "text". Retorne apenas um array JSON.',
        },
        { role: "user", content: input },
      ],
    });

    const content = completion.data.choices[0]?.message?.content;
    const tarefas = JSON.parse(content || "[]");

    res.status(200).json({ success: true, data: tarefas });
  } catch (error) {
    console.error("Erro:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
