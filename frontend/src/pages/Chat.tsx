import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, PenTool, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { techpackAI } from "@/lib/techpack-ai";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    enabled: !!projectId
  });

  const { isLoading: isPdfLoading, refetch: refetchPdf } = useQuery({
    queryKey: ['pdf', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await fetch(`http://127.0.0.1:5000/preview_pdf`);
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return url;
    },
    enabled: false,
  });

  const handlePreviewClick = async () => {
    try {
      await refetchPdf();
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
    sendMessage(inputMessage);
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

      <Card className="p-6 min-h-[500px] flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto">
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
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
            />
            <Button size="icon" onClick={handleSendMessage} disabled={isSending}>
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