import { fetchAPI } from './config';

export interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string[];
  type: string;
}

export const getProjects = async (): Promise<Project[]> => {
  try {
    const data = await fetchAPI('api/get-projects');
    return data.projects || [];
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    // Return empty array as fallback
    return [];
  }
}; 