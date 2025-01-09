import path from 'path';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN_WEBMASTER } = process.env;

console.log('Initializing OAuth2 client...');
const oauth2ClientWebmaster = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

oauth2ClientWebmaster.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN_WEBMASTER });

const indexer = google.indexing({
  version: 'v3',
  auth: oauth2ClientWebmaster
});

async function indexPage(url) {
  try {
    console.log(`Indexing page: ${url}`);
    const response = await indexer.urlNotifications.publish({
      requestBody: {
        url,
        type: 'URL_UPDATED'
      }
    });
    console.log(`Page indexed: ${url}`);
    console.log('Response:', response);
  } catch (error) {
    console.error('Error indexing page:', error.message);
    console.error('Error details:', error);
  }
}

const pageUrl = "https://askbob.online/list-of-fintech-startup-in-asia";

// Indexer la page sur Google Search Console
await indexPage(pageUrl);