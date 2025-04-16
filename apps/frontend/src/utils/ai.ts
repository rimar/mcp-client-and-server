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

Additionally, you can show dataset visualizations to the user. If a user asks about "the best dataset" or asks to see dataset information, use the recommendDataset tool with any ID from 1 to 5 to show them a chart of dataset performance metrics.

Use your expertise to provide the most relevant and helpful response based on the user's specific question and context.
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
      });

      // Use our helper function to handle headers properly before streaming
      const dataStreamResponse = result.toDataStreamResponse();
      return handleStreamingResponse(dataStreamResponse);
    } catch (error) {
      console.error("Error in genAIResponse:", error);
      if (error instanceof Error && error.message.includes("rate limit")) {
        return { error: "Rate limit exceeded. Please try again in a moment." };
      }
      return {
        error:
          error instanceof Error ? error.message : "Failed to get AI response",
      };
    }
  });
