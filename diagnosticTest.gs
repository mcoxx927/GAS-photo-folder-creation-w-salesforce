/**
 * Simple diagnostic test function for web app
 */
function doGetDiagnostic(e) {
  return ContentService
    .createTextOutput("Web app is working! Parameters: " + JSON.stringify(e.parameter))
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Temporarily replace your doGet with this for testing
 * Copy this function content into your main file, replacing doGet
 */
function doGetSimple(e) {
  try {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: "Web app is responding",
        parameters: e.parameter,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}