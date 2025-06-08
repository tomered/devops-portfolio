import { fetchAPI } from './config';

export interface Skill {
  name: string;
  level: number;
  id?: string;
}

export interface SkillCategory {
  title: string;
  skills: Skill[];
}

export interface SkillsData {
  skillCategories: SkillCategory[];
  tools: string[];
}

export const getSkills = async (): Promise<SkillsData> => {
  try {
    const data = await fetchAPI('api/get-skills');
    return {
      skillCategories: data.skillCategories || [],
      tools: data.tools || []
    };
  } catch (error) {
    console.error('Failed to fetch skills:', error);
    // Return empty data as fallback
    return {
      skillCategories: [],
      tools: []
    };
  }
};

 