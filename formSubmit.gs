function onFormSubmit(e) {
  const sheetName = e.range.getSheet().getName();

  if (sheetName === "Internal Form (Responses)") {
    onInternalFormSubmit(e);
  } else if (sheetName === "Client Form (Responses)") {
    onClientFormSubmit(e);
  }
}


function appendToMasterSubmissionsTab(entry) {
  const sheet = SpreadsheetApp.openById(MAIN_RESPONSE_SHEET_ID).getSheetByName("Master Responses");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = new Array(headers.length).fill('');

  const fieldMap = {
  "Timestamp": new Date().toISOString(),
  "Company ID": entry.companyId,
  "Property Address": entry.address,
  "Owner Name": entry.ownerName,
  "Email Address": entry.rep,
  "Deal Status": entry.summaryFields?.dealStatus || '',
  "Seller Motivation": entry.summaryFields?.sellerMotivation || '',
  "Action Items": entry.summaryFields?.actionItems || '',
  "Follow-up Notes": entry.summaryFields?.followUpNotes || '',
  "Audio File Name": entry.newName || '',
  "Audio File Link": entry.audioDriveLink || '',
  "Photo Folder Link": entry.photoFolderUrl || '',
  "Inspection Doc Link": entry.inspectionDocUrl || '',
  "Automation Status": "Success",
  "Automation Error": ""
  };


  for (const [header, value] of Object.entries(fieldMap)) {
    const colIndex = headers.indexOf(header);
    if (colIndex !== -1) {
      newRow[colIndex] = value;
    }
  }

  sheet.appendRow(newRow);
}


function getCompanyConfigFromSheet(companyId) {
  const sheet = SpreadsheetApp.openById(MAIN_RESPONSE_SHEET_ID).getSheetByName("ClientConfigs");
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const entry = rows.find(row => row[0] === companyId);
  if (!entry) return null;

  const config = {};
  headers.forEach((header, idx) => {
    config[header] = entry[idx];
  });

  config.enableDocs = config.enableDocs === true || config.enableDocs === "TRUE";
  config.enableEmails = config.enableEmails === true || config.enableEmails === "TRUE";
  config.aiFeatures = config.aiFeatures === true || config.aiFeatures === "TRUE";
  config.fireflies = config.fireflies === true || config.fireflies === "TRUE";
  config.formType = config.formType || "client";
  config.coachingOutputFolderId = config['coachingDocFolderId'];
  config.coachingSheetId = config['sheetId'];
  const colIndex = headers.indexOf('coachingProfileId');
  config.coachingProfileId = entry[colIndex] || 'default';

  return config;
}

// === Dual Form Submission Handler ===

/**
 * 🔁 Called by installable trigger from Client Form submission
 */
function onClientFormSubmit(e) {
  const formData = normalizeFormData(e.namedValues);
  handleSalesCallSubmission(formData, 'client');
}

/**
 * 🔁 Called by installable trigger from Internal Form submission
 */
function onInternalFormSubmit(e) {
  const formData = normalizeFormData(e.namedValues);
  handleSalesCallSubmission(formData, 'internal');
}

/**
 * 🧠 Normalize namedValues into a flat object
 */
function normalizeFormData(namedValues) {
  const summaryFields = {
    dealStatus: (namedValues['Was the deal won, lost, or pending?'] || [''])[0],
    sellerMotivation: (namedValues['What was the seller’s main motivation?'] || [''])[0],
    highlights: (namedValues['What went well during the appointment?'] || [''])[0],
    improvements: (namedValues['What could have gone better?'] || [''])[0],
    winLossReason: (namedValues['Why do you think you won/lost? (1 sentence)'] || [''])[0],
    sellerFeedback: (namedValues['Did the seller give feedback on their decision?'] || [''])[0],
    actionItems: (namedValues['Any action items or follow-up needed?'] || [''])[0],
    followUpNotes: (namedValues['Follow-up notes'] || [''])[0]
  };

  const inspectionFields = {
    'Property Address': (namedValues['Property Address'] || [''])[0],
    'ContactID': (namedValues['ContactID'] || [''])[0],
    'Email Address': (namedValues['Email Address'] || [''])[0],
    'Owner / Contact Name': (namedValues['Owner / Contact Name'] || [''])[0],
    'Owner Contact Phone / Email': (namedValues['Owner Contact Phone / Email'] || [''])[0],
    'Square Footage': (namedValues['Square Footage'] || [''])[0],
    'Bedrooms / Bathrooms': (namedValues['Bedrooms / Bathrooms'] || [''])[0],
    'Year Built': (namedValues['Year Built'] || [''])[0],
    'Lot Size': (namedValues['Lot Size'] || [''])[0],
    'Property Type': (namedValues['Property Type'] || [''])[0],
    'HOA?': (namedValues['HOA?'] || [''])[0],
    'HOA Monthly Amount': (namedValues['HOA Monthly Amount'] || [''])[0],
    'Utilities': (namedValues['Utilities'] || [''])[0],
    'Last Septic Service Date': (namedValues['Last Septic Service Date'] || [''])[0],
    'Roof Condition': (namedValues['Roof Condition'] || [''])[0],
    'Foundation': (namedValues['Foundation'] || ['']).join(', '),
    'Siding': (namedValues['Siding'] || ['']).join(', '),
    'Windows': (namedValues['Windows'] || ['']).join(', '),
    'HVAC System': (namedValues['HVAC System'] || ['']).join(', '),
    'Electrical': (namedValues['Electrical'] || ['']).join(', '),
    'Electrical Panel': (namedValues['Electrical Panel Type'] || [''])[0],
    'Plumbing': (namedValues['Plumbing'] || ['']).join(', '),
    'Water Heater': (namedValues['Water Heater'] || ['']).join(', '),
    'Floors': (namedValues['Floors'] || ['']).join(', '),
    'Walls & Ceilings': (namedValues['Walls & Ceilings'] || ['']).join(', '),
    'Doors': (namedValues['Doors'] || ['']).join(', '),
    'Basement/Crawlspace': (namedValues['Basement/Crawlspace'] || [''])[0],
    'Attic': (namedValues['Attic'] || [''])[0],
    'Smoke Detectors': (namedValues['Smoke Detectors'] || ['']).join(', '),
    'Odors': (namedValues['Odors'] || ['']).join(', '),
    'Signs of Mold': (namedValues['Signs of Mold'] || [''])[0],
    'Signs of Mold details': (namedValues['Signs of Mold details'] || [''])[0],
    'Pest Infestation': (namedValues['Pest Infestation'] || [''])[0],
    'Signs of Pest Infestation': (namedValues['Signs of Pest Infestation'] || [''])[0],
    'Cabinets & Countertops': (namedValues['Cabinets & Countertops'] || [''])[0],
    'Sink & Faucets': (namedValues['Sink & Faucets'] || [''])[0],
    'Appliances': (namedValues['Appliances'] || [''])[0],
    'Bathroom Fixtures': (namedValues['Bathroom Fixtures'] || [''])[0],
    'Toilets': (namedValues['Toilets'] || [''])[0],
    'Showers/Tubs': (namedValues['Showers/Tubs'] || [''])[0],
    'Driveway & Walkways': (namedValues['Driveway & Walkways'] || ['']).join(', '),
    'Landscaping': (namedValues['Landscaping'] || ['']).join(', '),
    'Front Yard': (namedValues['Front Yard'] || ['']).join(', '),
    'Garage': (namedValues['Garage'] || ['']).join(', '),
    'Timestamp': (namedValues['Timestamp'] || [])[0] || new Date().toISOString()
  };

  return {
    address: inspectionFields['Property Address'] || 'UNKNOWN ADDRESS',
    contactID: inspectionFields['ContactID'] || 'UNKNOWN CONTACT',
    rep: inspectionFields['Email Address'] || 'Unknown',
    ownerName: inspectionFields['Owner / Contact Name'] || '',
    timestamp: inspectionFields['Timestamp'],
    audioUrl: (namedValues['Upload Recording'] || [])[0] || '',
    companyId: (namedValues['companyId'] || [])[0] || 'QFX001',
    callDate: (namedValues['Call Date'] || [])[0] || '',
    summaryFields,
    ...inspectionFields
  };
}

/**
 * 🔁 Core processing function shared by both form types
 */

function handleSalesCallSubmission(data, formType) {
    const sessionId = `${data.contactID}_${data.timestamp}`;
  
  // Log critical form submission to Supabase
  logToSupabase({
    sessionId: sessionId,
    logType: LOG_TYPES.DAILY,
    data: {
      action: "form_submitted",
      formType: formType,
      companyId: data.companyId,
      address: data.address,
      rep: data.rep
    }
  });

  const config = getCompanyConfigFromSheet(data.companyId);
  if (!config) {
        logToSupabase({
      sessionId: sessionId,
      logType: LOG_TYPES.PROCESSING,
      data: {
        action: "config_missing",
        companyId: data.companyId
      },
      severity: LOG_SEVERITY.ERROR
    });
  sendChatAlert(`❌ Missing config for companyId: ${data.companyId}`);
  throw new Error(`No config found for companyId: ${data.companyId}`);
  }

  data.coachingProfileId = config.coachingProfileId || 'default';
  Logger.log("🧭 Coach Profile: " + data.coachingProfileId);

  const timestamp = data.timestamp;
  let audioFileUrl = '', audioDriveLink = '', newName = '', photoFolderUrl = '', inspectionDocUrl = '';

  // === 🔊 Upload Audio (Both Forms)
  if (data.audioUrl) {
    const fileId = extractFileId(data.audioUrl);
    const result = prepareAudioFile(fileId, data.address);
    audioFileUrl = result.audioFileUrl;
    audioDriveLink = result.audioDriveLink;
    newName = result.newName;

        // Log audio preparation success to Supabase
    logToSupabase({
      sessionId: sessionId,
      logType: LOG_TYPES.PROCESSING,
      data: {
        action: "audio_prepared",
        address: data.address,
        fileName: newName,
        driveLink: audioDriveLink
      }
    });

    if (config.fireflies) {
      try {
        const metadata = buildFirefliesMetadata(data, data.contactID, data.rep, data.address, timestamp, '', audioDriveLink, newName);
        const meetingId = uploadToFirefliesGraphQL(audioFileUrl, metadata);
        if (!meetingId) throw new Error('❌ No meeting ID returned from Fireflies');
        storeFirefliesMetadata(meetingId, metadata, audioFileUrl);
        
        // Log successful Fireflies upload to Supabase
        logToSupabase({
          sessionId: sessionId,
          logType: LOG_TYPES.PROCESSING,
          data: {
            action: "fireflies_upload_success",
            meetingId: meetingId,
            address: data.address
          }
        });
      } catch (err) {
        // Log Fireflies failure to Supabase
        logToSupabase({
          sessionId: sessionId,
          logType: LOG_TYPES.PROCESSING,
          data: {
            action: "fireflies_upload_failed",
            error: err.message,
            address: data.address
          },
          severity: LOG_SEVERITY.ERROR
        });
        throw err;
      }
    }
  } else {
        // Log missing audio to Supabase
    logToSupabase({
      sessionId: sessionId,
      logType: LOG_TYPES.PROCESSING,
      data: {
        action: "no_audio_submitted",
        address: data.address,
        rep: data.rep
      },
      severity: LOG_SEVERITY.WARNING
    });
  
  }

  // === 🏗️ Internal Only: Folder + Doc + Email
  if (formType === 'internal' && config.enableDocs) {
    const propertyFolder = createPropertyFolders(config.folderId, data.address);
    const folders = createSubfolders(propertyFolder);
    photoFolderUrl = folders.photosFolderUrl;
    inspectionDocUrl = createInspectionDocFromTemplate(data.address, {
      ...data.summaryFields,  // the coaching summary
      ...data                 // includes all inspection fields
    }, folders.inspectionFolder);

    logDailyEvent(data.address, "Photo Folder Created", "✅", photoFolderUrl);
    logDailyEvent(data.address, "Inspection Doc Created", "✅", inspectionDocUrl);
    if (config.enableEmails) {
      sendPhotoUploadEmail(data.rep, data.address, photoFolderUrl);
    }
  }

  // === 🧾 Final Logging
  appendToMasterSubmissionsTab({
    ...data,
    audioDriveLink,
    newName,
    photoFolderUrl,
    inspectionDocUrl,
    formType
  });

  // Log successful completion to Supabase
  logToSupabase({
    sessionId: sessionId,
    logType: LOG_TYPES.DAILY,
    data: {
      action: "submission_completed",
      address: data.address,
      formType: formType,
      hasAudio: !!data.audioUrl,
      hasFireflies: !!config.fireflies
    }
  });
}


function createPropertyFolders(parentFolderId, address) {
  try {
    return DriveApp.getFolderById(parentFolderId).createFolder(address);
  } catch (err) {
    throw new Error("❌ Invalid or missing folderId in config: " + err.message);
  }
}

function createSubfolders(propertyFolder) {
  const photosFolder = propertyFolder.createFolder("Photos");
  const inspectionFolder = propertyFolder.createFolder("Inspection");
  Drive.Permissions.insert({ type: 'domain', role: 'writer', value: 'quickfixrealestate.com', withLink: true }, propertyFolder.getId(), { sendNotificationEmails: false });
  Drive.Permissions.insert({ type: 'anyone', role: 'reader', withLink: true }, photosFolder.getId(), { sendNotificationEmails: false });
  return {
    photosFolderUrl: photosFolder.getUrl(),
    inspectionFolder
  };
}

function createInspectionDocFromTemplate(address, data, folder) {
  const copiedDoc = DriveApp.getFileById(TEMPLATE_DOC_ID).makeCopy(`Inspection Report - ${address}`, folder);
  const doc = DocumentApp.openById(copiedDoc.getId());
  const body = doc.getBody();
  for (const [key, val] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    const textValue = val || '';
    body.replaceText(placeholder, textValue);
  }
  doc.saveAndClose();
  logDailyEvent(address, "Inspection Doc Created", "✅ Success", `Doc URL: ${copiedDoc.getUrl()}`);
  return copiedDoc.getUrl();
}


function sendPhotoUploadEmail(rep, address, photoFolderUrl) {
  const subject = `Upload Photos for Property: ${address}`;
  const bodyText = `Hi ${rep},

    Thanks for submitting the appointment form for:

    📍 ${address}

    Please upload all property photos (30–50 recommended) using the folder below:

    📁 Upload Link: ${photoFolderUrl}

    This folder is public. Let us know if you need help.

    – Quick Fix Real Estate Team`;
      MailApp.sendEmail({ to: rep, subject, htmlBody: bodyText });
      logDailyEvent(address, "Photos Email Sent", "✅ Success", `Sent to: ${rep}`);
}

function prepareAudioFile(fileId, address) {
  const file = DriveApp.getFileById(fileId);
  const ext = file.getName().split('.').pop();
  const newName = `${address}.${ext}`;
  file.setName(newName);
  Drive.Permissions.insert({ type: 'anyone', role: 'reader', withLink: true }, fileId, { sendNotificationEmails: false });
  Utilities.sleep(30000);
  return {
    audioFileUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    audioDriveLink: `https://drive.google.com/file/d/${fileId}/view`,
    newName
  };
}

function buildFirefliesMetadata(data, contactID, rep, address, timestamp, transcriptUrl, audioDriveLink, newName) {
  return {
    FileID: extractFileId(data.audioUrl),
    ContactID: contactID,
    Timestamp: timestamp,
    CompanyID: data.companyId ,
    Email: rep,
    OwnerName: data.ownerName || '',
    PropertyAddress: address,
    CallDate: new Date().toLocaleDateString(),
    SessionID: `${contactID}_${timestamp}`,
    TranscriptFileName: newName,
    TranscriptURL: transcriptUrl,
    AudioLink: audioDriveLink,
    DealStatus: data.dealStatus || '',
    SellerMotivation: data.sellerMotivation || '',
    AppointmentHighlights: data.appointmentHighlights || '',
    AppointmentImprovements: data.appointmentImprovements || '',
    WinLossReason: data.winLossReason || '',
    SellerFeedback: data.sellerFeedback || '',
    ActionItems: data.actionItems || '',
    FollowUpNotes: data.followUpNotes || '',
    coachingProfileId: data.coachingProfileId || 'default'

  };
}


  //helper function for fireflies audio push
function extractFileId(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

// === 🔁 Store Fireflies metadata for webhook recovery ===
function storeFirefliesMetadata(meetingId, metadata, audioFileUrl) {
  const sheet = SpreadsheetApp.openById(MAIN_RESPONSE_SHEET_ID).getSheetByName("Metadata");
  sheet.appendRow([
    new Date().toISOString(),
    meetingId,
    metadata.ContactID,
    metadata.Email,
    metadata.PropertyAddress,
    metadata.SessionID,
    JSON.stringify(metadata),
    "submitted"
  ]);

    // Insert into Supabase audio_submissions table
  insertAudioSubmissionToSupabase(meetingId, metadata, audioFileUrl);

}

// === 🔁 Insert audio submission data into Supabase ===
function insertAudioSubmissionToSupabase(meetingId, metadata, audioFileUrl) {
  try {
    // Prepare the payload for Supabase audio_submissions table
    const payload = {
      company_id: metadata.CompanyID,
      property_address: metadata.PropertyAddress,
      contact_id: metadata.ContactID,
      audio_file_name: meetingId, // Meeting ID maps to audio_file_name
      audio_file_path: audioFileUrl, // Direct download URL from Google Drive
      session_id: metadata.SessionID,
      status: 'submitted', // Initial status
      rep_email: metadata.Email,
      metadata_blob: metadata, // Store the full metadata object
    };
    Logger.log('🔍 Supabase payload: ' + JSON.stringify(payload, null, 2));


    // Option 1: Using webhook approach (recommended for consistency)
    const webhookUrl = SUPABASE_AUDIO_SUBMISSIONS_WEBHOOK_URL;
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(webhookUrl, options);
    const responseCode = response.getResponseCode();
    const result = response.getContentText();

    // Debug: Log the response
    Logger.log(`🔍 Supabase response (${responseCode}): ${result}`);

    if (responseCode >= 200 && responseCode < 300) {
      Logger.log(`✅ Audio submission inserted to Supabase for session: ${metadata.SessionID}`);
      
      // Log success to Supabase logs
      logToSupabase({
        sessionId: metadata.SessionID,
        logType: LOG_TYPES.PROCESSING,
        data: {
          action: "audio_submission_inserted",
          meeting_id: meetingId,
          property_address: metadata.PropertyAddress,
          status: "success"
        }
      });
      
    } else {
      throw new Error(`HTTP ${responseCode}: ${result}`);
    }

  } catch (err) {
    Logger.log(`❌ Failed to insert audio submission to Supabase: ${err.message}`);
    
    // Log failure to Supabase logs
    logToSupabase({
      sessionId: metadata.SessionID,
      logType: LOG_TYPES.PROCESSING,
      data: {
        action: "audio_submission_insert_failed",
        meeting_id: meetingId,
        property_address: metadata.PropertyAddress,
        error: err.message
      },
      severity: LOG_SEVERITY.ERROR
    });
    
    // Send alert but don't throw - we don't want to break the main flow
    sendChatAlert(`❌ Supabase audio submission insert failed for ${metadata.PropertyAddress}: ${err.message}`);
  }
}

// === Upload Audio to Fireflies ===
function uploadToFirefliesGraphQL(publicUrl, metadata) {
  const apiKey = FIREFLIES_API_KEY; // Set this as a constant in your config
  const graphqlUrl = "https://api.fireflies.ai/graphql";//added error to force error here

  const payload = {
    query: `
      mutation($input: AudioUploadInput) {
        uploadAudio(input: $input) {
          success
          title
          message
        }
      }
    `,
    variables: {
      input: {
        url: publicUrl,
        title: metadata.TranscriptFileName || metadata.PropertyAddress || "Untitled Audio",
        client_reference_id: metadata.SessionID,
      }
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(graphqlUrl, options);
  const result = JSON.parse(response.getContentText());

  Logger.log("🔥 Fireflies response: " + JSON.stringify(result, null, 2));

  if (result.errors && result.errors.length > 0) {
  const errMsg = result.errors[0].message;
  const errCode = result.errors[0].code;

  logDailyEvent(metadata.PropertyAddress, "Fireflies upload", "❌ Failed", `Error: ${errMsg}`);
  throw new Error("❌ Fireflies error: " + errMsg);
  }

  const meetingId = result.data?.uploadAudio?.title || "UNKNOWN_ID";
  logDailyEvent(metadata.PropertyAddress, "Fireflies upload", "✅ Success", `MeetingID: ${meetingId}`);
  return meetingId;

}