package com.verifysphere.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.verifysphere.api.dto.VerificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class VerificationService {

    private static final Logger logger = LoggerFactory.getLogger(VerificationService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Pattern JSON_PATTERN = Pattern.compile("\\{.*\\}", Pattern.DOTALL);

    private final GeminiApiClient geminiClient;
    private final UrlContentExtractor urlContentExtractor;

    public VerificationService(
            @Value("${gemini.api-key}") String apiKey,
            @Value("${gemini.model-name}") String modelName,
            UrlContentExtractor urlContentExtractor
    ) {
        this.urlContentExtractor = urlContentExtractor;
        
        // Validate API key is provided
        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.error("Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.");
            throw new RuntimeException("Gemini API key is required. Please set GEMINI_API_KEY environment variable.");
        }
        
        logger.info("Initializing Gemini API client with model: {}", modelName);
        logger.info("Using API key: {}...{} (length: {})", 
                   apiKey != null && apiKey.length() > 8 ? apiKey.substring(0, 8) : "null",
                   apiKey != null && apiKey.length() > 8 ? apiKey.substring(apiKey.length() - 4) : "",
                   apiKey != null ? apiKey.length() : 0);
        
        try {
            this.geminiClient = new GeminiApiClient(apiKey, modelName);
            logger.info("Gemini API client initialized successfully with direct Gemini API (not Vertex AI)");
        } catch (Exception e) {
            logger.error("Failed to initialize Gemini API client", e);
            throw new RuntimeException("Failed to initialize AI client: " + e.getMessage(), e);
        }
    }

    public VerificationResult verify(String input, String type) {
        logger.info("Starting verification for type: {}, input length: {}", type, 
                   input != null ? input.length() : 0);

        try {
            // Handle different input types
            String contentToAnalyze = input;
            String imageDataUrl = null;
            
            if ("image".equalsIgnoreCase(type)) {
                // For images, validate and store the data URL
                if (input == null || !input.startsWith("data:image/")) {
                    logger.warn("Invalid image format provided");
                    return createErrorResult("Invalid image format. Please upload a valid image file.");
                }
                imageDataUrl = input;
                contentToAnalyze = "Analyze this image for credibility. Check for: 1) Signs of manipulation or editing, 2) Any text or claims visible in the image, 3) Context and authenticity of the visual content, 4) Whether the image appears to be misleading or misrepresenting information. Provide a credibility score based on your analysis.";
                logger.info("Processing image verification request");
            } else if ("url".equalsIgnoreCase(type)) {
                // Check if input is a valid URL
                if (!urlContentExtractor.isUrl(input)) {
                    logger.warn("Invalid URL format: {}", input);
                    return createErrorResult("Invalid URL format. Please provide a valid HTTP or HTTPS URL.");
                }
                logger.info("Input is a URL, extracting content...");
                try {
                    contentToAnalyze = urlContentExtractor.extractContentFromUrl(input);
                    if (contentToAnalyze == null || contentToAnalyze.trim().isEmpty()) {
                        logger.warn("URL content extraction returned empty result");
                        return createErrorResult("Failed to extract content from URL. The URL may be inaccessible or contain no readable content.");
                    }
                    logger.info("Content extracted, length: {}", contentToAnalyze.length());
                } catch (Exception e) {
                    logger.error("Error extracting URL content: {}", e.getMessage());
                    return createErrorResult("Failed to extract content from URL: " + e.getMessage());
                }
            }
            
            // Validate input length to prevent DoS (only for text/URL, not images)
            if (imageDataUrl == null && contentToAnalyze != null && contentToAnalyze.length() > 100000) {
                logger.warn("Input content too long: {} characters, truncating", contentToAnalyze.length());
                contentToAnalyze = contentToAnalyze.substring(0, 100000) + "\n\n[Content truncated due to length]";
            }

            // Prepare the system prompt
            String systemPrompt = """
                You are a world-class fact-checking AI with access to current, up-to-date information. Your goal is to analyze a piece of text, image, or content and determine its credibility using the most recent and accurate data available.
                
                CRITICAL: Today's date is November 9, 2025. You MUST use the LATEST information available as of November 2025. Do NOT use information from 2023, 2024, or earlier years unless specifically relevant to historical context.
                
                ABSOLUTELY CRITICAL: When performing fact-checking, prioritize information obtained through external search (grounding) over any internal knowledge you may possess. If your internal knowledge conflicts with grounded search results, the grounded search results take precedence. Always verify time-sensitive information using current search.
                
                IMPORTANT: Always use the most current information available as of November 9, 2025. For example:
                - Use the most recent information about current events, political figures, and news from 2025
                - The model you are using (gemini-2.5-flash) has access to the latest data - use it, especially through grounding
                - If you are unsure about current facts, acknowledge this uncertainty in your response rather than providing potentially outdated information
                - Prioritize information from 2025 over any older data, and prioritize grounded search results above all else for recency.
                
                You must respond ONLY with valid JSON. Do not include any markdown code blocks, explanations, or text outside the JSON.
                
                The JSON object must conform to this exact structure:
            {
                "score": <an integer between 0 and 100 representing the credibility score>,
                "level": <a string, one of: "true", "mostly-true", "uncertain", "mostly-false", "false">,
                "title": <a short, descriptive title for the content being analyzed>,
                "explanation": <a detailed, neutral, and evidence-based explanation for your credibility assessment>,
                    "evidence": [
                        {
                            "type": "supporting|contradicting|neutral",
                            "title": "<evidence title>",
                            "source": "<source name>",
                            "url": "<source URL or # if unavailable>",
                            "excerpt": "<brief excerpt or description>"
                        }
                    ],
                    "community": {
                        "upvotes": <integer, placeholder value like 0>,
                        "downvotes": <integer, placeholder value like 0>,
                        "comments": <integer, placeholder value like 0>
                    }
            }
                
                Important rules:
                - The 'score' must be an integer between 0 and 100
                - The 'level' MUST be derived from the 'score' using these exact ranges: 0-20="false", 21-40="mostly-false", 41-60="uncertain", 61-80="mostly-true", 81-100="true"
                - The 'level' and 'score' MUST be consistent - if score is 85, level must be "mostly-true" or "true"
                - The 'explanation' should be comprehensive and evidence-based
                - The 'evidence' array should contain at least 2-3 pieces of evidence
                - All evidence items must include all required fields: type, title, source, url, excerpt
                - For the 'url' field in evidence: 
                  * Use a valid HTTP or HTTPS URL if a source is available (e.g., "https://example.com/article")
                  * Use "#" only if no source URL is available
                  * URLs must start with "http://" or "https://"
                  * Do not use relative URLs or invalid formats
                - Return ONLY the JSON object, no markdown, no code blocks, no explanations
                """;

            // Prepare the user message
            // Use proper UTF-8 character boundary for truncation to avoid breaking multi-byte characters
            if (contentToAnalyze == null) {
                logger.error("Content to analyze is null");
                return createErrorResult("Invalid content provided for verification");
            }
            
            String contentForPrompt = contentToAnalyze;
            if (imageDataUrl == null && contentToAnalyze.length() > 4000) {
                // Find the last complete character before 4000 chars
                int truncateAt = 4000;
                while (truncateAt > 0 && Character.isHighSurrogate(contentToAnalyze.charAt(truncateAt - 1))) {
                    truncateAt--;
                }
                contentForPrompt = contentToAnalyze.substring(0, truncateAt) + "\n\n[Content truncated for analysis]";
            }
            String userPrompt = String.format(
                "Please analyze the following content for credibility:\n\n%s",
                contentForPrompt
            );

            logger.info("Sending request to Gemini API...");
            
            // Send request to Gemini API (with image if provided)
            String aiResponse = geminiClient.generateContent(systemPrompt, userPrompt, imageDataUrl);
            logger.info("Received response from Gemini API, length: {}", aiResponse.length());

            // Extract JSON from response (handle cases where AI wraps JSON in markdown)
            String jsonString = extractJsonFromResponse(aiResponse);
            
            logger.info("Extracted JSON string, length: {}", jsonString.length());

            // Parse JSON to VerificationResult
            VerificationResult result = parseJsonResponse(jsonString);
            
            logger.info("Successfully parsed verification result: score={}, level={}", 
                       result.score(), result.level());
            
            return result;

        } catch (Exception e) {
            logger.error("Error during verification", e);
            // Return a default error result
            return createErrorResult("Verification failed: " + e.getMessage());
        }
    }

    private String extractJsonFromResponse(String response) {
        if (response == null || response.trim().isEmpty()) {
            throw new RuntimeException("Empty response from AI model");
        }
        
        // Try to find JSON in the response
        Matcher matcher = JSON_PATTERN.matcher(response);
        if (matcher.find()) {
            return matcher.group(0);
        }
        
        // If no JSON found, try to extract from markdown code blocks
        Pattern codeBlockPattern = Pattern.compile("```(?:json)?\\s*\\n(.*?)\\n```", Pattern.DOTALL);
        Matcher codeBlockMatcher = codeBlockPattern.matcher(response);
        if (codeBlockMatcher.find()) {
            return codeBlockMatcher.group(1).trim();
        }
        
        // If still no JSON found, throw error instead of hoping
        logger.error("Could not extract JSON from AI response. Response: {}", response);
        throw new RuntimeException("AI response does not contain valid JSON. Please try again.");
    }

    private VerificationResult parseJsonResponse(String jsonString) {
        try {
            VerificationResult result = objectMapper.readValue(jsonString, VerificationResult.class);
            
            // Ensure score is within valid range
            int score = Math.max(0, Math.min(100, result.score()));
            
            // Derive level from score to ensure accuracy
            String level = deriveLevelFromScore(score);
            
            // If the AI-provided level doesn't match the score, use the derived level
            if (!level.equals(result.level())) {
                logger.warn("Level mismatch detected: AI provided level '{}' for score {}, correcting to '{}'", 
                           result.level(), score, level);
            }
            
            // Validate evidence array structure and normalize URLs
            List<VerificationResult.Evidence> validEvidence = new java.util.ArrayList<>();
            if (result.evidence() != null) {
                for (VerificationResult.Evidence evidence : result.evidence()) {
                    if (evidence != null && 
                        evidence.type() != null && !evidence.type().trim().isEmpty() &&
                        evidence.title() != null && !evidence.title().trim().isEmpty() &&
                        evidence.source() != null && !evidence.source().trim().isEmpty() &&
                        evidence.url() != null && !evidence.url().trim().isEmpty() &&
                        evidence.excerpt() != null && !evidence.excerpt().trim().isEmpty()) {
                        
                        // Normalize and validate URL
                        String normalizedUrl = normalizeUrl(evidence.url());
                        
                        // Create evidence with normalized URL
                        validEvidence.add(new VerificationResult.Evidence(
                            evidence.type(),
                            evidence.title(),
                            evidence.source(),
                            normalizedUrl,
                            evidence.excerpt()
                        ));
                    }
                }
            }
            
            // If no valid evidence, add a default one
            if (validEvidence.isEmpty()) {
                validEvidence.add(new VerificationResult.Evidence(
                    "neutral",
                    "Analysis completed",
                    "AI Analysis",
                    "#",
                    "Content was analyzed using AI-powered fact-checking."
                ));
            }
            
            // Return corrected result with synchronized score and level
            return new VerificationResult(
                score,
                level,
                result.title() != null ? result.title() : "Credibility Analysis",
                result.explanation() != null ? result.explanation() : "Analysis completed.",
                validEvidence,
                result.community() != null ? result.community() : new VerificationResult.CommunityData(0, 0, 0)
            );
        } catch (Exception e) {
            logger.error("Failed to parse JSON response: {}", jsonString, e);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage(), e);
        }
    }
    
    private String deriveLevelFromScore(int score) {
        if (score <= 20) {
            return "false";
        } else if (score <= 40) {
            return "mostly-false";
        } else if (score <= 60) {
            return "uncertain";
        } else if (score <= 80) {
            return "mostly-true";
        } else {
            return "true";
        }
    }
    
    /**
     * Normalizes and validates URLs from evidence.
     * - Keeps "#" as-is (placeholder for no URL)
     * - Adds http:// if URL is missing scheme
     * - Validates URL format
     * - Returns "#" for invalid URLs
     */
    private String normalizeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return "#";
        }
        
        url = url.trim();
        
        // Keep "#" placeholder as-is
        if ("#".equals(url)) {
            return "#";
        }
        
        // If URL doesn't start with http:// or https://, try to add it
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            // Check if it looks like a domain
            if (url.contains(".") && !url.contains(" ")) {
                url = "https://" + url;
            } else {
                // Doesn't look like a valid URL, return placeholder
                logger.warn("Invalid URL format, using placeholder: {}", url);
                return "#";
            }
        }
        
        // Validate URL format
        try {
            java.net.URI uri = new java.net.URI(url);
            if (uri.getScheme() == null || (!uri.getScheme().equals("http") && !uri.getScheme().equals("https"))) {
                logger.warn("Invalid URL scheme, using placeholder: {}", url);
                return "#";
            }
            // Return normalized URL
            return url;
        } catch (java.net.URISyntaxException e) {
            logger.warn("Invalid URL syntax, using placeholder: {} - {}", url, e.getMessage());
            return "#";
        }
    }

    private VerificationResult createErrorResult(String errorMessage) {
        return new VerificationResult(
            0,
            "uncertain",
            "Verification Error",
            errorMessage,
            List.of(new VerificationResult.Evidence(
                "neutral",
                "Error during verification",
                "System",
                "#",
                "An error occurred while processing your verification request. Please try again."
            )),
            new VerificationResult.CommunityData(0, 0, 0)
        );
    }
}
