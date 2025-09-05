# Photo Folder Creator - Deployment Guide

## Stage 1: Basic Folder Creation via URL

### Setup Steps

1. **Create New Google Apps Script Project**
   - Go to https://script.google.com
   - Click "New Project"
   - Copy the contents of `photoFolderCreator.gs` and `simpleConfig.gs`

2. **Enable Required Services**
   - In GAS editor: Extensions → Apps Script → Add a service
   - Select "Drive API" → Add
   - This enables the advanced Drive permissions needed

3. **Configure Settings**
   - Copy `simpleConfig.template.gs` to `simpleConfig.gs`
   - Update `PARENT_FOLDER_ID` in `simpleConfig.gs` with your Google Drive folder ID
   - Update `DOMAIN_NAME` with your company domain

4. **Test Configuration**
   - Run the `testConfig()` function to verify folder access
   - Run the `testFolderCreation()` function to create a test folder

5. **Deploy as Web App**
   - Click "Deploy" → "New Deployment"
   - Choose type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone" (required for Salesforce to call it)
   - Click "Deploy"
   - Copy the web app URL

### Usage

**URL Format:**
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?address=123%20Main%20St&contactId=12345
```

**Response Format:**
```json
{
  "success": true,
  "address": "123 Main St",
  "contactId": "12345",
  "propertyFolderUrl": "https://drive.google.com/drive/folders/...",
  "photosFolderUrl": "https://drive.google.com/drive/folders/...",
  "propertyFolderId": "folder_id_here",
  "photosFolderId": "photos_folder_id_here",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Integration with Salesforce

**Option 1: Simple URL Button**
- Create a custom button in Salesforce that opens the URL in a new tab
- URL: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?address={Property_Address__c}&contactId={Id}`

**Option 2: Apex Callout (Future Enhancement)**
- Use Salesforce Apex to make HTTP callout to the web app
- Parse response and update Salesforce record with folder URLs

## Stage 2: Salesforce Integration (Future)

### Zapier Integration
- Trigger: New folder created (webhook from GAS)
- Action: Update Salesforce record with folder URLs

### Direct Salesforce API
- Add Salesforce REST API calls to update records
- Requires OAuth setup and token management

## Troubleshooting

**Common Issues:**
- Permission errors: Ensure Drive API is enabled
- Folder not found: Verify PARENT_FOLDER_ID is correct
- Access denied: Check web app permissions are set to "Anyone"

**Testing:**
- Use the browser to test the URL directly
- Check Google Apps Script logs for errors
- Verify folder permissions in Google Drive