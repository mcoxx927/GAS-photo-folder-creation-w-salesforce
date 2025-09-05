/**
 * Alternative doGet that returns HTML instead of JSON
 * Better user experience for browser clicks
 */
function doGetHTML(e) {
  try {
    const address = e.parameter.address;
    const contactId = e.parameter.contactId;
    const repEmail = e.parameter.repEmail;
    
    // Validate required parameters
    if (!address || !contactId) {
      return createErrorPage("Missing required parameters: address and contactId");
    }
    
    // Create the folder structure
    const result = createPhotoFolder(address, contactId);
    
    // Send email if rep email is provided
    let emailStatus = '';
    if (repEmail && result.success) {
      try {
        sendPhotoUploadEmail(repEmail, address, result.photosFolderUrl);
        emailStatus = `<p>✅ Email sent to ${repEmail}</p>`;
      } catch (emailError) {
        emailStatus = `<p>⚠️ Folder created but email failed: ${emailError.toString()}</p>`;
      }
    }
    
    return createSuccessPage(result, emailStatus);
    
  } catch (error) {
    Logger.log('Error in doGetHTML: ' + error.toString());
    return createErrorPage(error.toString());
  }
}

function createSuccessPage(result, emailStatus) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Photo Folder Created</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .success { color: #28a745; }
        .container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px; }
        .button:hover { background: #0056b3; }
        .folder-link { background: #28a745; }
        .folder-link:hover { background: #1e7e34; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="success">✅ Photo Folder Created Successfully!</h1>
        
        <h3>Property: ${result.address}</h3>
        <p><strong>Contact ID:</strong> ${result.contactId}</p>
        <p><strong>Created:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
        
        ${emailStatus}
        
        <h3>📁 Folder Links:</h3>
        <p>
          <a href="${result.photosFolderUrl}" target="_blank" class="button folder-link">
            🏠 Open Photos Folder
          </a>
          <a href="${result.propertyFolderUrl}" target="_blank" class="button">
            📂 Open Property Folder  
          </a>
        </p>
        
        <hr>
        <p><small>You can now upload photos directly to the Photos folder. The folder is publicly accessible via the link.</small></p>
        
        <button onclick="window.close()" class="button">Close Window</button>
      </div>
    </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(html);
}

function createErrorPage(errorMessage) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Error Creating Folder</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .error { color: #dc3545; }
        .container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .button { background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="error">❌ Error Creating Photo Folder</h1>
        <p><strong>Error:</strong> ${errorMessage}</p>
        
        <p>Please contact your administrator or try again.</p>
        
        <button onclick="window.close()" class="button">Close Window</button>
      </div>
    </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(html);
}