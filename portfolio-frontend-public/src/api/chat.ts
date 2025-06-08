
import { ChatMessageInterface } from '@/types';
import { fetchAPI } from './config';

// Function to send user message to backend
export const sendMessage = async (messages: ChatMessageInterface[], newMessage: string, conversationId: string): Promise<ChatMessageInterface> => {
  try {
    console.log('Sending message to API:', { messages, newMessage });
    
    const response = await fetchAPI('api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        newMessage,
        conversationId,
      }),
    });
    
    const responseWithTimestamp = {
      ...response,
      timestamp: new Date(),
    };

    console.log('Received response from API:', responseWithTimestamp);

    return responseWithTimestamp;
  } catch (error) {
    console.error('Failed to send message:', error);
    
    // Fallback to simulated response if API fails
    return {
      content: "Sorry, I couldn't process your request. Please try again later.",
      role: 'assistant',
      timestamp: new Date(),
    };
  }
};
