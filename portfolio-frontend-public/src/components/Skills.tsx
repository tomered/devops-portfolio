import { useRef, useEffect, useState } from 'react';
import { getSkills, SkillsData, SkillCategory } from '@/api/skills';
import { getAllEndorsements, endorseSkill, removeEndorsement, requestOTP, Endorsement } from '@/api/endorsements';
import { EndorsementDialog } from '@/components/ui/EndorsementDialog';
import { EndorsementsList } from '@/components/ui/EndorsementsList';
import { Button } from '@/components/ui/button';
import { Heart, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner, LoadingPulse } from '@/components/ui/loading-spinner';

interface SkillProps {
  name: string;
  level: number;
  endorsements: Endorsement[];
  skillId: string;
  color?: string;
  onEndorse: (skillId: string, skillName: string) => void;
  onDeleteEndorsement: (endorsementId: string, email: string, otp: string) => Promise<void>;
  onRequestDeleteOTP: (email: string, endorsementId: string) => Promise<void>;
}

const Skill = ({
  name,
  level,
  endorsements,
  skillId,
  color = "bg-primary",
  onEndorse,
  onDeleteEndorsement,
  onRequestDeleteOTP
}: SkillProps) => {
  const skillRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimate(true);
        }
      },
      { threshold: 0.1 }
    );

    if (skillRef.current) {
      observer.observe(skillRef.current);
    }

    return () => {
      if (skillRef.current) {
        observer.unobserve(skillRef.current);
      }
    };
  }, []);

  return (
    <div ref={skillRef} className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <span className="font-medium">{name}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEndorse(skillId, name)}
            className="h-7 px-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
          >
            <Plus className="h-3 w-3 mr-1" />
            Endorse
          </Button>
        </div>
        <span className="text-muted-foreground">{level}%</span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: animate ? `${level}%` : '0%' }}
        ></div>
      </div>

      <EndorsementsList
        endorsements={endorsements}
        skillName={name}
        onDeleteEndorsement={onDeleteEndorsement}
        onRequestDeleteOTP={onRequestDeleteOTP}
      />
    </div>
  );
};

interface ToolBadgeProps {
  name: string;
}

const ToolBadge = ({ name }: ToolBadgeProps) => {
  return (
    <div className="bg-secondary px-4 py-2 rounded-full text-sm inline-flex items-center justify-center">
      {name}
    </div>
  );
};

const Skills = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [skillsData, setSkillsData] = useState<SkillsData>({ skillCategories: [], tools: [] });
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endorsementDialog, setEndorsementDialog] = useState<{
    isOpen: boolean;
    skillId: string;
    skillName: string;
  }>({ isOpen: false, skillId: '', skillName: '' });
  const [endorsementLoading, setEndorsementLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Fetch skills and endorsements on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [skillsResponse, endorsementsResponse] = await Promise.all([
          getSkills(),
          getAllEndorsements()
        ]);
        setSkillsData(skillsResponse);
        setEndorsements(endorsementsResponse);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to get endorsements for a specific skill
  const getEndorsementsForSkill = (skillId: string): Endorsement[] => {
    return endorsements.filter(endorsement => endorsement.skillId === skillId);
  };

  const handleEndorse = (skillId: string, skillName: string) => {
    setEndorsementDialog({ isOpen: true, skillId, skillName });
  };

  const handleRequestOTP = async (email: string, skillId: string) => {
    await requestOTP({ email, action: 'endorse', skillId });
  };

  const handleEndorseSubmit = async (name: string, email: string, message: string, otp: string) => {
    try {
      setEndorsementLoading(true);
      const result = await endorseSkill({
        skillId: endorsementDialog.skillId,
        name,
        email,
        message,
        otp
      });

      if (result.success) {
        // Update endorsements list with new endorsement
        setEndorsements(prev => [...prev, result.endorsement]);
      }
    } finally {
      setEndorsementLoading(false);
    }
  };

  const handleRequestDeleteOTP = async (email: string, endorsementId: string) => {
    await requestOTP({ email, action: 'delete', endorsementId });
  };

  const handleDeleteEndorsement = async (endorsementId: string, email: string, otp: string) => {
    try {
      const result = await removeEndorsement(endorsementId, email, otp);

      if (result.success) {
        // Update endorsements list by removing the endorsement
        setEndorsements(prev => prev.filter(e => e.id !== endorsementId));
      }
    } catch (error: unknown) {
      // Re-throw with a user-friendly message
      let errorMessage = 'Failed to delete endorsement. Please check your verification code.';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      }
      throw new Error(errorMessage);
    }
  };

  if (loading) {
    return (
      <section id="skills" className="py-24 px-6 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Professional <span className="text-primary">Skills</span>
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
          </div>
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading skills and endorsements..." />
          </div>
          <div className="grid md:grid-cols-2 gap-10 mt-8">
            <div className="glass-card p-6 md:p-8">
              <LoadingPulse>
                <div className="space-y-6">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded-full"></div>
                  </div>
                </div>
              </LoadingPulse>
            </div>
            <div className="glass-card p-6 md:p-8">
              <LoadingPulse>
                <div className="space-y-6">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded-full"></div>
                  </div>
                </div>
              </LoadingPulse>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="skills" className="py-24 px-6 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Professional <span className="text-primary">Skills</span>
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
    <section id="skills" className="py-24 px-6 bg-secondary/20">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Professional <span className="text-primary">Skills</span>
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">
            If you like, you can support me by endorsing my skills!
          </p>
        </div>

        <div ref={sectionRef} className="section">
          <div className="grid md:grid-cols-2 gap-10">
            {skillsData.skillCategories.map((category, index) => (
              <div key={index} className="glass-card p-6 md:p-8">
                <h3 className="text-2xl font-bold mb-6">{category.title}</h3>
                <div>
                  {category.skills.map((skill, skillIndex) => {
                    const skillId = skill.id || `${category.title}-${skill.name}`.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <Skill
                        key={skillIndex}
                        name={skill.name}
                        level={skill.level}
                        endorsements={getEndorsementsForSkill(skillId)}
                        skillId={skillId}
                        onEndorse={handleEndorse}
                        onDeleteEndorsement={handleDeleteEndorsement}
                        onRequestDeleteOTP={handleRequestDeleteOTP}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {skillsData.tools.length > 0 && (
            <div className="mt-12 glass-card p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-6">Tools & Technologies</h3>
              <div className="flex flex-wrap gap-3">
                {skillsData.tools.map((tool, index) => (
                  <ToolBadge key={index} name={tool} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <EndorsementDialog
        isOpen={endorsementDialog.isOpen}
        onClose={() => setEndorsementDialog({ isOpen: false, skillId: '', skillName: '' })}
        skillName={endorsementDialog.skillName}
        skillId={endorsementDialog.skillId}
        onEndorse={handleEndorseSubmit}
        onRequestOTP={handleRequestOTP}
        isLoading={endorsementLoading}
      />
    </section>
  );
};

export default Skills;
