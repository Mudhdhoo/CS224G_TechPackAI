
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Bold, Italic, Underline, Image, List, Heading1 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  created_at: string;
}

const DocumentEditor = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [editorMode, setEditorMode] = useState<"rich" | "latex">("rich");
  const [inputMessage, setInputMessage] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // First, check if a document exists for this project, if not create one
  const { data: document, isLoading: isLoadingDocument } = useQuery({
    queryKey: ['document', projectId],
    queryFn: async () => {
      // Try to get existing document
      const { data: existingDoc, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      // If no document exists, create one
      if (!existingDoc && user) {
        const { data: newDoc, error: createError } = await supabase
          .from('documents')
          .insert([{
            project_id: projectId,
            user_id: user.id,
            content: '',
            latex_content: '',
            title: 'Untitled Document'
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        return newDoc;
      }
      
      return existingDoc;
    }
  });

  // Fetch chat messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    }
  });

  // Update document mutation
  const updateDocument = useMutation({
    mutationFn: async (newContent: string) => {
      if (!document) return;
      
      const { error } = await supabase
        .from('documents')
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq('project_id', projectId);
      
      if (error) throw error;
    }
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            content,
            type: 'user',
            project_id: projectId,
            user_id: user?.id
          }
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
      // Simulate assistant response
      setTimeout(async () => {
        const { error } = await supabase
          .from('messages')
          .insert([
            {
              content: "I understand your message. I'm currently in development, so my responses are limited. How else can I assist you?",
              type: 'assistant',
              project_id: projectId,
              user_id: user?.id
            }
          ]);
        
        if (error) {
          console.error('Error sending assistant response:', error);
        } else {
          queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
        }
      }, 1000);
    }
  });

  // Debounced save
  const handleContentChange = useCallback((value: string | undefined) => {
    if (!value) return;
    setContent(value);
    updateDocument.mutate(value);
  }, [updateDocument]);

  // Load initial content
  useEffect(() => {
    if (document) {
      setContent(document.content);
    }
  }, [document]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      toast({
        title: "Cannot send empty message",
        variant: "destructive",
      });
      return;
    }

    sendMessage.mutate(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const insertLatexCommand = (command: string) => {
    setContent(prev => prev + command);
  };

  if (isLoadingDocument || isLoadingMessages) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
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
          <h1 className="heading-lg">Document Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditorMode(prev => prev === "rich" ? "latex" : "rich")}>
            {editorMode === "rich" ? "Show LaTeX" : "Show Rich Editor"}
          </Button>
          <Button onClick={() => toast({ title: "Coming soon", description: "PDF export will be available soon." })}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b pb-4">
        <Button variant="ghost" size="sm" onClick={() => insertLatexCommand("\\textbf{}")}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertLatexCommand("\\textit{}")}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertLatexCommand("\\underline{}")}>
          <Underline className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertLatexCommand("\\section{}")}>
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertLatexCommand("\\includegraphics{}")}>
          <Image className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertLatexCommand("\\begin{itemize}\n\\item\n\\end{itemize}")}>
          <List className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="col-span-3 p-6 min-h-[600px] overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="latex"
            value={content}
            onChange={handleContentChange}
            options={{
              minimap: { enabled: false },
              lineNumbers: editorMode === "latex" ? "on" : "off",
              wordWrap: "on",
              wrappingStrategy: "advanced",
              fontSize: 14,
              fontFamily: "Monaco, 'Courier New', monospace",
            }}
          />
        </Card>

        <Card className="p-6 flex flex-col">
          <h2 className="heading-md mb-4">AI Assistant</h2>
          <div className="flex-1 space-y-4 overflow-y-auto mb-4">
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
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DocumentEditor;
