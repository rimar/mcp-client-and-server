import { experimental_createMCPClient, tool } from "ai";
import { z } from "zod";

import { fetchGuitars } from "./apis";

const mcpClient = await experimental_createMCPClient({
  transport: {
    type: "sse",
    url: "http://localhost:8081/sse",
  },
  name: "Order Service",
});

const getProducts = tool({
  description: "Get all products from the database",
  parameters: z.object({}),
  execute: async () => await fetchGuitars(),
});

const recommendGuitar = tool({
  description: "Use this tool to recommend a guitar to the user",
  parameters: z.object({
    id: z.string().describe("The id of the guitar to recommend"),
  }),
});

const recommendDataset = tool({
  description: "Show a chart visualization of dataset information to the user",
  parameters: z.object({
    id: z.string().describe("The id of the dataset collection to display"),
  }),
});

export default async function getTools() {
  const tools = await mcpClient.tools();
  return {
    ...tools,
    getProducts,
    recommendGuitar,
    recommendDataset,
  };
}
