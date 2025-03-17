import React, { useState, useRef, useEffect } from "react";
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
import { ArrowLeft, Send, Loader2 } from "lucide-react";

// ---- Types ----
type Message = {
  id: string;
  content: string;
  type: "user" | "assistant";
  project_id: string;
  user_id: string;
  created_at: string;
};

// New PdfEmbed component to fetch and display the PDF
const PdfEmbed = ({ projectId }: { projectId: string | undefined }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Automatically fetch the PDF as soon as projectId is available
  const { isLoading: isPdfLoading } = useQuery({
    queryKey: ["pdf", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const formData = new FormData();
      formData.append("projectId", projectId);

      // Update to the correct port (e.g., 8000)
      const response = await fetch("http://127.0.0.1:8000/preview_pdf", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to fetch PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return url;
    },
    enabled: !!projectId, // fetch as soon as we have a projectId
  });

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <h2>PDF Preview</h2>
      {isPdfLoading ? (
        <p>Loading PDF...</p>
      ) : pdfUrl ? (
        <iframe
          src={pdfUrl}
          width="100%"
          height="600"
          style={{ border: "none" }}
          title="PDF Preview"
        />
      ) : (
        <p>No PDF available.</p>
      )}
    </div>
  );
};

function Editor() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For user's input in the text box
  const [inputMessage, setInputMessage] = useState("");

  // Track streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  // Holds the incremental streamed content for the assistant
  const streamedContentRef = useRef("");

  // Animation states (matching the first implementation)
  const [animationText, setAnimationText] = useState("Thinking");
  const [dotCount, setDotCount] = useState(0);
  
  // 1) Fetch existing messages
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

  // Animation effect for the dots
  useEffect(() => {
    if (!isStreaming) return;

    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 0 : prev + 1));
    }, 500);

    return () => clearInterval(dotInterval);
  }, [isStreaming]);

  // Effect to update the animation text with dots
  useEffect(() => {
    if (!isStreaming) return;
    setAnimationText(`Thinking${".".repeat(dotCount)}`);
  }, [dotCount, isStreaming]);

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // 2) Streaming logic
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

      // Update UI with temporary user message
      queryClient.setQueryData(["messages", projectId], (oldMsgs: Message[] = []) => [
        ...oldMsgs,
        tempUserMessage
      ]);

      // Start streaming from the backend
      await techpackAI.sendMessageStream(content, projectId, (chunk: string) => {
        streamedContentRef.current += chunk;
        
        // For debugging
        console.log("Received chunk:", chunk);
        console.log("Current streamed content:", streamedContentRef.current);
      });

      // When complete, create the final assistant message
      const assistantMessage: Message = {
        id: `final-assistant-${Date.now()}`,
        content: streamedContentRef.current,
        type: "assistant",
        project_id: projectId,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };
      
      // Add the assistant message to the UI
      queryClient.setQueryData(["messages", projectId], (oldMsgs: Message[] = []) => [
        ...oldMsgs,
        assistantMessage
      ]);

      // When streaming finishes, re-fetch to get proper message IDs from the DB
      queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
    } catch (error) {
      console.error("Streaming error:", error);
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

  // 3) Sending messages
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

  // 4) "Apply ChatGPT Edits to Sheet"
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
        description: "The sheet was updated via ChatGPT instructions.",
      });
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
    editViaChatGPT.mutate(inputMessage);
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
        </div>
      </div>

      {/* Main layout: left PDF embed, right chat */}
      <div className="grid grid-cols-4 gap-6">
        {/* PDF Embed Column */}
        <Card className="col-span-3 p-6 min-h-[600px] overflow-hidden">
          <PdfEmbed projectId={projectId} />
        </Card>

        {/* Chat Column */}
        <Card className="p-6 flex flex-col h-[700px]">
          <h2 className="heading-md mb-4">AI Assistant</h2>
          {/* Render messages */}
          <div className="flex-1 space-y-4 overflow-y-auto mb-4" style={{ height: "450px" }}>
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
            
            {/* Generating Animation - Matching the first implementation */}
            {isStreaming && (
              <div className="bg-muted p-4 rounded-lg flex items-center space-x-3 max-w-[80%] animate-pulse">
                <div className="animate-spin">
                  <Loader2 size={18} className="text-primary" />
                </div>
                <div className="relative">
                  <p className="font-medium">{animationText}</p>
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary animate-pulse"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input and Buttons */}
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
            <div className="mt-3 text-right">
              <Button variant="outline" onClick={handleApplyEdits} disabled={isStreaming}>
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