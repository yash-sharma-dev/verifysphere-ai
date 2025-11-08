package com.verifysphere.api.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.regex.Pattern;

@Service
public class UrlContentExtractor {

    private static final Logger logger = LoggerFactory.getLogger(UrlContentExtractor.class);
    private static final Pattern URL_PATTERN = Pattern.compile(
        "^https?://[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]"
    );

    public boolean isUrl(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }
        String trimmed = input.trim();
        try {
            URI uri = new URI(trimmed);
            return uri.getScheme() != null && 
                   (uri.getScheme().equals("http") || uri.getScheme().equals("https")) &&
                   URL_PATTERN.matcher(trimmed).matches();
        } catch (URISyntaxException e) {
            return false;
        }
    }

    public String extractContentFromUrl(String url) {
        try {
            logger.info("Extracting content from URL: {}", url);
            
            // Validate URL scheme before connecting
            if (!isUrl(url)) {
                throw new IllegalArgumentException("Invalid URL scheme. Only HTTP and HTTPS URLs are allowed.");
            }
            
            // Connect to URL and parse HTML
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .followRedirects(true)
                    .get();

            // Remove script and style elements
            doc.select("script, style, noscript").remove();

            // Extract title
            String title = doc.title();
            if (title == null || title.trim().isEmpty()) {
                Element titleElement = doc.selectFirst("h1");
                if (titleElement != null) {
                    title = titleElement.text();
                }
            }

            // Extract main content (try article, main, or body)
            Element contentElement = doc.selectFirst("article");
            if (contentElement == null) {
                contentElement = doc.selectFirst("main");
            }
            if (contentElement == null) {
                Element body = doc.body();
                if (body != null) {
                    contentElement = body;
                }
            }

            String content;
            if (contentElement != null) {
                content = contentElement.text();
            } else {
                Element body = doc.body();
                if (body != null) {
                    content = body.text();
                } else {
                    logger.warn("No body element found in document");
                    content = doc.text(); // Fallback to entire document text
                }
            }

            // Combine title and content
            StringBuilder result = new StringBuilder();
            if (title != null && !title.trim().isEmpty()) {
                result.append("Title: ").append(title).append("\n\n");
            }
            result.append("Content: ").append(content);

            // Limit content length to avoid token limits (keep first 5000 chars)
            String extracted = result.toString();
            if (extracted.length() > 5000) {
                extracted = extracted.substring(0, 5000) + "... [content truncated]";
            }

            logger.info("Successfully extracted content from URL, length: {}", extracted.length());
            return extracted;

        } catch (IOException e) {
            logger.error("Error extracting content from URL: {}", url, e);
            throw new RuntimeException("Failed to extract content from URL: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error extracting content from URL: {}", url, e);
            throw new RuntimeException("Unexpected error extracting content: " + e.getMessage(), e);
        }
    }
}

