import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getProjects, Project } from "@/api/projects";
import { LoadingSpinner, LoadingPulse } from "@/components/ui/loading-spinner";

const ProjectCard = ({ project }: { project: Project }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="section glass-card p-6 md:p-8 flex flex-col h-full transition-transform duration-300 hover:-translate-y-1 hover:border-primary/50"
    >
      <div className="mb-2 text-xs text-primary font-medium">{project.type}</div>
      <h3 className="text-xl font-bold mb-3">{project.title}</h3>
      <p className="text-muted-foreground mb-6 flex-1">{project.description}</p>

      <div className="flex flex-wrap gap-2">
        {project.technologies.map((tech, index) => (
          <span key={index} className="px-3 py-1 bg-secondary text-xs rounded-full">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
};

const Projects = () => {
  const [filter, setFilter] = useState<string>("All");
  const [animating, setAnimating] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjectsData = async () => {
      try {
        setLoading(true);
        const projectsData = await getProjects();
        setProjects(projectsData);
        setDisplayedProjects(projectsData);
      } catch (err) {
        setError('Failed to load projects');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsData();
  }, []);

  // Filter projects when filter changes
  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => {
      if (filter === "All") {
        setDisplayedProjects(projects);
      } else {
        setDisplayedProjects(projects.filter(project => project.type === filter));
      }
      setAnimating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [filter, projects]);

  // Generate filters dynamically from project types
  const filters = ["All", ...Array.from(new Set(projects.map(project => project.type)))];

  if (loading) {
    return (
      <section id="projects" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured <span className="text-primary">Projects</span>
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
          </div>
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading projects..." />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="glass-card p-6 md:p-8">
                <LoadingPulse>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                      <div className="h-4 bg-muted rounded w-4/5"></div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <div className="h-6 bg-muted rounded-full w-16"></div>
                      <div className="h-6 bg-muted rounded-full w-20"></div>
                      <div className="h-6 bg-muted rounded-full w-14"></div>
                    </div>
                  </div>
                </LoadingPulse>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="projects" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured <span className="text-primary">Projects</span>
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
          </div>
          <div className="flex justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured <span className="text-primary">Projects</span>
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filters.map((filterName) => (
              <button
                key={filterName}
                onClick={() => setFilter(filterName)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filterName === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {filterName}
              </button>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-300",
            animating ? "opacity-0" : "opacity-100"
          )}
        >
          {displayedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
