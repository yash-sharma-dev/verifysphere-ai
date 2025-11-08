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
        
        logger.info("Initializing Gemini API client with model: {}", modelName);
        
        try {
            this.geminiClient = new GeminiApiClient(apiKey, modelName);
            logger.info("Gemini API client initialized successfully");
        } catch (Exception e) {
            logger.error("Failed to initialize Gemini API client", e);
            throw new RuntimeException("Failed to initialize AI client: " + e.getMessage(), e);
        }
    }

    public VerificationResult verify(String input, String type) {
        logger.info("Starting verification for type: {}, input length: {}", type, 
                   input != null ? input.length() : 0);

        try {
            // Extract content if input is a URL
            String contentToAnalyze = input;
            if ("url".equalsIgnoreCase(type) && urlContentExtractor.isUrl(input)) {
                logger.info("Input is a URL, extracting content...");
                contentToAnalyze = urlContentExtractor.extractContentFromUrl(input);
                logger.info("Content extracted, length: {}", contentToAnalyze.length());
            }

            // Prepare the system prompt
            String systemPrompt = """
                You are a world-class fact-checking AI. Your goal is to analyze a piece of text or content and determine its credibility.
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
                - The 'level' must be derived from the 'score': 0-20="false", 21-40="mostly-false", 41-60="uncertain", 61-80="mostly-true", 81-100="true"
                - The 'explanation' should be comprehensive and evidence-based
                - The 'evidence' array should contain at least 2-3 pieces of evidence
                - All evidence items must include all required fields: type, title, source, url, excerpt
                - Return ONLY the JSON object, no markdown, no code blocks, no explanations
                """;

            // Prepare the user message
            String userPrompt = String.format(
                "Please analyze the following content for credibility:\n\n%s",
                contentToAnalyze.length() > 4000 
                    ? contentToAnalyze.substring(0, 4000) + "\n\n[Content truncated for analysis]"
                    : contentToAnalyze
            );

            logger.info("Sending request to Gemini API...");
            
            // Send request to Gemini API
            String aiResponse = geminiClient.generateContent(systemPrompt, userPrompt);
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
        
        // If still no JSON, return the response as-is and hope it's valid JSON
        return response.trim();
    }

    private VerificationResult parseJsonResponse(String jsonString) {
        try {
            return objectMapper.readValue(jsonString, VerificationResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse JSON response: {}", jsonString, e);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage(), e);
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
