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
import java.util.HashMap;
import java.util.Map;

public class GeminiApiClient {

    private static final Logger logger = LoggerFactory.getLogger(GeminiApiClient.class);
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String modelName;

    public GeminiApiClient(String apiKey, String modelName) {
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
            String url = String.format(GEMINI_API_URL, modelName, apiKey);
            logger.info("Calling Gemini API with model: {}, API key: {}...{}", 
                       modelName,
                       apiKey != null && apiKey.length() > 8 ? apiKey.substring(0, 8) : "null",
                       apiKey != null && apiKey.length() > 8 ? apiKey.substring(apiKey.length() - 4) : "");
            
            Map<String, Object> requestBody = new HashMap<>();
            
            // Create contents array
            Map<String, Object> content = new HashMap<>();
            java.util.List<Map<String, Object>> parts = new java.util.ArrayList<>();
            
            // Add text part
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", systemPrompt + "\n\n" + userPrompt);
            parts.add(textPart);
            
            // Add image part if provided
            if (imageDataUrl != null && !imageDataUrl.trim().isEmpty()) {
                // Extract base64 data from data URL (format: data:image/type;base64,base64data)
                String base64Data = imageDataUrl;
                if (imageDataUrl.contains(",")) {
                    base64Data = imageDataUrl.substring(imageDataUrl.indexOf(",") + 1);
                }
                
                // Extract MIME type from data URL (format: data:image/type;base64,data)
                String mimeType = "image/jpeg"; // default
                if (imageDataUrl.startsWith("data:image/")) {
                    int mimeStart = 5; // after "data:"
                    int mimeEnd = imageDataUrl.indexOf(";");
                    if (mimeEnd < 0) {
                        mimeEnd = imageDataUrl.indexOf(",");
                    }
                    if (mimeEnd > mimeStart) {
                        mimeType = imageDataUrl.substring(mimeStart, mimeEnd);
                    }
                }
                
                // Gemini API expects image data nested under "inline_data"
                Map<String, Object> inlineData = new HashMap<>();
                inlineData.put("mime_type", mimeType);
                inlineData.put("data", base64Data);
                
                Map<String, Object> imagePart = new HashMap<>();
                imagePart.put("inline_data", inlineData);
                parts.add(imagePart);
                
                logger.info("Added image to Gemini API request, MIME type: {}, data length: {}", mimeType, base64Data.length());
            }
            
            content.put("parts", parts);
            requestBody.put("contents", new Object[]{content});

            // Add tools for Google Search grounding
            java.util.List<Map<String, Object>> tools = new java.util.ArrayList<>();
            Map<String, Object> googleSearchTool = new HashMap<>();
            googleSearchTool.put("google_search", new HashMap<>()); // Empty object for google_search tool
            tools.add(googleSearchTool);
            requestBody.put("tools", tools);
            
            // Add generation config
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.3);
            generationConfig.put("maxOutputTokens", 8192);
            requestBody.put("generationConfig", generationConfig);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(60))
                    .build();

            logger.debug("Sending request to Gemini API: {}", url);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                logger.error("Gemini API returned error: {} - {}", response.statusCode(), response.body());
                throw new RuntimeException("Gemini API error: " + response.statusCode() + " - " + response.body());
            }

            JsonNode jsonResponse = objectMapper.readTree(response.body());
            JsonNode candidates = jsonResponse.get("candidates");
            
            if (candidates == null || !candidates.isArray() || candidates.size() == 0) {
                logger.error("No candidates in Gemini API response: {}", response.body());
                throw new RuntimeException("No candidates in Gemini API response");
            }

            JsonNode firstCandidate = candidates.get(0);
            if (firstCandidate == null) {
                logger.error("First candidate is null in Gemini API response: {}", response.body());
                throw new RuntimeException("Invalid candidate structure in Gemini API response");
            }

            JsonNode responseContent = firstCandidate.get("content");
            if (responseContent == null) {
                logger.error("Content is null in Gemini API response: {}", response.body());
                throw new RuntimeException("No content in Gemini API response candidate");
            }

            JsonNode responseParts = responseContent.get("parts");
            if (responseParts == null || !responseParts.isArray() || responseParts.size() == 0) {
                logger.error("No parts or empty parts array in Gemini API response: {}", response.body());
                throw new RuntimeException("No parts in Gemini API response content");
            }

            JsonNode firstPart = responseParts.get(0);
            if (firstPart == null) {
                logger.error("First part is null in Gemini API response: {}", response.body());
                throw new RuntimeException("Invalid part structure in Gemini API response");
            }

            JsonNode text = firstPart.get("text");
            if (text == null) {
                logger.error("No text in Gemini API response: {}", response.body());
                throw new RuntimeException("No text in Gemini API response");
            }

            return text.asText();

        } catch (Exception e) {
            logger.error("Error calling Gemini API", e);
            throw new RuntimeException("Failed to call Gemini API: " + e.getMessage(), e);
        }
    }
}

