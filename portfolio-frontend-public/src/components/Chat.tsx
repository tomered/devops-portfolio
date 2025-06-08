
import { useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ChatUI from "./Chat/ChatUI";

const Chat = () => {
  const [expanded, setExpanded] = useState(false);

  const toggleChat = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <section id="chat" className="section min-h-[70vh] flex flex-col items-center justify-center px-6 mt-[-80px] z-10 relative">
      <div className="container mx-auto">
        <div className="flex flex-col items-center mb-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-primary">
            Chat with Tomer's AI Assistant
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Have questions about my experience, skills, or projects? Chat with my AI assistant for immediate answers based on my portfolio and resume.
          </p>

          {!expanded && (
            <div className="mb-8 p-6 glass-card w-full max-w-2xl animate-fade-in">
              <p className="text-lg mb-4">
                👋 Hi there! I'm Tomer's AI assistant. I can answer questions about:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 text-left">
                <li>Work experience & professional background</li>
                <li>Technical skills & expertise areas</li>
                <li>Project details & accomplishments</li>
                <li>Education & certifications</li>
                <li>Resume highlights & career path</li>
              </ul>
              <p className="italic text-muted-foreground">
                Click "Start Chatting" to begin the conversation!
              </p>
            </div>
          )}

          <Button
            onClick={toggleChat}
            variant="outline"
            className="flex items-center space-x-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground mb-6"
            size="lg"
          >
            <MessageCircle size={18} />
            <span>{expanded ? "Hide Chat" : "Start Chatting"}</span>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Button>
        </div>

        <div
          className={cn(
            "transition-all duration-500 ease-in-out overflow-hidden",
            expanded ? "max-h-[75vh] opacity-100" : "max-h-0 opacity-0"
          )}
          style={{ visibility: expanded ? 'visible' : 'hidden' }}
        >
          {expanded && (
            <div className="animate-fade-in">
              <ChatUI />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Chat;
