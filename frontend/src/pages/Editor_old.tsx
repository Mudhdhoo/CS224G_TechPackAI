import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

// UI components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";

// ---- MAIN COMPONENT ----
function Editor() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inputMessage, setInputMessage] = useState("");

  // GoogleSheetEmbed component
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
  //SKIT

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
        // Reset streamed content
        streamedContentRef.current = "";
        setIsStreaming(true);
  
        // Create temporary message objects for UI
        const tempUserMessage: Message = {
          id: `temp-user-${Date.now()}`,
          content: content,
          type: 'user',
          project_id: projectId,
          user_id: user.id,
          created_at: new Date().toISOString(),
        };
  
        const tempAssistantId = `temp-assistant-${Date.now()}`;
        const tempAssistantMessage: Message = {
          id: tempAssistantId,
          content: "", // Will be updated while streaming
          type: 'assistant',
          project_id: projectId,
          user_id: user.id,
          created_at: new Date().toISOString(),
        };
  
        // Update UI with temporary messages
        queryClient.setQueryData(['messages', projectId], (oldData: Message[] = []) => [
          ...oldData, 
          tempUserMessage, 
          tempAssistantMessage
        ]);
  
        // Start streaming
        await techpackAI.sendMessageStream(content, projectId, (chunk) => {
          // Update the content ref with new chunk
          streamedContentRef.current += chunk;
          
          // Update the assistant's message with the current streamed content
          queryClient.setQueryData(['messages', projectId], (oldData: Message[] = []) => {
            return oldData.map(msg => 
              msg.id === tempAssistantId 
                ? { ...msg, content: streamedContentRef.current } 
                : msg
            );
          });
        });
  
        // When streaming is done, refetch to get the proper IDs from the database
        queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
        
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
  
    // Legacy non-streaming implementation (kept for fallback)
    const { mutate: sendMessage, isPending: isSending } = useMutation({
      mutationFn: async (content: string) => {
        if (!projectId || !user) throw new Error('Missing project ID or user');
        return techpackAI.sendMessage(content, projectId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
        setInputMessage("");
      },
      onError: (error) => {
        toast({
          title: "Failed to send message",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  
    const handleSendMessage = () => {
      if (!inputMessage.trim()) {
        toast({
          title: "Cannot send empty message",
          variant: "destructive",
        });
        return;
      }
      
      // Use streaming version instead of the mutate function
      sendStreamingMessage(inputMessage);
    };
  
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };
  
    const navigateToEditor = () => {
      navigate(`/project/${projectId}/editor`);
    };

  // Fetch existing chat messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Post user message to DB + a dummy assistant response
  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const { error } = await supabase.from("messages").insert([
        {
          content,
          type: "user",
          project_id: projectId,
          user_id: user?.id,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
      setTimeout(async () => {
        const { error } = await supabase.from("messages").insert([
          {
            content:
              "I understand your message. I'm currently in development, so my responses are limited. How else can I assist you?",
            type: "assistant",
            project_id: projectId,
            user_id: user?.id,
          },
        ]);
        if (error) {
          console.error("Error sending assistant response:", error);
        } else {
          queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
        }
      }, 1000);
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      toast({
        title: "Cannot send empty message",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // --- NEW: Mutation to call the "edit via ChatGPT" backend route ---
  const editViaChatGPT = useMutation({
    mutationFn: async (instructions) => {
      // You can pass the instructions from your chat input or a separate input
      const response = await fetch("http://127.0.0.1:8000/sheet/chat-edit-excel", {
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
      // Optionally refresh the iframe
      // You can force a reload by manipulating the key or src
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
    // Use the text from inputMessage as "instructions" or a separate text field
    editViaChatGPT.mutate(inputMessage);
  };

  if (isLoadingMessages) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="heading-lg">Document Editor (Google Sheet)</h1>
        </div>
      </div>

      {/* Main layout: left Google Sheet, right chat */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="col-span-3 p-6 min-h-[600px] overflow-hidden">
          <GoogleSheetEmbed />
        </Card>

        <Card className="p-6 flex flex-col">
          <h2 className="heading-md mb-4">AI Assistant</h2>
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
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ask the AI assistant..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {/* Add a button to apply the chat instructions to the sheet */}
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
