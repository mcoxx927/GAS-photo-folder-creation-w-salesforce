// Salesforce Integration Functions (Stage 2 Enhancement)
// These functions will update Salesforce with the created folder URLs

/**
 * Enhanced web app handler that can optionally update Salesforce
 * Add parameter: &updateSalesforce=true
 */
function doGetEnhanced(e) {
  try {
    const address = e.parameter.address;
    const contactId = e.parameter.contactId;
    const salesforceRecordId = e.parameter.salesforceId; // Optional Salesforce record ID
    const updateSalesforce = e.parameter.updateSalesforce === 'true';
    
    // Validate required parameters
    if (!address || !contactId) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: "Missing required parameters: address and contactId"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Create the folder structure
    const result = createPhotoFolder(address, contactId);
    
    // Optional: Update Salesforce if requested and configured
    if (updateSalesforce && salesforceRecordId && result.success) {
      try {
        const sfResult = updateSalesforceRecord(salesforceRecordId, result.photosFolderUrl);
        result.salesforceUpdated = sfResult.success;
        result.salesforceMessage = sfResult.message;
      } catch (sfError) {
        result.salesforceUpdated = false;
        result.salesforceError = sfError.toString();
        Logger.log('Salesforce update failed: ' + sfError.toString());
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doGetEnhanced: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Update Salesforce record with photo folder URL
 * Requires Salesforce Connected App setup and OAuth token
 */
function updateSalesforceRecord(recordId, folderUrl) {
  // This is a template - requires actual Salesforce setup
  const SALESFORCE_INSTANCE_URL = PropertiesService.getScriptProperties().getProperty('SF_INSTANCE_URL');
  const ACCESS_TOKEN = getSalesforceAccessToken(); // Function to get/refresh OAuth token
  
  if (!SALESFORCE_INSTANCE_URL || !ACCESS_TOKEN) {
    throw new Error('Salesforce configuration incomplete');
  }
  
  const endpoint = `${SALESFORCE_INSTANCE_URL}/services/data/v57.0/sobjects/Contact/${recordId}`;
  
  const payload = {
    Photo_Folder_URL__c: folderUrl // Adjust field name as needed
  };
  
  const options = {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(endpoint, options);
  const responseCode = response.getResponseCode();
  
  if (responseCode === 204) {
    return { success: true, message: 'Salesforce updated successfully' };
  } else {
    const errorText = response.getContentText();
    throw new Error(`Salesforce update failed: ${responseCode} - ${errorText}`);
  }
}

/**
 * Get Salesforce OAuth token (simplified - needs proper implementation)
 * In production, this should handle token refresh and storage
 */
function getSalesforceAccessToken() {
  // This is a placeholder - implement OAuth flow
  // Options:
  // 1. Use Username/Password OAuth flow
  // 2. Use Connected App with JWT Bearer Token
  // 3. Store refresh token and handle refresh logic
  
  const storedToken = PropertiesService.getScriptProperties().getProperty('SF_ACCESS_TOKEN');
  const tokenExpiry = PropertiesService.getScriptProperties().getProperty('SF_TOKEN_EXPIRY');
  
  // Check if token needs refresh
  if (!storedToken || (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry))) {
    return refreshSalesforceToken();
  }
  
  return storedToken;
}

/**
 * Refresh Salesforce OAuth token
 */
function refreshSalesforceToken() {
  // Implement token refresh logic based on your OAuth setup
  // This is a simplified example using Username/Password flow
  
  const CLIENT_ID = PropertiesService.getScriptProperties().getProperty('SF_CLIENT_ID');
  const CLIENT_SECRET = PropertiesService.getScriptProperties().getProperty('SF_CLIENT_SECRET');
  const USERNAME = PropertiesService.getScriptProperties().getProperty('SF_USERNAME');
  const PASSWORD = PropertiesService.getScriptProperties().getProperty('SF_PASSWORD'); // Include security token
  const LOGIN_URL = PropertiesService.getScriptProperties().getProperty('SF_LOGIN_URL') || 'https://login.salesforce.com';
  
  const payload = {
    'grant_type': 'password',
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET,
    'username': USERNAME,
    'password': PASSWORD
  };
  
  const options = {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    'payload': Object.keys(payload).map(key => key + '=' + encodeURIComponent(payload[key])).join('&'),
    'muteHttpExceptions': true
  };
  
  const response = UrlFetchApp.fetch(`${LOGIN_URL}/services/oauth2/token`, options);
  const result = JSON.parse(response.getContentText());
  
  if (result.access_token) {
    // Store token with expiry (tokens typically last 2 hours)
    const expiryTime = new Date().getTime() + (2 * 60 * 60 * 1000); // 2 hours
    PropertiesService.getScriptProperties().setProperties({
      'SF_ACCESS_TOKEN': result.access_token,
      'SF_INSTANCE_URL': result.instance_url,
      'SF_TOKEN_EXPIRY': expiryTime.toString()
    });
    
    return result.access_token;
  } else {
    throw new Error('Failed to get Salesforce token: ' + response.getContentText());
  }
}

/**
 * Setup Salesforce credentials (run once)
 */
function setupSalesforceCredentials() {
  // Run this function once to store your Salesforce credentials
  // Replace with your actual values
  
  const properties = {
    'SF_CLIENT_ID': 'your_connected_app_client_id',
    'SF_CLIENT_SECRET': 'your_connected_app_client_secret',
    'SF_USERNAME': 'your_salesforce_username',
    'SF_PASSWORD': 'your_password_plus_security_token',
    'SF_LOGIN_URL': 'https://login.salesforce.com' // Use https://test.salesforce.com for sandbox
  };
  
  PropertiesService.getScriptProperties().setProperties(properties);
  Logger.log('✅ Salesforce credentials stored');
}