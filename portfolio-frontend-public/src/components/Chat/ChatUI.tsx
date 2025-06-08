import { useState, useRef, useEffect } from "react";
import { Send, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "./ChatMessage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { sendMessage } from "@/api/chat";
import { exportChatToEmail } from "@/api/contact";
import { ChatMessageInterface } from "@/types";
import { v4 as uuidv4 } from "uuid"; // UUID import
import { LoadingDots } from "@/components/ui/loading-spinner";


interface ChatUIProps {
  onClose?: () => void;
  initialQuestion?: string | null;
}

const ChatUI = ({ onClose, initialQuestion }: ChatUIProps) => {
  const [messages, setMessages] = useState<ChatMessageInterface[]>([
    {
      content: "Hi there! I'm Tomer's AI assistant for this portfolio. Ask me anything about Tomer's experience, skills, projects, or resume!",
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [includeChat, setIncludeChat] = useState(true);
  const [message, setMessage] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Common questions for easy conversation starters
  const commonQuestions = [
    "Can you tell me about Tomer's education",
    "Can you tell me about this DevOps portfolio project?",
    "What cloud platforms does Tomer work with?",
    "What's Tomer's experience with Kubernetes?",
  ];

  // Unique conversation ID (UUID)
  const conversationId = useRef<string>(uuidv4());

  // Handle initial question if provided
  useEffect(() => {
    if (initialQuestion && messages.length === 1) {
      handleQuestionSubmit(initialQuestion);
    }
  }, [initialQuestion]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuestionSubmit = async (question: string) => {
    const userMessage: ChatMessageInterface = {
      content: question,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message to API
      const response = await sendMessage(messages, question, conversationId.current);

      // Create AI message from response
      const aiMessage: ChatMessageInterface = response;

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: ChatMessageInterface = {
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send message to API
      const response = await sendMessage(messages, input, conversationId.current);

      // Create AI message from response
      const aiMessage: ChatMessageInterface = response;

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportChat = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please provide an email address to export the chat.",
        variant: "destructive"
      });
      return;
    }

    try {
      setExportLoading(true);
      await exportChatToEmail(email, message, messages, conversationId.current);

      toast({
        title: "Chat Exported",
        description: `Your chat has been sent to ${email} (Conversation ID: ${conversationId.current})`,
      });

      setExportDialogOpen(false);
      setEmail("");
      setMessage("");
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export the chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  const showQuestions = messages.length === 1 && !isLoading;

  return (
    <div className="relative flex flex-col h-[500px] max-h-[70vh] bg-background rounded-lg overflow-hidden border border-border glass-card">
      <div className="p-4 bg-secondary/30 backdrop-blur-md border-b border-border flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-primary">Chat with Tomer's AI Assistant</h2>
          <p className="text-sm text-muted-foreground">Ask about my experience, skills, projects, or resume</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setExportDialogOpen(true)}
            className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Mail size={18} />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {/* Common Questions - shown only when there's just the initial message */}
        {showQuestions && (
          <div className="animate-fade-in flex flex-col items-end space-y-2">
            <div className="text-xs text-muted-foreground mb-1">
              💡 Try asking:
            </div>
            {commonQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuestionSubmit(question)}
                disabled={isLoading}
                className="max-w-[80%] p-2 text-left bg-primary/10 hover:bg-primary/20 text-xs rounded-lg border border-primary/20 transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group ml-auto"
              >
                <span className="group-hover:text-primary transition-colors">
                  {question}
                </span>
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-secondary/20 max-w-[80%]">
            <div className="flex items-center space-x-2">
              <LoadingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-secondary/20 backdrop-blur-sm">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Tomer's experience, skills, projects..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send size={18} />
          </Button>
        </div>
      </form>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Chat</DialogTitle>
            <DialogDescription>
              Send this conversation to your email address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Input
                id="message"
                placeholder="Add a personal message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="includeChat"
                checked={includeChat}
                onCheckedChange={(checked) => setIncludeChat(checked as boolean)}
              />
              <Label htmlFor="includeChat">Attach chat transcript</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
              disabled={exportLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportChat}
              disabled={exportLoading || !email.trim()}
            >
              {exportLoading ? "Sending..." : "Send to Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatUI;
