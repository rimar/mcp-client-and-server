import { useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { Send, X, Mic, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { useChat } from "@ai-sdk/react";
import { genAIResponse } from "../utils/ai";
import { transcribeAudio } from "../routes/api/transcribe.api";

import { showAIAssistant } from "../store/assistant";

import GuitarRecommendation from "./GuitarRecommendation";
import DatasetChart from "./DatasetChart";

import type { UIMessage } from "ai";

function Messages({ messages }: { messages: Array<UIMessage> }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Ask me anything! I'm here to help.
      </div>
    );
  }

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-gray-50">
      {messages.map(({ id, role, content, parts }) => (
        <div
          key={id}
          className={`py-3 ${
            role === "assistant"
              ? "bg-gradient-to-r from-green-50 to-blue-50"
              : "bg-white"
          }`}
        >
          {content.length > 0 && (
            <div className="flex items-start gap-2 px-4">
              {role === "assistant" ? (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                  <Sparkles className="w-3 h-3" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0">
                  Y
                </div>
              )}
              <div className="flex-1 min-w-0">
                <ReactMarkdown
                  className="prose max-w-none prose-sm prose-slate"
                  rehypePlugins={[
                    rehypeRaw,
                    rehypeSanitize,
                    rehypeHighlight,
                    remarkGfm,
                  ]}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )}
          {parts
            .filter((part) => part.type === "tool-invocation")
            .filter(
              (part) => 
                part.toolInvocation.toolName === "recommendGuitar" || 
                part.toolInvocation.toolName === "recommendDataset"
            )
            .map((toolCall) => (
              <div
                key={toolCall.toolInvocation.toolName}
                className="max-w-[80%] mx-auto"
              >
                {toolCall.toolInvocation.toolName === "recommendGuitar" && (
                  <GuitarRecommendation id={toolCall.toolInvocation.args.id} />
                )}
                {toolCall.toolInvocation.toolName === "recommendDataset" && (
                  <DatasetChart 
                    id={toolCall.toolInvocation.args.id}
                    title={toolCall.toolInvocation.args.title}
                    description={toolCall.toolInvocation.args.description}
                    data={toolCall.toolInvocation.args.data}
                    lastUpdated={toolCall.toolInvocation.args.lastUpdated}
                  />
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const isOpen = useStore(showAIAssistant);
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    initialMessages: [],
    fetch: (_url, options) => {
      const { messages } = JSON.parse(options!.body! as string);
      return genAIResponse({
        data: {
          messages,
        },
      });
    },
    onToolCall: (call) => {
      if (call.toolCall.toolName === "recommendGuitar" || 
          call.toolCall.toolName === "recommendDataset") {
        return "Handled by the UI";
      }
    },
  });

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    setRecordError(null);
    setAudioBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        
        // Transcribe the audio
        await transcribeAudioToText(audioBlob);
      };
      mediaRecorder.onerror = (event) => {
        setRecordError('Recording error');
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setRecordError(err.message || 'Could not start recording');
      setIsRecording(false);
    }
  };

  const transcribeAudioToText = async (blob: Blob) => {
    try {
      setIsTranscribing(true);
      
      // Convert Blob to base64 string
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      });
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;
      
      // Send to API for transcription
      const result = await transcribeAudio({
        data: { audioBlob: base64Audio }
      });
      
      if (result.success && result.text) {
        // Set the transcribed text as input
        const event = {
          target: { value: result.text }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        handleInputChange(event);
      } else {
        setRecordError('Transcription failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setRecordError('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => showAIAssistant.setState((state) => !state)}
        className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90 transition-opacity font-semibold text-sm"
      >
        <div className="w-4 h-4 rounded-lg bg-white/20 flex items-center justify-center text-xs font-medium">
          <Sparkles className="w-3 h-3" />
        </div>
        AI Assistant
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[700px] h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">AI Assistant</h3>
            <button
              onClick={() => showAIAssistant.setState((state) => !state)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Messages messages={messages} />

          <div className="p-3 border-t border-gray-200">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  data-foo="bar"
                  placeholder="Type your message..."
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-3 pr-10 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent resize-none overflow-hidden"
                  rows={1}
                  style={{ minHeight: "36px", maxHeight: "120px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height =
                      Math.min(target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button
                  type="button"
                  className={`absolute right-10 top-1/2 -translate-y-1/2 p-1.5 transition-colors focus:outline-none ${isRecording ? 'text-red-500 animate-pulse' : isTranscribing ? 'text-yellow-500 animate-pulse' : 'text-green-500 hover:text-green-600'}`}
                  onClick={handleMicClick}
                  disabled={isTranscribing}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-green-500 hover:text-green-600 disabled:text-gray-300 transition-colors focus:outline-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {isRecording && (
            <div className="text-xs text-red-500 mt-2 flex items-center gap-1 px-3">
              <span className="animate-pulse">●</span> Recording...
            </div>
          )}
          {isTranscribing && (
            <div className="text-xs text-yellow-500 mt-2 flex items-center gap-1 px-3">
              <span className="animate-pulse">●</span> Transcribing...
            </div>
          )}
          {recordError && (
            <div className="text-xs text-red-500 mt-2 px-3">{recordError}</div>
          )}
          {audioBlob && !isTranscribing && !recordError && (
            <div className="text-xs text-green-500 mt-2 px-3">Audio recorded! ({(audioBlob.size / 1024).toFixed(1)} KB)</div>
          )}
        </div>
      )}
    </div>
  );
}
