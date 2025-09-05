function logDailyEvent(fileName, action, status, notes) {
  const logSheet = SpreadsheetApp.openById(LOG_SHEET_ID).getSheetByName("Daily Log");

  if (!logSheet) {
    const newSheet = SpreadsheetApp.openById(LOG_SHEET_ID).insertSheet("Daily Log");
    newSheet.appendRow(["Timestamp", "File Name", "Action", "Status", "Notes"]);
  }

  logSheet.appendRow([
    new Date(),
    fileName,
    action,
    status,
    notes
  ]);
}

function sendDailySummaryEmail() {
  const logSheet = SpreadsheetApp.openById(LOG_SHEET_ID).getSheetByName("Daily Log");
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const data = logSheet.getDataRange().getValues();

  const todayRows = data.filter(row =>
    Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'yyyy-MM-dd') === today
  );

  if (todayRows.length === 0) {
    Logger.log("📭 No activity to summarize today.");
    return;
  }

  const successCount = todayRows.filter(row => row[3] === "✅ Success").length;
  const failRows = todayRows.filter(row => row[3] === "❌ Fail");
  const skippedRows = todayRows.filter(row => row[3] === "⚠️ Skipped");


  const failedDetails = failRows.map(row => {
    const file = row[1] || 'Unknown';
    const action = row[2] || '';
    const reason = row[4] || '';
    return `• ${file} – ${action} – ${reason}`;
  }).join('\n');

  const skippedDetails = skippedRows.map(row => {
  const file = row[1] || 'Unknown';
  const action = row[2] || '';
  const reason = row[4] || '';
  return `• ${file} – ${action} – ${reason}`;
  }).join('\n');


  const body = `
  📊 *Transcript Bot Daily Summary*

  📅 Date: ${today}
  ✅ Successes: ${successCount}
  ❌ Failures: ${failRows.length}
  ⚠️ Skipped (Short Transcripts): ${skippedRows.length}

  ${failRows.length > 0 ? '❗Failed Items:\n' + failedDetails + '\n\n' : ''}
  ${skippedRows.length > 0 ? '⚠️ Skipped Calls:\n' + skippedDetails + '\n\n' : ''}

  🔁 Logged in: "Daily Log" tab of your Form Sheet
  `;


    MailApp.sendEmail({
      to: DAILY_SUMMARY_RECIPIENT,
      subject: `📋 Transcript Bot Summary – ${today}`,
      body: body
    });

    Logger.log("📬 Daily summary email sent.");
}

function sendChatAlert(message) {
  const CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/AAQAvlPUITQ/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=r3_ubMrpruB-4RdxiIxBIv8_TuElWwn47o-XPGJy76Y'; //leadership google chat

  const payload = JSON.stringify({ text: message });

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(CHAT_WEBHOOK_URL, options);
}
