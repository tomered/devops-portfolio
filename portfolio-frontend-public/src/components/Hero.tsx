
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatUI from "./Chat/ChatUI";

const Hero = () => {
  const textContainers = useRef<(HTMLSpanElement | null)[]>([]);
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const spans = entry.target.querySelectorAll(".reveal-text");
          spans.forEach((span, index) => {
            setTimeout(() => {
              span.classList.add("revealed");
            }, index * 100);
          });
        }
      });
    }, options);

    textContainers.current.forEach((container) => {
      if (container) observer.observe(container);
    });

    return () => {
      textContainers.current.forEach((container) => {
        if (container) observer.unobserve(container);
      });
    };
  }, []);

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="hero-gradient">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
      </div>

      <div className="container mx-auto relative z-10 pt-24">
        <div className="max-w-3xl mx-auto text-center">
          <span
            ref={(el) => (textContainers.current[0] = el)}
            className="reveal-container block mb-3"
          >
            <span className="text-primary text-lg font-medium reveal-text">HELLO, I'M TOMER</span>
          </span>

          <div className="mb-6">
            <span
              ref={(el) => (textContainers.current[1] = el)}
              className="reveal-container block"
            >
              <h1 className="text-5xl md:text-7xl font-bold reveal-text">
                DEVOPS ENGINEER
              </h1>
            </span>
          </div>

          <span
            ref={(el) => (textContainers.current[2] = el)}
            className="reveal-container block mb-8"
          >
            <p className="text-xl text-muted-foreground reveal-text">
              Automating workflows, optimizing infrastructure, and delivering seamless deployments
            </p>
          </span>

          {!showChat && (
            <div className="mb-8 max-w-2xl mx-auto animate-fade-in">
              <p className="text-lg mb-6">
                Have questions about my experience, skills, or projects? Chat with my AI assistant for immediate answers based on my portfolio and resume.
              </p>
              <span
                ref={(el) => (textContainers.current[3] = el)}
                className="reveal-container inline-block"
              >
                <Button
                  onClick={() => setShowChat(true)}
                  className="flex items-center space-x-2 bg-primary text-primary-foreground px-8 py-6 rounded-md font-medium text-lg reveal-text hover:bg-primary/90 transition-colors"
                >
                  <MessageCircle size={24} />
                  <span>CHAT WITH MY AI</span>
                </Button>
              </span>
            </div>
          )}

          {showChat && (
            <div className="animate-fade-in max-w-4xl mx-auto mt-12">
              <ChatUI onClose={() => setShowChat(false)} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
