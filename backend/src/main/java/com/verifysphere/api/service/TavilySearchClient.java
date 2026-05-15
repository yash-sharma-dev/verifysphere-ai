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

public class TavilySearchClient {

    private static final Logger logger = LoggerFactory.getLogger(TavilySearchClient.class);
    private static final String TAVILY_API_URL = "https://api.tavily.com/search";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;

    public TavilySearchClient(String apiKey) {
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public String search(String query) {
        try {
            String truncatedQuery = query.length() > 400 ? query.substring(0, 400) : query;

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("api_key", apiKey);
            requestBody.put("query", truncatedQuery);
            requestBody.put("search_depth", "advanced");
            requestBody.put("max_results", 5);
            requestBody.put("include_answer", false);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TAVILY_API_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                logger.warn("Tavily search error: {} - {}", response.statusCode(), response.body());
                return "";
            }

            JsonNode jsonResponse = objectMapper.readTree(response.body());
            JsonNode results = jsonResponse.get("results");

            if (results == null || !results.isArray() || results.size() == 0) {
                return "";
            }

            StringBuilder sb = new StringBuilder("Web search results:\n\n");
            for (JsonNode result : results) {
                String title = result.path("title").asText("");
                String url = result.path("url").asText("#");
                String content = result.path("content").asText("");
                if (!title.isEmpty() || !content.isEmpty()) {
                    sb.append("Source: ").append(title).append("\n");
                    sb.append("URL: ").append(url).append("\n");
                    sb.append("Content: ").append(content).append("\n\n");
                }
            }

            logger.info("Tavily returned {} results for query: {}", results.size(), truncatedQuery);
            return sb.toString();

        } catch (Exception e) {
            logger.warn("Tavily search failed, proceeding without web grounding: {}", e.getMessage());
            return "";
        }
    }
}
