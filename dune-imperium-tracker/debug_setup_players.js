import fetch from 'node-fetch';

const SHEET_ID = '1W6QdQtyJ3LkjYPedZzc0dczB_ecYLPdM2VKuS1bhMA4';
const URL = `http://localhost:3001/api/players?spreadsheetId=${SHEET_ID}`;

console.log(`Fetching ${URL}...`);

fetch(URL)
    .then(res => res.json())
    .then(data => {
        console.log("Success! Received players:", data);
    })
    .catch(err => {
        console.error("Error:", err);
    });
