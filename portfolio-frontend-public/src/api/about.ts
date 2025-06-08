import { fetchAPI } from './config';

export interface AboutData {
  journeyText: string;
  personalInterestsText: string;
  whatIDoList: string[];
}

export const getAbout = async (): Promise<AboutData> => {
  try {
    const data = await fetchAPI('api/get-about');
    return {
      journeyText: data.journeyText || '',
      personalInterestsText: data.personalInterestsText || '',
      whatIDoList: data.whatIDoList || []
    };
  } catch (error) {
    console.error('Failed to fetch about data:', error);
    // Return empty data as fallback
    return {
      journeyText: '',
      personalInterestsText: '',
      whatIDoList: []
    };
  }
}; 