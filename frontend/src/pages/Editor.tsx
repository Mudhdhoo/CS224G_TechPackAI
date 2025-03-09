import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { techpackAI } from "@/lib/techpack-ai";

// UI components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";

// ---- Types ----
type Message = {
  id: string;
  content: string;
  type: "user" | "assistant";
  project_id: string;
  user_id: string;
  created_at: string;
};

function Editor() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // For user’s input in the text box
  const [inputMessage, setInputMessage] = useState("");

  // Track streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  // Holds the incremental streamed content for the assistant
  const streamedContentRef = useRef("");

  // ---- 1) Fetch existing messages (like Chat page) ----
  // You can replace this with your own “techpackAI.getProjectMessages(projectId)” 
  // if you want to unify retrieval with the Chat page logic. 
  // Right now, this example fetches from Supabase directly.
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery<Message[]>({
    queryKey: ["messages", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // ---- 2) Streaming logic (copied from Chat page) ----
  const sendStreamingMessage = async (content: string) => {
    if (!projectId || !user) {
      toast({
        title: "Error",
        description: "Missing project ID or user",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsStreaming(true);
      streamedContentRef.current = "";

      // Create a temporary user message
      const tempUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        content,
        type: "user",
        project_id: projectId,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      // Create a temporary assistant message to hold streaming text
      const tempAssistantId = `temp-assistant-${Date.now()}`;
      const tempAssistantMessage: Message = {
        id: tempAssistantId,
        content: "", // updated chunk-by-chunk
        type: "assistant",
        project_id: projectId,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      // Update UI with these temporary messages
      queryClient.setQueryData(["messages", projectId], (oldMsgs: Message[] = []) => [
        ...oldMsgs,
        tempUserMessage,
        tempAssistantMessage,
      ]);

      // Start streaming from the backend
      await techpackAI.sendMessageStream(content, projectId, (chunk: string) => {
        streamedContentRef.current += chunk; // accumulate streamed text

        // Update the assistant's message in local state
        queryClient.setQueryData(["messages", projectId], (oldMsgs: Message[] = []) => {
          return oldMsgs.map((msg) =>
            msg.id === tempAssistantId
              ? { ...msg, content: streamedContentRef.current }
              : msg
          );
        });
      });

      // When streaming finishes, re-fetch to get proper message IDs from DB
      queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      setInputMessage("");
    }
  };

  // ---- 3) Single entry point for sending messages (streaming) ----
  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      toast({
        title: "Cannot send empty message",
        variant: "destructive",
      });
      return;
    }
    sendStreamingMessage(inputMessage);
  };

  // Press Enter to send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ---- 4) "Apply ChatGPT Edits to Sheet" button logic ----
  // This calls your Flask or FastAPI endpoint to manipulate Google Sheet
  const editViaChatGPT = useMutation({
    mutationFn: async (instructions: string) => {
      const response = await fetch("http://127.0.0.1:8001/sheet/chat-edit-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sheet updated!",
        description: "The Google Sheet was edited via ChatGPT instructions.",
      });
      // Optionally: Force a reload in your <iframe> or refresh the data
    },
    onError: (error) => {
      toast({
        title: "Failed to update sheet",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const handleApplyEdits = () => {
    if (!inputMessage.trim()) {
      toast({
        title: "Cannot send empty instructions",
        variant: "destructive",
      });
      return;
    }
    // Use the same inputMessage as instructions, or separate if you prefer
    editViaChatGPT.mutate(inputMessage);
  };

  // ---- 5) Google Sheet Embed for live editing ----
  const GoogleSheetEmbed = () => {
    const embedUrl =
      "https://docs.google.com/spreadsheets/d/1jfPQ6k-8A-dD-8X6Mu5SwQsoKtQOWGDEoZalidI6Wec/edit?usp=sharing";
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <h2>Live Google Sheet</h2>
        <iframe
          src={embedUrl}
          width="100%"
          height="800"
          style={{ border: "none" }}
          title="Live Google Sheet"
        />
      </div>
    );
  };

  if (isLoadingMessages) {
    return <div>Loading messages...</div>;
  }
  if (messagesError) {
    return <div>Error loading messages: {String(messagesError)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="heading-lg">Document Editor (Google Sheet)</h1>
        </div>
      </div>

      {/* Main layout: left Google Sheet, right chat */}
      <div className="grid grid-cols-4 gap-6">
        {/* Google Sheet Column */}
        <Card className="col-span-3 p-6 min-h-[600px] overflow-hidden">
          <GoogleSheetEmbed />
        </Card>

        {/* Chat Column */}
        <Card className="p-6 flex flex-col">
          <h2 className="heading-md mb-4">AI Assistant</h2>

          {/* Render messages */}
          <div className="flex-1 space-y-4 overflow-y-auto mb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg ${
                  msg.type === "assistant"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                }`}
              >
                <p>{msg.content}</p>
              </div>
            ))}
          </div>

          {/* Input + Buttons */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ask the AI assistant..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isStreaming}
              />
              <Button size="icon" onClick={handleSendMessage} disabled={isStreaming}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Apply ChatGPT instructions to the Google Sheet */}
            <div className="mt-3 text-right">
              <Button variant="outline" onClick={handleApplyEdits}>
                Apply ChatGPT Edits to Sheet
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Editor;
