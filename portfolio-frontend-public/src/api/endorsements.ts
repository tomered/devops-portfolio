import { fetchAPI } from './config';

export interface Endorsement {
  id: string;
  email: string;
  name: string;
  message: string;
  timestamp: string;
  skillId: string;
}

export interface EndorsementRequest {
  email: string;
  name: string;
  message: string;
  skillId: string;
  otp: string;
}

export interface OTPRequest {
  email: string;
  action: 'endorse' | 'delete';
  skillId?: string;
  endorsementId?: string;
}

export const getAllEndorsements = async (): Promise<Endorsement[]> => {
  try {
    const data = await fetchAPI('api/endorsements');
    return data.endorsements || [];
  } catch (error) {
    console.error('Failed to fetch endorsements:', error);
    return [];
  }
};

export const getEndorsementsBySkill = async (skillId: string): Promise<Endorsement[]> => {
  try {
    const data = await fetchAPI(`api/endorsements/skill/${skillId}`);
    return data.endorsements || [];
  } catch (error) {
    console.error('Failed to fetch endorsements for skill:', error);
    return [];
  }
};

export const requestOTP = async (request: OTPRequest): Promise<{ success: boolean; message: string }> => {
  try {
    const data = await fetchAPI('api/endorsements/request-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return data;
  } catch (error) {
    console.error('Failed to request OTP:', error);
    throw error;
  }
};

export const endorseSkill = async (request: EndorsementRequest): Promise<{ success: boolean; message: string; endorsement: Endorsement }> => {
  try {
    const data = await fetchAPI('api/endorsements', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return data;
  } catch (error) {
    console.error('Failed to endorse skill:', error);
    throw error;
  }
};

export const removeEndorsement = async (endorsementId: string, email: string, otp: string): Promise<{ success: boolean; message: string }> => {
  try {
    const data = await fetchAPI(`api/endorsements/${endorsementId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });
    return data;
  } catch (error) {
    console.error('Failed to remove endorsement:', error);
    throw error;
  }
}; 