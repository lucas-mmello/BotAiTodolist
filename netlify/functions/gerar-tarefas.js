// const { Configuration, OpenAIApi } = require("openai");

// const openai = new OpenAIApi(
//   new Configuration({ apiKey: process.env.OPENAI_API_KEY })
// );

import { HfInference, InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";
global.fetch = fetch;

const openai = new InferenceClient(process.env.OPENAI_API_KEY, {
  fetch: fetch,
});

exports.handler = async (event) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://todolist-local-cicd.netlify.app",
  ];

  const origin = event.headers.origin;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };

  // Pré-flight request (CORS)
  if (event.httpMethod === "OPTIONS") {
    console.log("OPTIONS request");
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Método não permitido. Use POST." }),
    };
  }

  const input = JSON.parse(event.body)?.input;
  if (!input || typeof input !== "string") {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Input inválido" }),
    };
  }

  try {
    console.log("Input:", input);
    // const completion = await openai.createChatCompletion({
    //   model: "gpt-3.5-turbo",
    //   temperature: 0.7,
    //   messages: [
    //     {
    //       role: "system",
    //       content:
    //         'Você é um assistente que gera tarefas em formato JSON para uma lista de tarefas. Cada item deve conter "title", "description" e "text". Retorne apenas um array JSON.',
    //     },
    //     { role: "user", content: input },
    //   ],
    // });
    // console.log("Resposta:", completion.data?.choices[0]?.message?.content);
    // const content = completion.data.choices[0]?.message?.content;
    // const tarefas = JSON.parse(content || "[]");

    const response = await openai.textGeneration({
      provider: "together",
      model: "mistralai/Mixtral-8x7B-v0.1",
      inputs: `Você é um gerador de tarefas para uma lista. Gere um array JSON com tarefas. Cada tarefa deve ter os campos: "title", "description" e "text". NÃO adicione explicações ou texto extra. Responda apenas com o JSON.

      Exemplo de formato:
      
      [
        {
          "title": "Aula de piano",
          "description": "Lembrar da aula de piano às 15h",
          "text": "Aula de piano"
        }
      ]
      
      Pedido do usuário: ${input}`,
      parameters: {
        max_new_tokens: 70,
        temperature: 0.7,
      },
    });

    const rawText = response.generated_text;
    console.log("response", response);
    console.log("Resposta:", rawText);

    let tarefas = [];
    try {
      // Tenta extrair apenas o array JSON de dentro do texto
      const jsonMatch = rawText.match(/\[.*\]/s);
      if (jsonMatch) {
        tarefas = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON não encontrado na resposta.");
      }
    } catch (parseError) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Erro ao interpretar a resposta da IA.",
        }),
      };
    }
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, data: tarefas }),
    };
  } catch (error) {
    console.error("Erro:", error.message);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
