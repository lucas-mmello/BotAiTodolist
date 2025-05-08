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

  try {
    const body = JSON.parse(event.body);
    const { input, history } = body;
    console.log("Input:", input, "History:", history);
    if (!input || typeof input !== "string") {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Input inválido." }),
      };
    }
    const prompt =
      (Array.isArray(history)
        ? history
            .map(
              (m) =>
                `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`
            )
            .join("\n")
        : "") + `\nUsuário: ${input}\nAssistente:`;
    const response = await hf.textGeneration({
      model: "gpt2-medium",
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7,
      },
      options: {
        wait_for_model: true,
      },
    });

    const resposta = response.generated_text.split("Assistente:").pop().trim();
    console.log("response", response);
    console.log("Resposta:", rawText);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, data: resposta }),
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
