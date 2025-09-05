// Simplified Photo Folder Creator
// Configuration - these should match your simpleConfig.gs values
const PARENT_FOLDER_ID = '1lgDlrusiSDXV4DG15XsB1MMmo6FoVHXo'; // Your parent folder for property folders
const DOMAIN_NAME = 'quickfixrealestate.com'; // Your company domain for folder permissions

/**
 * Web app entry point - handles GET requests
 * URL format: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?address=123%20Main%20St&contactId=12345
 */
function doGet(e) {
  try {
    const address = e.parameter.address;
    const contactId = e.parameter.contactId;
    const repEmail = e.parameter.repEmail;
    
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
    
    // Send email if rep email is provided
    if (repEmail && result.success) {
      sendPhotoUploadEmail(repEmail, address, result.photosFolderUrl);
      result.emailSent = true;
      result.emailTo = repEmail;
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Creates a property folder with a photos subfolder
 * @param {string} address - Property address
 * @param {string} contactId - Contact ID from Salesforce
 * @returns {object} Result object with folder URLs and success status
 */
function createPhotoFolder(address, contactId) {
  try {
    // Get parent folder
    const parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    
    // Create property folder with contact ID for uniqueness
    const folderName = `${address} - ${contactId}`;
    const propertyFolder = parentFolder.createFolder(folderName);
    
    // Create Photos subfolder
    const photosFolder = propertyFolder.createFolder("Photos");
    
    // Set permissions using DriveApp (basic sharing)
    try {
      // Make photos folder publicly accessible
      photosFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
      Logger.log('✅ Photos folder set to public edit access');
      
      // Make property folder accessible to domain users
      propertyFolder.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.EDIT);
      Logger.log('✅ Property folder set to domain edit access');
      
    } catch (permError) {
      Logger.log('⚠️ Permission setting failed: ' + permError.toString());
      Logger.log('📁 Folders created successfully but using default permissions');
      // Continue without setting permissions - folders will still work, just with default permissions
    }
    
    const result = {
      success: true,
      address: address,
      contactId: contactId,
      propertyFolderUrl: propertyFolder.getUrl(),
      photosFolderUrl: photosFolder.getUrl(),
      propertyFolderId: propertyFolder.getId(),
      photosFolderId: photosFolder.getId(),
      timestamp: new Date().toISOString()
    };
    
    // Log the creation
    logFolderCreation(result);
    
    return result;
    
  } catch (error) {
    Logger.log('Error creating folder: ' + error.toString());
    throw new Error('Failed to create folder: ' + error.toString());
  }
}

/**
 * Simple logging function
 */
function logFolderCreation(result) {
  try {
    Logger.log(`✅ Created photo folder for ${result.address} (Contact: ${result.contactId})`);
    Logger.log(`📁 Folder URL: ${result.photosFolderUrl}`);
  } catch (error) {
    Logger.log('Logging error: ' + error.toString());
  }
}

/**
 * Send photo upload email to the rep
 */
function sendPhotoUploadEmail(repEmail, address, photoFolderUrl) {
  try {
    const subject = `Upload Photos for Property: ${address}`;
    const bodyText = `Hi there,

Thanks for creating the photo folder for:

📍 ${address}

Please upload all property photos (30–50 recommended) using the folder below:

📁 Upload Link: ${photoFolderUrl}

This folder is public for easy uploading. Let us know if you need help.

– Quick Fix Real Estate Team`;

    MailApp.sendEmail({
      to: repEmail,
      subject: subject,
      body: bodyText
    });

    Logger.log(`📧 Photo upload email sent to ${repEmail} for ${address}`);
  } catch (error) {
    Logger.log(`❌ Failed to send email to ${repEmail}: ${error.toString()}`);
    throw error;
  }
}

/**
 * Test function for development
 */
function testFolderCreation() {
  const result = createPhotoFolder("123 Test Street", "TEST001");
  Logger.log(JSON.stringify(result, null, 2));
}