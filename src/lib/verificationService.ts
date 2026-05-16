import { supabase } from "@/lib/supabase";
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

type CredibilityLevel = 'true' | 'mostly-true' | 'uncertain' | 'mostly-false' | 'false';

interface Evidence {
  type: 'supporting' | 'contradicting' | 'neutral';
  title: string;
  source: string;
  url: string;
  excerpt: string;
}

export interface VerificationResult {
  score: number;
  level: CredibilityLevel;
  title: string;
  explanation: string;
  evidence: Evidence[];
  community: {
    upvotes: number;
    downvotes: number;
    comments: number;
  };
}

interface VerifyRequest {
  input: string;
  type: 'url' | 'text' | 'image';
}

interface ErrorResponse {
  error: string;
}

// Call the backend API to verify content
export const verifyContent = async (
  input: string,
  type: 'url' | 'text' | 'image'
): Promise<VerificationResult> => {
  try {
    // For images, we'll send the base64 data URL to the backend
    // The backend can process it or return a default response
    // Don't trim image data URLs as they contain base64 data
    const requestBody: VerifyRequest = {
      input: type === 'image' ? input : input.trim(),
      type: type,
    };

    const response = await fetch(`${API_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(errorData.error || `Verification failed: ${response.statusText}`);
    }

    const result: VerificationResult = await response.json();
    
    // Validate the result structure (score can be 0, so check for undefined/null)
    if (result.score === undefined || result.score === null || 
        !result.level || !result.title || !result.explanation) {
      throw new Error('Invalid response format from server');
    }

    return result;
  } catch (error) {
    console.error('Error verifying content:', error);
    
    // If it's a network error or the backend is unavailable, throw a helpful error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to verification service. Please check if the backend server is running.');
    }
    
    // Re-throw the error with the original message
    throw error instanceof Error 
      ? error 
      : new Error('An unexpected error occurred during verification');
  }
};

// Store verification in history
export const saveVerificationToHistory = async (
  input: string,
  type: 'url' | 'text' | 'image',
  result: VerificationResult
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("verification_history")
    .insert({
      user_id: user.id,
      input_text: input,
      verification_type: type,
      score: result.score,
      level: result.level,
      title: result.title,
    });

  if (error) {
    console.error("Error saving history:", error);
  }
};

// Get verification history
export const getVerificationHistory = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("verification_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching history:", error);
    return [];
  }

  return data;
};


export const deleteHistoryEntry = async (id: string) => {
  const { error } = await supabase
    .from("verification_history")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting history:", error);
  }
};


export const clearHistory = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("verification_history")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Error clearing history:", error);
  }
};


