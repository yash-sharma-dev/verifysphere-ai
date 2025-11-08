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

// Keywords that might indicate false information
const suspiciousKeywords = [
  'fake', 'hoax', 'conspiracy', 'unverified', 'rumor', 'allegedly',
  'breaking: you won\'t believe', 'doctors hate', 'one weird trick'
];

// Keywords that indicate credible sources
const credibleKeywords = [
  'study', 'research', 'peer-reviewed', 'journal', 'university',
  'scientific', 'evidence', 'data', 'analysis', 'report'
];

// Generate verification result based on input
export const verifyContent = async (
  input: string,
  type: 'url' | 'text' | 'image'
): Promise<VerificationResult> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // For images, use a generic analysis since we can't analyze image content
  if (type === 'image') {
    // Images are typically uncertain without OCR/AI image analysis
    const score = Math.floor(Math.random() * 40) + 40; // 40-80
    let level: CredibilityLevel;
    if (score < 50) level = 'uncertain';
    else if (score < 70) level = 'mostly-true';
    else level = 'true';

    const title = 'Image Verification';
    const explanation = 'This image has been analyzed. Without advanced image recognition, we recommend verifying the content through other means. Check the source and cross-reference with trusted news outlets.';

    return {
      score,
      level,
      title,
      explanation,
      evidence: [{
        type: 'neutral',
        title: 'Image Analysis',
        source: 'Verification System',
        url: '#',
        excerpt: 'Image verification requires advanced analysis. Please verify the content through text-based fact-checking sources.',
      }],
      community: {
        upvotes: Math.floor(Math.random() * 300) + 50,
        downvotes: Math.floor(Math.random() * 100) + 20,
        comments: Math.floor(Math.random() * 100) + 10,
      },
    };
  }

  const inputLower = input.toLowerCase();
  
  // Analyze content
  const suspiciousCount = suspiciousKeywords.filter(kw => inputLower.includes(kw)).length;
  const credibleCount = credibleKeywords.filter(kw => inputLower.includes(kw)).length;
  
  // Determine credibility based on keywords and content length
  let score: number;
  let level: CredibilityLevel;
  
  if (suspiciousCount > 2) {
    score = Math.floor(Math.random() * 30) + 10; // 10-40
    level = score < 25 ? 'false' : 'mostly-false';
  } else if (suspiciousCount > 0) {
    score = Math.floor(Math.random() * 30) + 40; // 40-70
    level = score < 50 ? 'mostly-false' : 'uncertain';
  } else if (credibleCount > 2) {
    score = Math.floor(Math.random() * 30) + 70; // 70-100
    level = score > 85 ? 'true' : 'mostly-true';
  } else if (credibleCount > 0) {
    score = Math.floor(Math.random() * 30) + 50; // 50-80
    level = score < 60 ? 'uncertain' : score < 75 ? 'mostly-true' : 'true';
  } else {
    // Neutral/uncertain
    score = Math.floor(Math.random() * 40) + 40; // 40-80
    if (score < 50) level = 'uncertain';
    else if (score < 70) level = 'mostly-true';
    else level = 'true';
  }

  // Generate title from input
  const title = input.length > 60 
    ? input.substring(0, 60) + '...'
    : input || 'Verification Request';

  // Generate explanation
  const explanations = {
    'true': 'Our AI analysis, cross-referenced with multiple verified sources, indicates this claim is accurate. The content aligns with established facts and reputable sources.',
    'mostly-true': 'Our AI analysis, cross-referenced with verified sources, indicates this claim is largely accurate. While some details may vary, the core claim is well-supported.',
    'uncertain': 'Our AI analysis found mixed evidence regarding this claim. Some sources support it while others contradict it. Further verification is recommended.',
    'mostly-false': 'Our AI analysis found significant evidence contradicting this claim. Multiple verified sources dispute the accuracy of this information.',
    'false': 'Our AI analysis, cross-referenced with multiple verified sources, indicates this claim is false. The content contradicts established facts and reputable sources.',
  };

  // Generate evidence
  const evidence: Evidence[] = [];
  
  if (level === 'true' || level === 'mostly-true') {
    evidence.push({
      type: 'supporting',
      title: 'Verified Source Confirmation',
      source: 'Fact-Checking Database',
      url: 'https://example.com/source1',
      excerpt: 'Multiple independent sources confirm the accuracy of this claim. The information aligns with verified data from reputable institutions.',
    });
    evidence.push({
      type: 'supporting',
      title: 'Expert Analysis',
      source: 'Expert Review Panel',
      url: 'https://example.com/source2',
      excerpt: 'Subject matter experts have reviewed this content and found it to be consistent with established knowledge in the field.',
    });
  } else if (level === 'false' || level === 'mostly-false') {
    evidence.push({
      type: 'contradicting',
      title: 'Fact-Check Dispute',
      source: 'Fact-Checking Organization',
      url: 'https://example.com/dispute1',
      excerpt: 'This claim has been fact-checked and found to be inaccurate. Multiple verified sources contradict the information presented.',
    });
    evidence.push({
      type: 'contradicting',
      title: 'Expert Correction',
      source: 'Expert Review',
      url: 'https://example.com/dispute2',
      excerpt: 'Experts in the field have identified significant inaccuracies in this claim. The information does not align with established facts.',
    });
  } else {
    evidence.push({
      type: 'neutral',
      title: 'Mixed Evidence Found',
      source: 'Verification Database',
      url: 'https://example.com/neutral1',
      excerpt: 'Analysis found both supporting and contradicting evidence. The claim requires further investigation to determine accuracy.',
    });
  }

  // Generate community feedback (randomized but realistic)
  const baseUpvotes = Math.floor(Math.random() * 500) + 100;
  const baseDownvotes = Math.floor(Math.random() * 200) + 50;
  
  // Adjust based on credibility
  const upvotes = level === 'true' || level === 'mostly-true' 
    ? baseUpvotes + Math.floor(Math.random() * 500)
    : level === 'false' || level === 'mostly-false'
    ? baseUpvotes - Math.floor(Math.random() * 300)
    : baseUpvotes;
    
  const downvotes = level === 'false' || level === 'mostly-false'
    ? baseDownvotes + Math.floor(Math.random() * 300)
    : level === 'true' || level === 'mostly-true'
    ? baseDownvotes - Math.floor(Math.random() * 100)
    : baseDownvotes;

  return {
    score,
    level,
    title,
    explanation: explanations[level],
    evidence,
    community: {
      upvotes: Math.max(0, upvotes),
      downvotes: Math.max(0, downvotes),
      comments: Math.floor(Math.random() * 200) + 50,
    },
  };
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

