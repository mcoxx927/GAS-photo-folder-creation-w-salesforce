# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Apps Script (GAS) project that creates photo folders and processes sales call data with Salesforce integration. The system handles form submissions from internal and client forms, processes audio files through Fireflies AI, and creates property inspection documents and photo folders.

## Architecture

### Core Files
- **formSubmit.gs**: Main form submission handler with dual form support (internal/client forms)
- **config.gs**: Configuration constants including API keys, folder IDs, and webhook URLs
- **logging.gs**: Logging utilities for daily summaries and chat alerts

### Data Flow
1. Form submissions trigger `onFormSubmit()` which routes to appropriate handlers
2. Audio files are uploaded to Fireflies AI for transcription
3. Property folders and inspection documents are created via Google Drive API
4. All activities are logged to Supabase and Google Sheets
5. Email notifications are sent for photo upload requests

### External Integrations
- **Fireflies AI**: Audio transcription and processing via GraphQL API
- **Supabase**: Database logging with webhook endpoints for audio submissions and coaching data
- **Google Drive**: File management, folder creation, and document generation
- **Google Sheets**: Response tracking and configuration management
- **OpenAI/Claude**: LLM processing for transcript analysis

## Key Configuration

### Required Sheet Structure
- Main response sheet contains tabs: "Internal Form (Responses)", "Client Form (Responses)", "Master Responses", "ClientConfigs", "Metadata"
- Company configurations stored in "ClientConfigs" tab with boolean flags for features

### Environment Setup
All constants are defined in config.gs including:
- Google Drive folder IDs for audio, templates, and output
- API keys for Fireflies, OpenAI, Claude, and Supabase
- Webhook URLs for external service integration

## Development Notes

### Form Data Handling
- Form submissions are normalized from `namedValues` format into flat objects
- Company configurations determine which features are enabled (docs, emails, fireflies, AI features)
- Session IDs are generated as `${contactID}_${timestamp}` for tracking

### Error Handling
- All external API calls use `muteHttpExceptions: true`
- Failures are logged to Supabase with appropriate severity levels
- Chat alerts are sent for critical failures

### Security
- Uses Supabase service role key for authenticated requests
- Drive permissions are set to appropriate scopes (domain/public as needed)
- API keys are stored as constants (should be moved to PropertiesService for production)