import { createServerFn } from "@tanstack/react-start";
import { writeFileSync } from "fs";
import path from "path";
import os from "os";
import { getEvent, setHeaders } from "@tanstack/react-start/server";

interface TranscriptionResponse {
  text: string;
}

// Helper function to handle responses properly
async function handleResponse(response: any): Promise<any> {
  const event = getEvent();
  
  // If we're dealing with response headers, set them before returning
  if (response && response.headers) {
    const headers = Object.fromEntries(Object.entries(response.headers));
    setHeaders(event, headers);
  }
  
  return response;
}

export const transcribeAudio = createServerFn({ 
  method: "POST"
})
  .validator((data: { audioBlob: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Base64 data should start with "data:audio/webm;base64,"
      const base64Data = data.audioBlob.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      
      // Create a temporary file to store the audio
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
      
      // Write the buffer to the temporary file
      writeFileSync(tempFilePath, buffer);
      
      // Create form data with the file
      const formData = new FormData();
      formData.append("file", new Blob([buffer], { type: "audio/webm" }), "audio.webm");
      formData.append("model", "whisper-1");
      // Force English as output language
      formData.append("language", "en");
      // Request translation to English regardless of source language
      formData.append("response_format", "json");
      formData.append("translate", "true");
      
      // Send to OpenAI API
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }
      
      const result = await response.json() as TranscriptionResponse;
      
      return handleResponse({
        success: true,
        text: result.text,
      });
    } catch (error) {
      console.error("Transcription error:", error);
      return handleResponse({
        success: false,
        error: error instanceof Error ? error.message : "Failed to transcribe audio",
      });
    }
  }); 