
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, PenTool } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { techpackAI } from "@/lib/techpack-ai";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
      // Remove any duplicate messages by using Set with message IDs
      const uniqueMessages = Array.from(
        new Map(response.map(msg => [msg.id, msg])).values()
      );
      return uniqueMessages;
    },
    enabled: !!projectId
  });

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
      <h1 className="heading-lg">TechPack Assistant</h1>
      <p className="text-muted-foreground">Refine your tech pack with AI assistance.</p>

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
