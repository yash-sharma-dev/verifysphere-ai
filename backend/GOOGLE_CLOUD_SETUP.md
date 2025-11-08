# Google Cloud Vertex AI Setup Guide

## Quick Setup Steps

### 1. Enable Vertex AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **gen-lang-client-0887854472**
3. Navigate to [Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)
4. Click **"Enable"**

### 2. Create Service Account

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=gen-lang-client-0887854472)
2. Click **"Create Service Account"**
3. Enter a name (e.g., `vertex-ai-service`)
4. Click **"Create and Continue"**
5. Grant role: **"Vertex AI User"**
6. Click **"Continue"** then **"Done"**

### 3. Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the **"Keys"** tab
3. Click **"Add Key"** > **"Create new key"**
4. Select **"JSON"** format
5. Click **"Create"** - this downloads a JSON file

### 4. Set Up Credentials

**Option A: Environment Variable (Recommended for Development)**

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

**Option B: Place in Project Directory**

1. Create a `credentials` directory in the backend folder:
   ```bash
   mkdir -p backend/credentials
   ```

2. Move the downloaded JSON file there:
   ```bash
   mv ~/Downloads/your-service-account-key.json backend/credentials/
   ```

3. Add to `.gitignore`:
   ```
   backend/credentials/*.json
   ```

4. Set environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/backend/credentials/your-service-account-key.json"
   ```

### 5. Verify Setup

Test the credentials:
```bash
cd backend
mvn spring-boot:run
```

Check the logs - you should see:
```
INFO: Vertex AI model initialized successfully
```

## Current Configuration

- **Project ID**: gen-lang-client-0887854472
- **Location**: us-central1
- **Model**: gemini-1.5-pro-latest

## Troubleshooting

### Error: "Failed to initialize Vertex AI model"

**Solution**: Make sure:
1. Vertex AI API is enabled
2. Service account has "Vertex AI User" role
3. `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set correctly
4. The JSON key file path is correct

### Error: "Permission denied"

**Solution**: Ensure the service account has the **"Vertex AI User"** role.

## API Key Note

The API key you provided (`AIzaSyCCDcyj0pKyPoxzJou8YoyrF0FyLJNgZYM`) is for the Gemini API, not Vertex AI. 
Vertex AI requires service account credentials. The API key is stored in `application.properties` 
but won't be used by Vertex AI - it's kept for reference or future use with Gemini API directly.
