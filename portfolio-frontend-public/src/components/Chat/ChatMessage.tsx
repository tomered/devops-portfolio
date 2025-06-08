import { cn } from "@/lib/utils";
import { ChatMessageInterface } from "@/types";

interface ChatMessageProps {
  message: ChatMessageInterface;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  // Handle both Date objects and ISO strings
  const formatTime = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render message content with HTML links
  const renderMessageContent = (content: string) => {
    // Automatically convert email addresses to mailto links
    const formattedContent = content.replace(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '<a href="mailto:$1" class="underline text-blue-500">$1</a>'
    );

    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-4",
          isUser
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-secondary text-secondary-foreground mr-auto"
        )}
      >
        <div className="prose dark:prose-invert text-sm whitespace-pre-wrap text-left">
          {renderMessageContent(message.content)}
        </div>
        <div
          className={cn(
            "text-xs mt-2",
            isUser ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
