import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, PenTool, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { techpackAI } from "@/lib/techpack-ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";

type Message = {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  project_id: string;
  user_id: string;
  created_at: string;
}

const Chat = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfNeedsRefresh, setPdfNeedsRefresh] = useState(false);
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use a ref to track current streamed content to avoid race conditions
  const streamedContentRef = useRef("");

  // Animation states
  const [animationText, setAnimationText] = useState("Thinking");
  const [dotCount, setDotCount] = useState(0);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await techpackAI.getProjectMessages(projectId);
      const uniqueMessages = Array.from(
        new Map(response.map(msg => [msg.id, msg])).values()
      );
      
      return uniqueMessages;
    },
    enabled: !!projectId,
    onSuccess: (newMessages) => {
      // Check if any new assistant messages mention PDF generation
      const latestAssistantMessage = newMessages
        .filter(msg => msg.type === 'assistant')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      if (latestAssistantMessage && (
          latestAssistantMessage.content.includes("tech pack has been updated") ||
          latestAssistantMessage.content.includes("PDF has been generated")
      )) {
        setPdfNeedsRefresh(true);
      }
    }
  });

  // Effect to refresh PDF when needed
  useEffect(() => {
    if (pdfNeedsRefresh) {
      refetchPdf();
      setPdfNeedsRefresh(false);
    }
  }, [pdfNeedsRefresh]);

  // Animation effect for the dots
  useEffect(() => {
    if (!isGenerating) return;

    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 0 : prev + 1));
    }, 500);

    return () => clearInterval(dotInterval);
  }, [isGenerating]);

  // Effect to update the animation text with dots
  useEffect(() => {
    if (!isGenerating) return;
    setAnimationText(`Thinking${".".repeat(dotCount)}`);
  }, [dotCount, isGenerating]);

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const { isLoading: isPdfLoading, refetch: refetchPdf } = useQuery({
    queryKey: ['pdf', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      // Add a timestamp to bust cache
      const timestamp = new Date().getTime();
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('timestamp', timestamp.toString());
      
      const response = await fetch(`http://127.0.0.1:8000/preview_pdf?t=${timestamp}`, {
        method: "POST",
        body: formData,
        // Disable cache to ensure we always get the latest PDF
        cache: "no-store"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch PDF: ${errorText}`);
      }
      
      const blob = await response.blob();
      
      // Revoke old URL if it exists to prevent memory leaks
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // Show success message when PDF is successfully loaded
      toast({
        title: "PDF Loaded",
        description: "The latest version of your tech pack is ready to view.",
        duration: 3000,
      });
      
      return url;
    },
    enabled: false,
    retry: 3,
    retryDelay: 1000,
  });

  const handlePreviewClick = async () => {
    try {
      await refetchPdf();
      toast({
        title: "PDF Preview",
        description: "Loading your Tech Pack PDF...",
      });
    } catch (error) {
      toast({
        title: "Failed to load PDF preview",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  // Fixed streaming implementation
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
      
      // Show generating animation
      setIsGenerating(true);
      
      // Create temporary user message object for UI
      const tempUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        content: content,
        type: 'user',
        project_id: projectId,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      // Update UI with temporary user message only
      queryClient.setQueryData(['messages', projectId], (oldData: Message[] = []) => [
        ...oldData, 
        tempUserMessage
      ]);

      try {
        // Prepare temporary assistant message ID for when streaming completes
        const tempAssistantId = `temp-assistant-${Date.now()}`;
        
        // Start streaming but keep the animation visible
        setIsStreaming(true);
        
        // Stream the content while showing the animation
        let fullResponse = "";
        await techpackAI.sendMessageStream(content, projectId, (chunk) => {
          // Accumulate the full response
          fullResponse += chunk;
          
          // Check if the chunk mentions PDF generation
          if (
            chunk.includes("tech pack has been updated") ||
            chunk.includes("PDF has been generated")
          ) {
            setPdfNeedsRefresh(true);
          }
        });
        
        // Only once we have the complete response, hide the animation and show the message
        setIsGenerating(false);
        
        // Create final assistant message with the complete response
        const assistantMessage: Message = {
          id: tempAssistantId,
          content: fullResponse,
          type: 'assistant',
          project_id: projectId,
          user_id: user.id,
          created_at: new Date().toISOString(),
        };
        
        // Add the completed assistant message to the UI
        queryClient.setQueryData(['messages', projectId], (oldData: Message[] = []) => [
          ...oldData,
          assistantMessage
        ]);
        
        // When streaming is done, refetch to get the proper IDs from the database
        queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
      } catch (error) {
        throw error;
      }

      // When streaming is done, refetch to get the proper IDs from the database
      queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
      
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
      setInputMessage("");
    }
  };

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

  if (messagesLoading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="heading-lg">TechPack Assistant</h1>
        <Dialog onOpenChange={(open) => !open && handleDialogClose()}>
          <DialogTrigger asChild>
            <Button
              style={{ 
              backgroundColor:'#8B5CF6',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer'
            }}
              variant="outline"
              className="flex items-center gap-2"
              onClick={handlePreviewClick}
              disabled={isPdfLoading}
            >
              <FileText size={18} />
              {isPdfLoading ? "Loading..." : "Tech Pack Preview"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[90vh] p-0">
            <div className="flex flex-col h-full">
              <div className="px-6 py-4 border-b">
                <DialogTitle>Tech Pack Preview</DialogTitle>
              </div>
              <div className="flex-1 w-full min-h-0">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border-0"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading PDF...</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-muted-foreground">Enter your brand and designer names to begin.</p>

      <Card className="p-6 min-h-[500px] h-[600px] flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pb-4" style={{ height: "450px" }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.type === 'assistant' 
                  ? 'bg-muted' 
                  : 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
              }`}
            >
              <p>{message.content}</p>
            </div>
          ))}
          
          {/* Generating Template Animation */}
          {isGenerating && (
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

        <div className="border-t pt-4 mt-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isStreaming || isGenerating}
            />
            <Button 
              size="icon" 
              onClick={handleSendMessage} 
              disabled={isStreaming || isGenerating}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </Card>

      <Button 
        onClick={navigateToEditor}
        className="w-full flex items-center justify-center gap-2"
      >
        <PenTool size={18} />
        Open Editor
      </Button>
    </div>
  );
};

export default Chat;