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
export const saveVerificationToHistory = (input: string, type: 'url' | 'text' | 'image', result: VerificationResult) => {
  const history = JSON.parse(localStorage.getItem("verificationHistory") || "[]");
  const entry = {
    id: Date.now().toString(),
    input,
    type,
    result,
    timestamp: new Date().toISOString(),
  };
  history.unshift(entry);
  // Keep only last 50 verifications
  const limitedHistory = history.slice(0, 50);
  localStorage.setItem("verificationHistory", JSON.stringify(limitedHistory));
};

// Get verification history
export const getVerificationHistory = () => {
  return JSON.parse(localStorage.getItem("verificationHistory") || "[]");
};

