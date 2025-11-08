package com.verifysphere.api.controller;

import com.verifysphere.api.dto.VerificationResult;
import com.verifysphere.api.dto.VerifyRequest;
import com.verifysphere.api.service.VerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class VerifyController {

    private static final Logger logger = LoggerFactory.getLogger(VerifyController.class);

    private final VerificationService verificationService;

    public VerifyController(VerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyRequest request) {
        try {
            // Validate request first before accessing fields
            if (request == null) {
                logger.warn("Received null request");
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Request cannot be null"));
            }

            logger.info("Received verification request for type: {}, input length: {}", 
                       request.type() != null ? request.type() : "null", 
                       request.input() != null ? request.input().length() : 0);

            // Validate input - don't trim images as it could corrupt base64 data
            boolean isImage = "image".equalsIgnoreCase(request.type());
            if (request.input() == null || 
                (isImage ? request.input().isEmpty() : request.input().trim().isEmpty())) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Input cannot be empty"));
            }
            
            if (request.type() == null || request.type().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Type must be specified (url, text, or image)"));
            }
            
            // Validate image type
            if (isImage) {
                String input = request.input();
                if (!input.startsWith("data:image/")) {
                    return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Invalid image format. Please upload a valid image file."));
                }
                // Check image size (base64 is ~33% larger than binary)
                if (input.length() > 7000000) { // ~5MB base64 = ~3.75MB binary
                    return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Image is too large. Maximum size is 5MB."));
                }
            } else {
                // Validate text/URL input length to prevent DoS
                if (request.input().length() > 100000) {
                    return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Input is too long. Maximum length is 100,000 characters."));
                }
            }

            // Process verification
            VerificationResult result = verificationService.verify(request.input(), request.type());
            
            logger.info("Verification completed successfully: score={}, level={}", 
                       result.score(), result.level());
            
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            logger.error("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error processing verification request", e);
            // Don't expose internal error details to client
            String errorMessage = "An error occurred while processing your request. Please try again later.";
            if (e.getMessage() != null && (e.getMessage().contains("URL") || e.getMessage().contains("input"))) {
                // Only expose user-facing validation errors
                errorMessage = e.getMessage();
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(errorMessage));
        }
    }

    // Error response record
    public record ErrorResponse(String error) {}
}
