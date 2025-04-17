import { createServerFn } from "@tanstack/react-start";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { getEvent, setHeaders } from "@tanstack/react-start/server";

import getTools from "./ai-tools";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are an expert in Identity and Access Management (IAM) with deep knowledge of the ProfileTailor system. You have access to comprehensive data about:

- User access and role management
- Authorization certifications and approvals
- Segregation of Duties (SoD) controls
- Workflow and business process management
- Compliance monitoring and audit trails
- System integration and security controls
 
When users ask questions:
1. Provide specific, actionable answers based on the system's capabilities
2. Reference relevant data points and patterns when appropriate
3. Suggest best practices and optimizations
4. Identify potential risks or compliance concerns
5. Recommend system features that could address their needs

IMPORTANT: After providing your answer, proactively evaluate if the topic would benefit from a data visualization. If discussing metrics, statistics, performance data, user activity, or any quantifiable information, generate and show a contextually relevant dataset visualization.

When creating a visualization:
1. You MUST populate the 'data' array with EXACTLY 5 data points that directly relate to the discussion topic
2. NEVER use generic labels like "Dataset A, Dataset B" - always use specific labels like "Finance Department", "HR Team", etc.
3. Use a relevant title that describes what the data represents (e.g., "SoD Violations by Department")
4. Include a brief description (1-2 sentences max) that helps interpret the chart
5. Set the lastUpdated field to the current date (format: "April 16, 2024")
6. Ensure ALL data values are between 0-100 (representing percentages)
7. ALWAYS include valid hex color codes that start with "#" followed by 6 characters

Data structure example:
{
  "id": "access_distribution",
  "title": "Access Distribution by Department",
  "description": "Shows the percentage of privileged access rights distributed across departments.",
  "data": [
    { "name": "Finance", "value": 78, "color": "#10B981" },
    { "name": "HR", "value": 65, "color": "#3B82F6" },
    { "name": "IT", "value": 52, "color": "#8B5CF6" },
    { "name": "Operations", "value": 45, "color": "#EC4899" },
    { "name": "Sales", "value": 38, "color": "#F59E0B" }
  ],
  "lastUpdated": "April 16, 2024"
}

Always generate appropriate data that relates to the user's query and your response.
`;

// Helper function to handle streaming responses properly
async function handleStreamingResponse(response: Response): Promise<Response> {
  const event = getEvent();
  
  // Set headers from response before streaming begins
  const headers = Object.fromEntries(response.headers.entries());
  setHeaders(event, headers);
  
  // Create and return a new response with the same body
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText
  });
}

export const genAIResponse = createServerFn({ method: "POST", response: "raw" })
  .validator(
    (d: {
      messages: Array<Message>;
      systemPrompt?: { value: string; enabled: boolean };
    }) => d
  )
  .handler(async ({ data }) => {
    const messages = data.messages
      .filter(
        (msg) =>
          msg.content.trim() !== "" &&
          !msg.content.startsWith("Sorry, I encountered an error")
      )
      .map((msg) => ({
        role: msg.role,
        content: msg.content.trim(),
      }));

    const tools = await getTools();

    try {
      const result = streamText({
        model: anthropic("claude-3-5-sonnet-latest"),
        messages,
        system: SYSTEM_PROMPT,
        maxSteps: 20,
        tools,
        maxRetries: 10,
      });

      // Use our helper function to handle headers properly before streaming
      const dataStreamResponse = result.toDataStreamResponse();
      return handleStreamingResponse(dataStreamResponse);
    } catch (error) {
      console.error("Error in genAIResponse:", error);
      if (error instanceof Error && error.message.includes("rate limit")) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to get AI response"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  });
