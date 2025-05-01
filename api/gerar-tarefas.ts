// api/gerar-tarefas.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log(process.env.OPENAI_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const input = req.body?.input;
  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "Input inválido" });
  }

  try {
    const completion = await openai.chat.completions.create({
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

    const content = completion.choices[0]?.message?.content;
    const tarefas = JSON.parse(content || "[]");

    res.status(200).json({ success: true, data: tarefas });
  } catch (error: any) {
    console.error("Erro na geração:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}
