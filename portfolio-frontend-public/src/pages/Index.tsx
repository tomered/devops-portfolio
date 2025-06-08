
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Initialize any effects or animations here
    const handleScroll = () => {
      const sections = document.querySelectorAll(".section");
      
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.75) {
          section.classList.add("visible");
        }
      });
    };
    
    window.addEventListener("scroll", handleScroll);
    // Trigger once on load
    handleScroll();
    
    // Welcome toast
    setTimeout(() => {
      toast({
        title: "Welcome to Tomer's Portfolio",
        description: "Chat with the AI assistant to learn more about Tomer's experience!",
      });
    }, 1500);
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [toast]);
  
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
