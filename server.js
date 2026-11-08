import path from "node:path";
import url from "node:url";

import express from "express";
import asyncHandler from "express-async-handler";

import { Ollama } from "@ghasemkiani/ollama";
import { Utils as MarkdownUtils } from "@ghasemkiani/markdown";

const system = `
  Your task is to respond with an HTML document. Send only the HTML code and nothing else.
  The generated page must include a form (with action '/ai' and method 'POST') with fields
  'context' and 'prompt'. The 'context' field must have as value a summary of your ineractions 
  so far. The field 'prompt' withh be provided by the user for the next iteration. So in this iteration,
  you will receive the context and prompt below and you should use them to generate the HTML page
  for the next iteration.
`;

const ollama = new Ollama({ system });

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(path.dirname(url.fileURLToPath(import.meta.url)), "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/ai", asyncHandler(async (req, res) => {
  try {
    const prompt = `
      # Context
      ${ req.body.context }
      
      # Prompt
      ${ req.body.prompt }
    `;
    const response = await ollamatoGenerate(prompt);
    response = MarkdownUtils.extractFirstCodeBlock(response);
    res.type('html').send(response);

  } catch (error) {
    console.error("Error communicating with Ollama:", error.message);
    return res.status(500).json({ 
      error: "Failed to generate response from local AI model.",
      details: error.message 
    });
  }
}));

app.listen(PORT, () => {
  console.log(`AIPager running on http://localhost:${PORT}`);
});
