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
            logger.info("Received verification request for type: {}, input length: {}", 
                       request.type(), 
                       request.input() != null ? request.input().length() : 0);

            // Validate request
            if (request == null || request.input() == null || request.input().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Input cannot be empty"));
            }

            if (request.type() == null || request.type().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Type must be specified (url, text, or image)"));
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error: " + e.getMessage()));
        }
    }

    // Error response record
    public record ErrorResponse(String error) {}
}
