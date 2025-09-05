# Salesforce Integration Options

## Option 1: Simple Button (Immediate - No Sync Back)
**Complexity: Low | Cost: Free**

Create a custom button in Salesforce that opens the GAS web app in a new tab.

**Salesforce Setup:**
1. Go to Setup → Object Manager → Contact (or Lead/Account)
2. Create custom button with URL:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?address={Property_Address__c}&contactId={Id}
   ```
3. Add button to page layout

**Pros:** Quick to implement, no additional setup
**Cons:** Manual process, no automatic Salesforce update

## Option 2: Zapier Integration (Recommended)
**Complexity: Medium | Cost: ~$20/month**

Use Zapier to connect GAS response back to Salesforce.

**Setup:**
1. Add webhook trigger to GAS that sends data to Zapier
2. Configure Zapier to update Salesforce record
3. Trigger from Salesforce button or workflow

**Flow:**
1. Salesforce → GAS (create folder)
2. GAS → Zapier webhook (folder created)
3. Zapier → Salesforce (update record with URL)

**Pros:** Reliable, handles errors, visual workflow
**Cons:** Monthly cost, external dependency

## Option 3: Direct Salesforce API (Advanced)
**Complexity: High | Cost: Free (after setup)**

GAS directly calls Salesforce REST API to update records.

**Requirements:**
1. Salesforce Connected App
2. OAuth implementation in GAS
3. Custom field in Salesforce for photo folder URL

**Setup Steps:**
1. **Create Connected App in Salesforce:**
   - Setup → App Manager → New Connected App
   - Enable OAuth Settings
   - Add scopes: Full access (api), Manage user data via APIs (api)
   - Note Client ID and Client Secret

2. **Create Custom Field:**
   - Object Manager → Contact → Fields & Relationships
   - New Field: "Photo Folder URL" (Text/URL, 255 chars)

3. **Configure GAS:**
   - Use provided `salesforceIntegration.gs` code
   - Store credentials in Script Properties
   - Handle OAuth token refresh

**Enhanced URL:**
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?address=123%20Main%20St&contactId=12345&salesforceId=0031234567890&updateSalesforce=true
```

**Pros:** No monthly cost, full control, real-time updates
**Cons:** Complex setup, requires OAuth knowledge

## Option 4: Salesforce Flow + HTTP Callout
**Complexity: Medium-High | Cost: Free**

Use Salesforce Flow to make HTTP callout to GAS.

**Setup:**
1. Create Flow triggered by button/field update
2. Add HTTP Callout element to call GAS
3. Parse response and update record

**Pros:** Native Salesforce, no external tools
**Cons:** Requires Salesforce admin skills, limited error handling

## Recommendation

**Start with Option 1** for immediate functionality, then upgrade to:
- **Option 2 (Zapier)** if you want automated sync with minimal complexity
- **Option 3 (Direct API)** if you need full control and no ongoing costs

## Implementation Stages

### Stage 1: Basic Folder Creation ✅
- [x] GAS web app with folder creation
- [x] URL-based triggering
- [x] JSON response with folder URLs

### Stage 2A: Zapier Integration
- [ ] Add webhook to GAS
- [ ] Configure Zapier workflow
- [ ] Test end-to-end process

### Stage 2B: Direct Salesforce API
- [ ] Create Salesforce Connected App
- [ ] Add custom field for photo URL
- [ ] Implement OAuth in GAS
- [ ] Add Salesforce update logic

### Stage 3: Advanced Features
- [ ] Duplicate folder detection
- [ ] Bulk processing
- [ ] Error retry logic
- [ ] Usage reporting