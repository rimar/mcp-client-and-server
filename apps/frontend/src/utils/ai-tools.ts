import { experimental_createMCPClient, tool } from "ai";
import { z } from "zod";

const mcpClient = await experimental_createMCPClient({
  transport: {
    type: "sse",
    url: "http://localhost:3333/sse",
  },
  name: "Pathlock Cloud database mcp server",
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
    recommendDataset,
  };
}
