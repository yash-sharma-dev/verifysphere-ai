package com.verifysphere.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VerificationResult(
    int score,
    String level,
    String title,
    String explanation,
    List<Evidence> evidence,
    @JsonProperty("community")
    CommunityData community
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Evidence(
        String type,
        String title,
        String source,
        String url,
        String excerpt
    ) {}
    
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CommunityData(
        int upvotes,
        int downvotes,
        int comments
    ) {}
}
