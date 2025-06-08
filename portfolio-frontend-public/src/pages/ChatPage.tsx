
import { useEffect } from "react";
import ChatUI from "@/components/Chat/ChatUI";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ChatPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Add a custom class to body for this page
    document.body.classList.add('chat-page');
    
    return () => {
      // Clean up when leaving this page
      document.body.classList.remove('chat-page');
    };
  }, []);
  
  return (
    <div className="min-h-screen pt-20 px-6">
      <div className="container mx-auto h-full">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Portfolio
          </Button>
        </div>
        
        <ChatUI />
      </div>
    </div>
  );
};

export default ChatPage;
