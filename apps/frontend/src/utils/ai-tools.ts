import { experimental_createMCPClient, tool } from "ai";
import { z } from "zod";

const mcpClient = await experimental_createMCPClient({
  transport: {
    type: "sse",
    url: "http://localhost:3333/sse",
  },
  name: "Pathlock Cloud database mcp server",
});

// Define the data item schema with common color options
const dataItem = z.object({
  name: z.string().describe("Specific, descriptive name of the data point (e.g., 'Finance Department', 'SOX Controls')"),
  value: z.number().describe("The value/percentage for this data point (typically between 0-100)"),
  color: z.string().describe("The color for the dataset bar in hex format (e.g., '#10B981')")
});

// The dataset visualization tool
const recommendDataset = tool({
  description: "Show a contextually relevant chart visualization with real data points that relate to the discussion topic",
  parameters: z.object({
    id: z.string().describe("A unique identifier for this dataset visualization (e.g., 'sod_violations', 'access_distribution')"),
    title: z.string().describe("A specific, descriptive title that clearly explains what the data represents (e.g., 'SoD Violations by Department', 'Access Request Distribution by Business Unit')"),
    description: z.string().describe("A helpful explanation of what the chart shows and how to interpret it"),
    data: z.array(dataItem).min(3).max(10).describe("Array of 3-10 data items with contextually relevant names, values, and colors"),
    lastUpdated: z.string().describe("Current date in a readable format (e.g., 'April 16, 2024')")
  }),
});

// Helper for creating color palettes for different data types
export const dataColors = {
  access: ["#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B"],
  violations: ["#EF4444", "#F97316", "#F59E0B", "#FBBF24", "#A3E635"],
  compliance: ["#14B8A6", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
  activity: ["#6366F1", "#8B5CF6", "#A78BFA", "#C084FC", "#E879F9"]
};

export default async function getTools() {
  const tools = await mcpClient.tools();
  return {
    ...tools,
    recommendDataset,
  };
}
