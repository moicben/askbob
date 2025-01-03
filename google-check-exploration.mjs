import { google } from 'googleapis';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN_WEBMASTER,
});

const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

async function getSites() {
  try {
    const response = await webmasters.sites.list();
    return response.data.siteEntry.map(site => site.siteUrl);
  } catch (error) {
    console.error('Error fetching sites:', error.message);
    return [];
  }
}

async function getCrawlStats(siteUrl) {
  try {
    const response = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: '2024-12-13', // Remplacez par la date de début souhaitée
        endDate: '2025-01-04',   // Remplacez par la date de fin souhaitée
        dimensions: ['page', 'query'],
        searchType: 'web',
      },
    });

    //console.log(`Crawl Stats for ${siteUrl}:`, JSON.stringify(response.data, null, 2));

    // Transform response data to include domain and query
    const transformedData = response.data.rows.map(row => ({
      domain: siteUrl,
      query: row.keys[1],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    }));

    return transformedData;
  } catch (error) {
    //console.error(`Error fetching crawl stats for ${siteUrl}:`, error.message);
    return [];
  }
}

async function generateExcelForAllDomains() {
  const sites = await getSites();
  let allData = [];

  for (const site of sites) {
    console.log(`${sites.indexOf(site) + 1}/${sites.length}`);

    if (site.includes('askbob.online')) {
      const data = await getCrawlStats(site);
      allData = allData.concat(data);
    }
  }

  // Convert all data to a worksheet
  const worksheet = xlsx.utils.json_to_sheet(allData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Crawl Stats');

  // Ensure the output directory exists
  const outputDir = path.join(__dirname);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Write the workbook to a file in the output directory
  const outputPath = path.join(outputDir, 'crawl_stats.xlsx');
  xlsx.writeFile(workbook, outputPath);
  console.log(`Excel file created: ${outputPath}`);
}

generateExcelForAllDomains();