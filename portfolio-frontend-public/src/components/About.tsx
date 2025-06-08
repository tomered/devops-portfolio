
import { useEffect, useRef, useState } from "react";
import { getAbout, AboutData } from "@/api/about";
import { LoadingSpinner, LoadingPulse } from "@/components/ui/loading-spinner";

const About = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [aboutData, setAboutData] = useState<AboutData>({
    journeyText: '',
    personalInterestsText: '',
    whatIDoList: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, options);

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Fetch about data on component mount
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        setLoading(true);
        const data = await getAbout();
        setAboutData(data);
      } catch (err) {
        setError('Failed to load about information');
        console.error('Error fetching about data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  if (loading) {
    return (
      <section id="about" className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              About <span className="text-primary">Me</span>
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
          </div>
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading about information..." />
          </div>
          <div className="grid md:grid-cols-2 gap-12 mt-8">
            <div className="glass-card p-6 md:p-8">
              <LoadingPulse>
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-4/5"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              </LoadingPulse>
            </div>
            <div className="flex flex-col space-y-6">
              <div className="glass-card p-6 md:p-8 flex-1">
                <LoadingPulse>
                  <div className="space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-4/5"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                    </div>
                  </div>
                </LoadingPulse>
              </div>
              <div className="glass-card p-6 md:p-8 flex-1">
                <LoadingPulse>
                  <div className="space-y-4">
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </LoadingPulse>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="about" className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              About <span className="text-primary">Me</span>
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
          </div>
          <div className="flex justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="py-24 px-6 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            About <span className="text-primary">Me</span>
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto"></div>
        </div>

        <div ref={sectionRef} className="grid md:grid-cols-2 gap-12 section">
          <div className="glass-card p-6 md:p-8">
            <h3 className="text-2xl font-bold mb-6">My Journey</h3>
            <div className="text-muted-foreground whitespace-pre-line">
              {aboutData.journeyText}
            </div>
          </div>

          <div className="flex flex-col space-y-6">
            <div className="glass-card p-6 md:p-8 flex-1">
              <h3 className="text-2xl font-bold mb-6">What I Do</h3>

              <ul className="space-y-3">
                {aboutData.whatIDoList.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1 text-primary">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6 md:p-8 flex-1">
              <h3 className="text-2xl font-bold mb-6">Personal Interests</h3>
              <div className="text-muted-foreground whitespace-pre-line">
                {aboutData.personalInterestsText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
