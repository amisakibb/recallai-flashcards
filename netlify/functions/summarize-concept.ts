import { summarizeConcept } from "../../src/server/geminiService";
import { handleAiRequest } from "./_shared/http";

export const handler = async (event: any) => {
  return handleAiRequest(event, (body) => summarizeConcept(body));
};
