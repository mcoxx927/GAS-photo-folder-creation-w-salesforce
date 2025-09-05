/**
 * Web app entry point - routes to HTML by default.
 * Add `&format=json` to get JSON response (for API/webhooks).
 */
function doGet(e) {
  const format = (e && e.parameter && e.parameter.format || 'html').toLowerCase();
  if (format === 'json') {
    return doGetJson(e);
  }
  return doGetHTML(e);
}

/** JSON response handler (previous default) */
function doGetJson(e) {
  try {
    const address = e.parameter.address;
    const contactId = e.parameter.contactId;
    const repEmail = e.parameter.repEmail;

    if (!address || !contactId) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Missing required parameters: address and contactId' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const result = createPhotoFolder(address, contactId);

    if (repEmail && result.success) {
      sendPhotoUploadEmail(repEmail, address, result.photosFolderUrl);
      result.emailSent = true;
      result.emailTo = repEmail;
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error in doGetJson: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
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
    const folderName = sanitizeFolderName(`${address} - ${contactId}`);
    const propertyFolder = parentFolder.createFolder(folderName);
    
    // Create Photos subfolder
    const photosFolder = propertyFolder.createFolder("Photos");
    
    // Set permissions using Advanced Drive API (preferred) with DriveApp fallback
    const sharing = { photos: 'default', property: 'default' };
    try {
      // Try: Anyone with link can edit the Photos folder (requires Advanced Drive API)
      // Note: This may be restricted by your domain/shared drive policies
      grantLinkAccessAnyone(photosFolder.getId(), 'writer');
      sharing.photos = 'anyone-with-link:writer';
      Logger.log('Photos folder set to anyone-with-link (writer)');

      // Property folder: share to your domain with editor access
      grantDomainAccess(propertyFolder.getId(), DOMAIN_NAME, 'writer');
      sharing.property = 'domain-with-link:writer';
      Logger.log('Property folder shared to domain (writer)');

    } catch (permErrorApi) {
      Logger.log('Advanced Drive sharing failed: ' + permErrorApi.toString());
      // Fallback to DriveApp if API-based sharing is unavailable or blocked
      try {
        photosFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
        sharing.photos = 'fallback:anyone-with-link:edit';
        propertyFolder.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.EDIT);
        sharing.property = 'fallback:domain-with-link:edit';
        Logger.log('Fallback DriveApp sharing applied');
      } catch (permErrorFallback) {
        Logger.log('DriveApp sharing also failed. Using default permissions: ' + permErrorFallback.toString());
      }
    }
    
    const result = {
      success: true,
      address: address,
      contactId: contactId,
      propertyFolderUrl: propertyFolder.getUrl(),
      photosFolderUrl: photosFolder.getUrl(),
      propertyFolderId: propertyFolder.getId(),
      photosFolderId: photosFolder.getId(),
      sharing,
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
 * Sanitize folder name to avoid invalid characters
 */
function sanitizeFolderName(name) {
  // Remove characters not allowed or problematic in Drive folder names
  // e.g., forward/back slashes and control chars
  return name.replace(/[\\\/\u0000-\u001F]/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Grant Anyone-with-link access using Advanced Drive Service
 * role: 'reader' | 'commenter' | 'writer'
 */
function grantLinkAccessAnyone(fileId, role) {
  // Requires enabling Advanced Google Services: Drive API v2 (or v3 via Advanced Drive)
  // and in Cloud console, the Drive API must be enabled for the project.
  const permission = {
    type: 'anyone',
    role: role || 'reader',
    withLink: true, // v2 compatibility
    allowFileDiscovery: false // v3 field (ignored by v2 but safe)
  };
  // Use v2 Advanced Drive service if available
  // Prefer v2 insert with supportsAllDrives for Shared Drives
  if (typeof Drive !== 'undefined' && Drive.Permissions && Drive.Permissions.insert) {
    try {
      Drive.Permissions.insert(permission, fileId, {supportsAllDrives: true, sendNotificationEmails: false});
    } catch (errWriter) {
      // Fallback to reader if writer not allowed by policy
      if (role === 'writer') {
        const readerPerm = Object.assign({}, permission, { role: 'reader' });
        Drive.Permissions.insert(readerPerm, fileId, {supportsAllDrives: true, sendNotificationEmails: false});
      } else {
        throw errWriter;
      }
    }
  } else if (typeof Drive !== 'undefined' && Drive.Permissions && Drive.Permissions.create) {
    // v3 API shape (rare in Apps Script Advanced Drive)
    Drive.Permissions.create(permission, fileId, {supportsAllDrives: true, sendNotificationEmails: false});
  } else {
    throw new Error('Advanced Drive service not enabled');
  }
}

/**
 * Grant domain access using Advanced Drive Service
 * role: 'reader' | 'commenter' | 'writer'
 */
function grantDomainAccess(fileId, domain, role) {
  const permission = {
    type: 'domain',
    role: role || 'reader',
    domain: domain,
    withLink: true,
    allowFileDiscovery: false
  };
  if (typeof Drive !== 'undefined' && Drive.Permissions && Drive.Permissions.insert) {
    try {
      Drive.Permissions.insert(permission, fileId, {supportsAllDrives: true, sendNotificationEmails: false});
    } catch (errWriter) {
      // Fallback to reader if writer is not allowed by policy
      if (role === 'writer') {
        const readerPerm = Object.assign({}, permission, { role: 'reader' });
        Drive.Permissions.insert(readerPerm, fileId, {supportsAllDrives: true, sendNotificationEmails: false});
      } else {
        throw errWriter;
      }
    }
  } else if (typeof Drive !== 'undefined' && Drive.Permissions && Drive.Permissions.create) {
    Drive.Permissions.create(permission, fileId, {supportsAllDrives: true, sendNotificationEmails: false});
  } else {
    throw new Error('Advanced Drive service not enabled');
  }
}

/**
 * Debug helper: logs permissions on a file/folder
 */
function debugListPermissions(fileId) {
  try {
    const perms = Drive.Permissions.list(fileId, {supportsAllDrives: true, fields: 'permissions(id,type,role,domain,allowFileDiscovery,emailAddress)'});
    Logger.log('Permissions for ' + fileId + ': ' + JSON.stringify(perms, null, 2));
    const file = Drive.Files.get(fileId, {supportsAllDrives: true, fields: 'id,name,mimeType,webViewLink,driveId,parents,owners(emailAddress)'});
    Logger.log('File metadata: ' + JSON.stringify({
      name: file.name,
      mimeType: file.mimeType,
      webViewLink: file.webViewLink,
      owners: (file.owners || []).map(o => o.emailAddress),
      driveId: file.driveId,
      parents: (file.parents || []).map(p => ({id: p.id, isRoot: p.isRoot}))
    }, null, 2));
  } catch (e) {
    Logger.log('debugListPermissions error: ' + e.toString());
  }
}

/**
 * Simple logging function
 */
function logFolderCreation(result) {
  try {
    Logger.log(`Created photo folder for ${result.address} (Contact: ${result.contactId})`);
    Logger.log(`Photos Folder URL: ${result.photosFolderUrl}`);
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
    const bodyText = `Hi there,\n\nThanks for creating the photo folder for:\n\n${address}\n\nPlease upload all property photos (30–50 recommended) using the folder below:\n\nUpload Link: ${photoFolderUrl}\n\nThis folder is public (link) for easy uploading. Let us know if you need help.\n\n— Quick Fix Real Estate Team`;

    MailApp.sendEmail({
      to: repEmail,
      subject: subject,
      body: bodyText
    });

    Logger.log(`Photo upload email sent to ${repEmail} for ${address}`);
  } catch (error) {
    Logger.log(`Failed to send email to ${repEmail}: ${error.toString()}`);
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
