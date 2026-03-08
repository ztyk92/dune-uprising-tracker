import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'functions/credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1W6QdQtyJ3LkjYPedZzc0dczB_ecYLPdM2VKuS1bhMA4';

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'VP Actions!A:Z',
        });
        console.log("ROWS:", response.data.values);
    } catch (e) {
        console.error(e);
    }
}
main();
