import { OpenAIChatModelId } from "@ai-sdk/openai/internal/dist";

export const availableAiModels: OpenAIChatModelId[] = ["gpt-4o-mini", "gpt-3.5-turbo"];

let selectedAgent: OpenAIChatModelId = "gpt-4o-mini";

export const aiModel = (): OpenAIChatModelId => selectedAgent;

export function setSelectedAgent(modelName: OpenAIChatModelId) {
  if (availableAiModels.includes(modelName)) {
    selectedAgent = modelName;
  } else {
    console.warn(`Model ${modelName} is not available. Defaulting to ${selectedAgent}.`);
  }
}

// For testing purposes
export function resetSelectedAgent() {
  selectedAgent = "gpt-4o-mini";
}

export function getRoomId(pageId: string) {
  return `liveblocks:examples:${pageId}`;
}

export function getPageId(roomId: string) {
  return roomId.split(":")[2];
}

export function getPageUrl(roomId: string) {
  return `/${getPageId(roomId)}`;
}
