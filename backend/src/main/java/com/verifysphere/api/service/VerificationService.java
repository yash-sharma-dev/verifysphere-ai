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

    private final ClaudeApiClient claudeClient;
    private final TavilySearchClient tavilyClient;
    private final UrlContentExtractor urlContentExtractor;

    public VerificationService(
            @Value("${anthropic.api-key}") String anthropicApiKey,
            @Value("${anthropic.model-name}") String modelName,
            @Value("${tavily.api-key}") String tavilyApiKey,
            UrlContentExtractor urlContentExtractor
    ) {
        this.urlContentExtractor = urlContentExtractor;

        if (anthropicApiKey == null || anthropicApiKey.trim().isEmpty()) {
            logger.error("Anthropic API key is not configured. Please set ANTHROPIC_API_KEY environment variable.");
            throw new RuntimeException("Anthropic API key is required. Please set ANTHROPIC_API_KEY environment variable.");
        }
        if (tavilyApiKey == null || tavilyApiKey.trim().isEmpty()) {
            logger.error("Tavily API key is not configured. Please set TAVILY_API_KEY environment variable.");
            throw new RuntimeException("Tavily API key is required. Please set TAVILY_API_KEY environment variable.");
        }

        logger.info("Initializing Claude API client with model: {}", modelName);
        this.claudeClient = new ClaudeApiClient(anthropicApiKey, modelName);
        this.tavilyClient = new TavilySearchClient(tavilyApiKey);
        logger.info("Claude and Tavily clients initialized successfully");
    }

    public VerificationResult verify(String input, String type) {
        logger.info("Starting verification for type: {}, input length: {}", type,
                input != null ? input.length() : 0);

        try {
            String contentToAnalyze = input;
            String imageDataUrl = null;

            if ("image".equalsIgnoreCase(type)) {
                if (input == null || !input.startsWith("data:image/")) {
                    return createErrorResult("Invalid image format. Please upload a valid image file.");
                }
                imageDataUrl = input;
                // Pass 1: extract the claim from the image so we can search Tavily
                logger.info("Pass 1: extracting claim from image...");
                String extractedClaim = claudeClient.generateContent(
                    "You extract factual claims from images. Respond with only the core claim or statement visible in the image, in one or two sentences. No explanation, no commentary.",
                    "What claim or statement is being made in this image?",
                    imageDataUrl
                );
                logger.info("Extracted claim: {}", extractedClaim);
                contentToAnalyze = extractedClaim;

            } else if ("url".equalsIgnoreCase(type)) {
                if (!urlContentExtractor.isUrl(input)) {
                    return createErrorResult("Invalid URL format. Please provide a valid HTTP or HTTPS URL.");
                }
                try {
                    contentToAnalyze = urlContentExtractor.extractContentFromUrl(input);
                    if (contentToAnalyze == null || contentToAnalyze.trim().isEmpty()) {
                        return createErrorResult("Failed to extract content from URL. The URL may be inaccessible or contain no readable content.");
                    }
                    logger.info("Content extracted from URL, length: {}", contentToAnalyze.length());
                } catch (Exception e) {
                    logger.error("Error extracting URL content: {}", e.getMessage());
                    return createErrorResult("Failed to extract content from URL: " + e.getMessage());
                }
            }

            if (imageDataUrl == null && contentToAnalyze != null && contentToAnalyze.length() > 100000) {
                contentToAnalyze = contentToAnalyze.substring(0, 100000) + "\n\n[Content truncated due to length]";
            }

            // Run Tavily search for all types — for images, contentToAnalyze is the extracted claim
            String searchResults = "";
            if (contentToAnalyze != null) {
                String searchQuery = contentToAnalyze.length() > 300
                        ? contentToAnalyze.substring(0, 300)
                        : contentToAnalyze;
                logger.info("Running Tavily search for grounding...");
                searchResults = tavilyClient.search(searchQuery);
            }

            String systemPrompt = """
                You are a world-class fact-checking AI. Your job is to assess the truthfulness of the CLAIM being made — not the authenticity of a photo or the quality of writing.

                CRITICAL RULES:
                - For images: judge the CLAIM in the image, not whether the photo looks real. A genuine photo can spread a false claim.
                - Base your score primarily on the web search results provided. They are your ground truth.
                - Known hoaxes, scams, or debunked viral content must score 0-20 even if the image/text looks authentic.
                - If search results confirm a claim is a hoax or scam, score it 0-20 ("false").
                - Do NOT hallucinate URLs. Only use URLs that appear in the web search results. Use "#" for all others.

                You must respond ONLY with valid JSON. No markdown, no code blocks, no explanation outside the JSON.

                Required structure:
                {
                    "score": <integer 0-100>,
                    "level": <"true" | "mostly-true" | "uncertain" | "mostly-false" | "false">,
                    "title": <short descriptive title>,
                    "explanation": <detailed, evidence-based explanation>,
                    "evidence": [
                        {
                            "type": "supporting|contradicting|neutral",
                            "title": "<title>",
                            "source": "<source name>",
                            "url": "<URL from search results, or #>",
                            "excerpt": "<brief excerpt>"
                        }
                    ],
                    "community": { "upvotes": 0, "downvotes": 0, "comments": 0 }
                }

                Score-to-level mapping (strictly enforced):
                0-20 = "false", 21-40 = "mostly-false", 41-60 = "uncertain", 61-80 = "mostly-true", 81-100 = "true"
                """;

            String contentForPrompt = contentToAnalyze;
            if (imageDataUrl == null && contentToAnalyze != null && contentToAnalyze.length() > 4000) {
                int truncateAt = 4000;
                while (truncateAt > 0 && Character.isHighSurrogate(contentToAnalyze.charAt(truncateAt - 1))) {
                    truncateAt--;
                }
                contentForPrompt = contentToAnalyze.substring(0, truncateAt) + "\n\n[Content truncated for analysis]";
            }

            String userPrompt;
            if (imageDataUrl != null) {
                // For images: pass the extracted claim + search results, image is sent separately
                userPrompt = searchResults.isEmpty()
                    ? String.format("Analyze this image for credibility. The claim being made is: %s", contentForPrompt)
                    : String.format("%s\n\nAnalyze this image for credibility. The claim being made is: %s", searchResults, contentForPrompt);
            } else if (!searchResults.isEmpty()) {
                userPrompt = String.format(
                    "%s\n\nPlease analyze the following content for credibility:\n\n%s",
                    searchResults, contentForPrompt
                );
            } else {
                userPrompt = String.format(
                    "Please analyze the following content for credibility:\n\n%s",
                    contentForPrompt
                );
            }

            logger.info("Sending request to Claude API...");
            String aiResponse = claudeClient.generateContent(systemPrompt, userPrompt, imageDataUrl);
            logger.info("Received response from Claude API, length: {}", aiResponse.length());

            String jsonString = extractJsonFromResponse(aiResponse);
            VerificationResult result = parseJsonResponse(jsonString);

            logger.info("Verification complete: score={}, level={}", result.score(), result.level());
            return result;

        } catch (Exception e) {
            logger.error("Error during verification", e);
            return createErrorResult("Verification failed: " + e.getMessage());
        }
    }

    private String extractJsonFromResponse(String response) {
        if (response == null || response.trim().isEmpty()) {
            throw new RuntimeException("Empty response from AI model");
        }

        Matcher matcher = JSON_PATTERN.matcher(response);
        if (matcher.find()) {
            return matcher.group(0);
        }

        Pattern codeBlockPattern = Pattern.compile("```(?:json)?\\s*\\n(.*?)\\n```", Pattern.DOTALL);
        Matcher codeBlockMatcher = codeBlockPattern.matcher(response);
        if (codeBlockMatcher.find()) {
            return codeBlockMatcher.group(1).trim();
        }

        logger.error("Could not extract JSON from AI response: {}", response);
        throw new RuntimeException("AI response does not contain valid JSON. Please try again.");
    }

    private VerificationResult parseJsonResponse(String jsonString) {
        try {
            VerificationResult result = objectMapper.readValue(jsonString, VerificationResult.class);

            int score = Math.max(0, Math.min(100, result.score()));
            String level = deriveLevelFromScore(score);

            if (!level.equals(result.level())) {
                logger.warn("Level mismatch: AI returned '{}' for score {}, correcting to '{}'",
                        result.level(), score, level);
            }

            List<VerificationResult.Evidence> validEvidence = new java.util.ArrayList<>();
            if (result.evidence() != null) {
                for (VerificationResult.Evidence evidence : result.evidence()) {
                    if (evidence != null &&
                            evidence.type() != null && !evidence.type().trim().isEmpty() &&
                            evidence.title() != null && !evidence.title().trim().isEmpty() &&
                            evidence.source() != null && !evidence.source().trim().isEmpty() &&
                            evidence.url() != null && !evidence.url().trim().isEmpty() &&
                            evidence.excerpt() != null && !evidence.excerpt().trim().isEmpty()) {

                        validEvidence.add(new VerificationResult.Evidence(
                                evidence.type(),
                                evidence.title(),
                                evidence.source(),
                                normalizeUrl(evidence.url()),
                                evidence.excerpt()
                        ));
                    }
                }
            }

            if (validEvidence.isEmpty()) {
                validEvidence.add(new VerificationResult.Evidence(
                        "neutral", "Analysis completed", "AI Analysis", "#",
                        "Content was analyzed using AI-powered fact-checking."
                ));
            }

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
        if (score <= 20) return "false";
        if (score <= 40) return "mostly-false";
        if (score <= 60) return "uncertain";
        if (score <= 80) return "mostly-true";
        return "true";
    }

    private String normalizeUrl(String url) {
        if (url == null || url.trim().isEmpty()) return "#";
        url = url.trim();
        if ("#".equals(url)) return "#";
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            if (url.contains(".") && !url.contains(" ")) {
                url = "https://" + url;
            } else {
                return "#";
            }
        }
        try {
            java.net.URI uri = new java.net.URI(url);
            if (uri.getScheme() == null || (!uri.getScheme().equals("http") && !uri.getScheme().equals("https"))) {
                return "#";
            }
            return url;
        } catch (java.net.URISyntaxException e) {
            return "#";
        }
    }

    private VerificationResult createErrorResult(String errorMessage) {
        return new VerificationResult(
                0, "uncertain", "Verification Error", errorMessage,
                List.of(new VerificationResult.Evidence(
                        "neutral", "Error during verification", "System", "#",
                        "An error occurred while processing your request. Please try again."
                )),
                new VerificationResult.CommunityData(0, 0, 0)
        );
    }
}
