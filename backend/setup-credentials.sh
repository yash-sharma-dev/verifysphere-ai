#!/bin/bash

# Setup script for Google Cloud Vertex AI credentials

echo "=== Google Cloud Vertex AI Credentials Setup ==="
echo ""

# Check if gcloud is installed
if command -v gcloud &> /dev/null; then
    echo "✓ gcloud CLI is installed"
    
    # Check if already authenticated
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo "✓ Already authenticated with gcloud"
        ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
        echo "  Active account: $ACTIVE_ACCOUNT"
    else
        echo "⚠ Not authenticated. Run: gcloud auth login"
    fi
    
    # Set project
    echo ""
    echo "Setting project to: gen-lang-client-0887854472"
    gcloud config set project gen-lang-client-0887854472
    
    # Enable Vertex AI API
    echo ""
    echo "Enabling Vertex AI API..."
    gcloud services enable aiplatform.googleapis.com --project=gen-lang-client-0887854472
    
    # Set up application default credentials
    echo ""
    echo "Setting up application default credentials..."
    gcloud auth application-default login
    
    echo ""
    echo "✓ Setup complete!"
    echo ""
    echo "You can now start the backend with:"
    echo "  cd backend && mvn spring-boot:run"
    
else
    echo "⚠ gcloud CLI is not installed"
    echo ""
    echo "Option 1: Install gcloud CLI (Recommended for development)"
    echo "  Visit: https://cloud.google.com/sdk/docs/install"
    echo ""
    echo "Option 2: Use Service Account JSON file"
    echo "  1. Create service account in Google Cloud Console"
    echo "  2. Download JSON key file"
    echo "  3. Set environment variable:"
    echo "     export GOOGLE_APPLICATION_CREDENTIALS=\"/path/to/key.json\""
    echo ""
fi

echo ""
echo "Project ID: gen-lang-client-0887854472"
echo "Location: us-central1"
echo "Model: gemini-1.5-pro-latest"

