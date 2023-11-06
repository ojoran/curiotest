import { StreamingTextResponse, LangChainStream } from 'ai';
import { OpenAI } from 'langchain/llms/openai';
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { CallbackHandler } from "langfuse-langchain";

export const runtime = 'edge';

const promptTemplate = `Du bist ein Assistent bei der Studiengangfindung für Schüler. Gib bitte eine kürzere pregnante Antwort.
  Antworte bitte in Stichpunkten und bleibe bei Du. 
  Basierend auf den Antworten unten, generiere eine Empfehlung für passende Studiengänge und Berufsfelder. 
  Antworte Präzise und empfehle 2 Studiengänge pro Interessensbereich.
  Nenne danach 2 mögliche Berufsfelder pro Studiengang.\n
  \n
  Frage 1:  Welche Fächer begeistern dich in der Schule am meisten?\n 
  Antwort 1: {answer_1}\n
  Frage 2:  Welche Bereiche findest du spannend? (z.B. Medizin, Wirtschaft, Technik, etc.)?\n
  Antwort 2: {answer_2}\n
  Frage 3:  Wie wichtig ist es dir, dass du nach deinem Studium viele unterschiedliche Berufsmöglichkeiten hast? Oder würdest du lieber ein Studium machen, das dich auf einen bestimmten Beruf vorbereitet?\n
  Antwort 3: {answer_3}\n`;

const generateAction = async (req) => {

  const { userInput } = await req.json();
  const answers = userInput;
  const { stream, handlers, writer } = LangChainStream();

  console.log(`user answers: ${answers}`);

  const langfuse_handlers = new CallbackHandler({
    publicKey: process.env.LF_PUBLIC_KEY,
    secretKey: process.env.LF_SECRET_KEY,
  });


  const model = new OpenAI({
    streaming: true,
    modelName: "gpt-4",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });


  // create a prompt
  const prompt = PromptTemplate.fromTemplate(promptTemplate);
  // create a chain
  const chain = new LLMChain({
    llm: model,
    prompt,
    callbacks: [langfuse_handlers],
  });

  chain.call(
    { answer_1: answers[0], answer_2: answers[1], answer_3: answers[2] },
    { callbacks: [handlers, langfuse_handlers] }
  ).catch(console.error)

  return new StreamingTextResponse(stream);
}


export default generateAction;