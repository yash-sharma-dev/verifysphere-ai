package com.verifysphere.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ClaudeApiClient {

    private static final Logger logger = LoggerFactory.getLogger(ClaudeApiClient.class);
    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String modelName;

    public ClaudeApiClient(String apiKey, String modelName) {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public String generateContent(String systemPrompt, String userPrompt) {
        return generateContent(systemPrompt, userPrompt, null);
    }

    public String generateContent(String systemPrompt, String userPrompt, String imageDataUrl) {
        try {
            logger.info("Calling Claude API with model: {}, API key: {}...{}",
                    modelName,
                    apiKey != null && apiKey.length() > 8 ? apiKey.substring(0, 8) : "null",
                    apiKey != null && apiKey.length() > 8 ? apiKey.substring(apiKey.length() - 4) : "");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("max_tokens", 8192);
            requestBody.put("system", systemPrompt);

            List<Map<String, Object>> contentParts = new ArrayList<>();

            if (imageDataUrl != null && !imageDataUrl.trim().isEmpty()) {
                String base64Data = imageDataUrl;
                String mimeType = "image/jpeg";

                if (imageDataUrl.contains(",")) {
                    base64Data = imageDataUrl.substring(imageDataUrl.indexOf(",") + 1);
                }
                if (imageDataUrl.startsWith("data:image/")) {
                    int mimeEnd = imageDataUrl.indexOf(";");
                    if (mimeEnd < 0) mimeEnd = imageDataUrl.indexOf(",");
                    if (mimeEnd > 5) mimeType = imageDataUrl.substring(5, mimeEnd);
                }

                Map<String, Object> imageSource = new HashMap<>();
                imageSource.put("type", "base64");
                imageSource.put("media_type", mimeType);
                imageSource.put("data", base64Data);

                Map<String, Object> imagePart = new HashMap<>();
                imagePart.put("type", "image");
                imagePart.put("source", imageSource);
                contentParts.add(imagePart);

                logger.info("Added image to request, MIME type: {}, data length: {}", mimeType, base64Data.length());
            }

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("type", "text");
            textPart.put("text", userPrompt);
            contentParts.add(textPart);

            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", contentParts);

            requestBody.put("messages", List.of(userMessage));

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ANTHROPIC_API_URL))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", ANTHROPIC_VERSION)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(60))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                logger.error("Claude API returned error: {} - {}", response.statusCode(), response.body());
                throw new RuntimeException("Claude API error: " + response.statusCode() + " - " + response.body());
            }

            JsonNode jsonResponse = objectMapper.readTree(response.body());
            JsonNode contentArray = jsonResponse.get("content");

            if (contentArray == null || !contentArray.isArray() || contentArray.size() == 0) {
                logger.error("No content in Claude API response: {}", response.body());
                throw new RuntimeException("No content in Claude API response");
            }

            for (JsonNode block : contentArray) {
                if ("text".equals(block.path("type").asText()) && block.has("text")) {
                    String result = block.get("text").asText();
                    logger.info("Claude API response length: {}", result.length());
                    return result;
                }
            }

            throw new RuntimeException("No text block in Claude API response");

        } catch (Exception e) {
            logger.error("Error calling Claude API", e);
            throw new RuntimeException("Failed to call Claude API: " + e.getMessage(), e);
        }
    }
}
