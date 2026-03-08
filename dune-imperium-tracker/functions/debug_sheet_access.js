
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_PATH = path.join(__dirname, 'credentials.json');
const SPREADSHEET_ID = '1W6QdQtyJ3LkjYPedZzc0dczB_ecYLPdM2VKuS1bhMA4'; // ID from App.jsx

async function checkSheet() {
    console.log("Checking sheet access...");

    if (!fs.existsSync(KEY_PATH)) {
        console.error("ERROR: credentials.json not found in functions directory!");
        return;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        console.log(`Connecting to Spreadsheet ID: ${SPREADSHEET_ID}`);

        const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const titles = meta.data.sheets.map(s => s.properties.title);

        console.log("--------------------------------");
        console.log("Visible Sheets (Tabs):");
        titles.forEach(t => console.log(` - ${t}`));
        console.log("--------------------------------");

        if (titles.includes('VP Actions')) {
            console.log("SUCCESS: 'VP Actions' tab found!");

            // Read content
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: 'VP Actions!A:C',
            });
            console.log("Content of 'VP Actions':");
            console.log(response.data.values);
        } else {
            console.log("WARNING: 'VP Actions' tab NOT found.");
        }

    } catch (error) {
        console.error("API Error:", error.message);
    }
}

checkSheet();
