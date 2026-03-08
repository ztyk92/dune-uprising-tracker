import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { google } from 'googleapis';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Google Sheets Auth Setup
async function getSheetsClient() {
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    const KEY_PATH = path.join(__dirname, 'credentials.json');
    let auth;

    if (process.env.GOOGLE_CREDENTIALS) {
        // Production: Read from Environment Variable
        try {
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            auth = new google.auth.GoogleAuth({
                credentials,
                scopes,
            });
        } catch (error) {
            throw new Error('Failed to parse GOOGLE_CREDENTIALS environment variable');
        }
    } else if (fs.existsSync(KEY_PATH)) {
        // Development: Read from file
        auth = new google.auth.GoogleAuth({
            keyFile: KEY_PATH,
            scopes,
        });
    } else {
        throw new Error('credentials.json not found in server root and GOOGLE_CREDENTIALS env var not set');
    }

    return google.sheets({ version: 'v4', auth });
}



app.post('/api/save-to-sheet', async (req, res) => {
    const { spreadsheetId, scoreHeaders, scoreRows, logHeaders, logRows, vpLogHeaders, vpLogRows } = req.body;

    // Must have at least basic score data
    if (!spreadsheetId || !scoreHeaders || !scoreRows) {
        return res.status(400).send('Missing required fields (spreadsheetId, headers, rows)');
    }

    try {
        const sheets = await getSheetsClient();

        // 1. Get existing sheets to check names
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const existingSheets = meta.data.sheets;
        const existingTitles = existingSheets.map(s => s.properties.title);

        // 2. Create missing tabs
        const requests = [];
        if (!existingTitles.includes('Scores')) requests.push({ addSheet: { properties: { title: 'Scores' } } });
        // Although user said they created VP Logs, nice to ensure code is robust
        if (vpLogRows && vpLogRows.length > 0 && !existingTitles.includes('VP Logs')) {
            requests.push({ addSheet: { properties: { title: 'VP Logs' } } });
        }

        if (requests.length > 0) {
            await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });

            // Refresh metadata after creation to get updated sheetIds
            const newMeta = await sheets.spreadsheets.get({ spreadsheetId });
            existingSheets.push(...newMeta.data.sheets.filter(s => !existingTitles.includes(s.properties.title)));
        }

        // 3. Determine Next Game ID
        // Read Column A of 'Scores' to find the last ID
        let nextGameId = 1;
        try {
            const idData = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Scores!A:A'
            });
            const rows = idData.data.values;
            if (rows && rows.length > 1) { // > 1 to skip header
                // Basic ID logic: Find max ID in existing rows
                // Since 'Scores' is appended, max is likely at bottom, but let's be safe
                const ids = rows.slice(1).map(r => parseInt(r[0])).filter(n => !isNaN(n));
                if (ids.length > 0) {
                    nextGameId = Math.max(...ids) + 1;
                }
            }
        } catch (e) {
            console.log("Could not read existing IDs, defaulting to 1");
        }
        console.log(`Assigning Game ID: ${nextGameId}`);

        // 4. Prepare Payload with Game ID
        const injectedScoreRows = scoreRows.map(row => { const r = [...row]; r[0] = nextGameId; return r; });
        const injectedVpLogRows = (vpLogRows && vpLogRows.length > 0) ? vpLogRows.map(row => { const r = [...row]; r[0] = nextGameId; return r; }) : [];

        // 5. Writes

        // A. SCORES (Header-aware + Head Insertion Strategy - newest rows at top)
        // Read the actual header row so we can write each value into the correct column
        // regardless of how the user has arranged columns in the sheet.
        const scoresSheet = existingSheets.find(s => s.properties.title === 'Scores') ||
            (await sheets.spreadsheets.get({ spreadsheetId })).data.sheets.find(s => s.properties.title === 'Scores');

        const promises = [];

        if (scoresSheet) {
            const isNewScoresSheet = !existingTitles.includes('Scores');
            if (isNewScoresSheet) {
                // Brand new sheet: write header + rows using our column order
                promises.push(
                    sheets.spreadsheets.values.append({
                        spreadsheetId,
                        range: 'Scores',
                        valueInputOption: 'USER_ENTERED',
                        insertDataOption: 'INSERT_ROWS',
                        requestBody: { values: [scoreHeaders, ...injectedScoreRows] }
                    })
                );
            } else {
                // Existing sheet: read actual header row to map columns by name
                let sheetHeaders = scoreHeaders; // fallback to our own header order
                try {
                    const headerResp = await sheets.spreadsheets.values.get({
                        spreadsheetId,
                        range: 'Scores!1:1'
                    });
                    if (headerResp.data.values && headerResp.data.values[0]) {
                        sheetHeaders = headerResp.data.values[0];
                    }
                } catch (e) {
                    console.log('Could not read Scores header row, using default column order');
                }

                console.log('[DEBUG] scoreHeaders from client:', JSON.stringify(scoreHeaders));
                console.log('[DEBUG] sheetHeaders from sheet:', JSON.stringify(sheetHeaders));
                console.log('[DEBUG] first injectedScoreRow:', JSON.stringify(injectedScoreRows[0]));

                // Build a value map from our scoreHeaders -> values, then reorder to match sheet
                // injectedScoreRows uses scoreHeaders column order
                const mappedRows = injectedScoreRows.map(row => {
                    // Build a lookup: header name -> value for this row
                    const valueLookup = {};
                    scoreHeaders.forEach((h, i) => { valueLookup[h] = row[i]; });

                    // Construct a row in the sheet's actual column order
                    return sheetHeaders.map(h => {
                        const val = valueLookup[h];
                        // Ensure integers are written as numbers, not strings
                        if (h === 'Player Order' || h === 'Player ID') {
                            return val !== undefined ? parseInt(val, 10) : '';
                        }
                        return val !== undefined ? val : '';
                    });
                });

                console.log('[DEBUG] first mappedRow:', JSON.stringify(mappedRows[0]));

                // Insert empty rows at top (index 1, below header)
                const scoresSheetId = scoresSheet.properties.sheetId;
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{
                            insertDimension: {
                                range: {
                                    sheetId: scoresSheetId,
                                    dimension: 'ROWS',
                                    startIndex: 1,
                                    endIndex: 1 + mappedRows.length
                                },
                                inheritFromBefore: false
                            }
                        }]
                    }
                });
                promises.push(
                    sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: 'Scores!A2',
                        valueInputOption: 'USER_ENTERED',
                        requestBody: { values: mappedRows }
                    })
                );
            }
        }

        // B. VP LOGS (Head Insertion Strategy)
        if (injectedVpLogRows.length > 0) {
            // Find properties for 'VP Logs' to get sheetId
            const vpSheet = existingSheets.find(s => s.properties.title === 'VP Logs') ||
                (await sheets.spreadsheets.get({ spreadsheetId })).data.sheets.find(s => s.properties.title === 'VP Logs');

            if (vpSheet) {
                // If it's a BRAND NEW sheet (just created or empty), we must write the header.
                // Checking if it was just created by looking at existingTitles from start of request
                // heuristic: if !existingTitles includes 'VP Logs', it's new.

                const isNewSheet = !existingTitles.includes('VP Logs');

                if (isNewSheet) {
                    // Just append headers + rows
                    const finalVpLogData = [vpLogHeaders, ...injectedVpLogRows];
                    promises.push(
                        sheets.spreadsheets.values.append({
                            spreadsheetId,
                            range: 'VP Logs',
                            valueInputOption: 'USER_ENTERED',
                            insertDataOption: 'INSERT_ROWS',
                            requestBody: { values: finalVpLogData }
                        })
                    );
                } else {
                    // Existing sheet: INSERT ROWS AT TOP (Index 1, below header)
                    const sheetId = vpSheet.properties.sheetId;

                    // a) Insert empty rows at index 1
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        requestBody: {
                            requests: [{
                                insertDimension: {
                                    range: {
                                        sheetId: sheetId,
                                        dimension: 'ROWS',
                                        startIndex: 1,
                                        endIndex: 1 + injectedVpLogRows.length
                                    },
                                    inheritFromBefore: false
                                }
                            }]
                        }
                    });

                    // b) Write data into those rows
                    // Range starts at A2
                    promises.push(
                        sheets.spreadsheets.values.update({
                            spreadsheetId,
                            range: `VP Logs!A2`,
                            valueInputOption: 'USER_ENTERED',
                            requestBody: { values: injectedVpLogRows }
                        })
                    );
                }
            }
        }

        await Promise.all(promises);

        console.log(`Appended data to active sheets.`);
        res.status(200).send('Saved to Google Sheet successfully');

    } catch (error) {
        console.error('Error saving to Google Sheet:', error.message);
        if (error.message.includes('credentials.json')) {
            return res.status(500).send('Server missing credentials.json');
        }
        return res.status(500).send(`Google Sheets API Error: ${error.message}`);
    }
});

app.get('/api/recent-games', async (req, res) => {
    const { spreadsheetId } = req.query;

    if (!spreadsheetId) {
        return res.status(400).send('Missing spreadsheetId');
    }

    try {
        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Scores!A:G', // ID, Date, PlayerID, PlayerOrder, LeaderID, VP (+ legacy col)
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return res.json([]); // No data or just header
        }

        // Row 0 is the header - find column indices by name (robust to any column order)
        const headerRow = rows[0];
        const colIdx = {};
        headerRow.forEach((h, i) => { colIdx[h] = i; });

        // Required columns (fall back to positional for legacy data without headers)
        const hasHeaders = colIdx['Game ID'] !== undefined;
        const iGame = hasHeaders ? colIdx['Game ID'] : 0;
        const iDate = hasHeaders ? colIdx['Game Date'] : 1;
        const iPlayer = hasHeaders ? colIdx['Player ID'] : 2;
        const iLeader = hasHeaders ? colIdx['Leader ID'] : (colIdx['Player Order'] !== undefined ? 4 : 3);
        const iVP = hasHeaders ? colIdx['Victory Points'] : (colIdx['Player Order'] !== undefined ? 5 : 4);

        // Group by Game ID. Scores are written newest-first (head-insertion),
        // so reading top-to-bottom gives newest games first.
        const gamesMap = new Map();

        // Skip header row (row 0)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 3) continue;

            const gameId = row[iGame];
            const date = row[iDate];
            const pId = row[iPlayer];
            const lId = row[iLeader] !== undefined ? row[iLeader] : '';
            const vp = row[iVP] !== undefined ? row[iVP] : '';

            if (!gameId) continue;

            if (!gamesMap.has(gameId)) {
                gamesMap.set(gameId, { id: gameId, date: date, players: [] });
            }
            gamesMap.get(gameId).players.push({ playerId: pId, leaderId: lId, vp: vp });
        }

        // Newest games are at the top of the sheet (head-insertion), so the first
        // 2 unique game IDs encountered are the most recent. Reverse to get newest-first.
        const allGames = Array.from(gamesMap.values());
        const recentGames = allGames.slice(0, 2); // Already newest-first from head-insertion

        res.json(recentGames);

    } catch (error) {
        console.error('Error fetching recent games:', error.message);
        return res.status(500).send(error.message);
    }
});

app.get('/api/players', async (req, res) => {
    const { spreadsheetId } = req.query;

    if (!spreadsheetId) {
        return res.status(400).send('Missing spreadsheetId');
    }

    try {
        const sheets = await getSheetsClient();

        // 1. Check if 'Player Names' tab exists
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const existingTitles = meta.data.sheets.map(s => s.properties.title);

        if (!existingTitles.includes('Player Names')) {
            // Create it
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: 'Player Names' } } }]
                }
            });
            console.log("Created 'Player Names' tab.");
        }

        // 2. Read Data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Player Names!A:B', // ID, Name
        });

        let rows = response.data.values;

        // 3. Seed if empty
        if (!rows || rows.length === 0) {
            console.log("Seeding 'Player Names' with defaults...");
            const defaultPlayers = [
                ['ID', 'Name'],
                ['1', 'Paul'],
                ['2', 'Jessica'],
                ['3', 'Leto'],
                ['4', 'Chani'],
                ['5', 'Stilgar'],
                ['6', 'Duncan'],
                ['7', 'Zenn']
            ];

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Player Names!A1',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: defaultPlayers }
            });

            rows = defaultPlayers;
        }

        // 4. Transform to JSON
        // Skip header
        const players = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 2) {
                players.push({ id: row[0], name: row[1] });
            }
        }

        res.json(players);

    } catch (error) {
        console.error('Error fetching/seeding players:', error.message);
        res.status(500).send(error.message);
    }
});

app.get('/api/leaders', async (req, res) => {
    const { spreadsheetId } = req.query;

    if (!spreadsheetId) {
        return res.status(400).send('Missing spreadsheetId');
    }

    try {
        const sheets = await getSheetsClient();

        // 1. Check if 'Leader Names' tab exists
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const existingTitles = meta.data.sheets.map(s => s.properties.title);

        if (!existingTitles.includes('Leader Names')) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: 'Leader Names' } } }]
                }
            });
            console.log("Created 'Leader Names' tab.");
        }

        // 2. Read Data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Leader Names!A:F', // ID, Name, House, Game, Passive, Signet
        });

        let rows = response.data.values;

        // 3. Seed if empty
        if (!rows || rows.length === 0) {
            console.log("Seeding 'Leader Names' with defaults...");
            const defaultLeaders = [
                ['ID', 'Name', 'House', 'Game', 'Passive', 'Signet'],
                ['feyd', 'Feyd-Rautha Harkonnen', 'Harkonnen', 'Uprising', 'Brutality: Gather spice or solari when you send an agent to a combat space.', 'Devious Strength: Deploy troops and gain strength.'],
                ['shaddam', 'Emperor Shaddam Corrino IV', 'Corrino', 'Uprising', 'Sardaukar Contracts: You may acquire Sardaukar Contract cards.', 'Spend Solari to gain influence or troops.'],
                ['gurney', 'Gurney Halleck', 'Atreides', 'Uprising', 'Veteran: Start with 1 extra Persuasion.', 'Warmaster: Gain 1 troop.'],
                ['lady-jessica-uprising', 'Lady Jessica', 'Atreides', 'Uprising', 'Choices: Choose between water or influence path.', 'Gain Water or Influence based on choice.'],
                ['muaddib', "Muad'Dib", 'Fremen', 'Uprising', 'Unpredictable Fall: Gain Intrigue if you have sandworms in conflict.', 'Lead the Way: Draw 1 card.'],
                ['staban', 'Staban Tuek', 'Smuggler', 'Uprising', 'Smuggler: Gain spice when opponents spy on your spot.', 'Spy Network: Place spies or cash them in for Solari/Intrigue.'],
                ['irulan', 'Princess Irulan', 'Corrino', 'Uprising', 'Imperial Birthright: Gain Intrigue at 2 Emperor Influence.', 'Chronicler: Acquire cheap card or trash hand for Spice.'],
                ['margot', 'Lady Margot Fenring', 'Bene Gesserit', 'Uprising', 'Hidden Plans: Gain spice and troop manipulation.', 'Recall Spy: Retrieve spy to gain troops.'],
                ['amber', 'Lady Amber Metulli', 'Minor House', 'Uprising', 'Tactical Withdrawal: Withdraw troops to garrison.', 'Desert Tactics: Withdraw troop to gain Solari.'],
                ['esmar', 'Esmar Tuek', 'Smuggler', 'Bloodlines', "Tuek's Sietch: Access special board space to gather accumulated spice.", 'Bazaar: Trade spice/solari.'],
                ['piter', 'Piter De Vries', 'Harkonnen', 'Bloodlines', 'Twisted Mentat: Has personal Intrigue Deck.', 'Schemes: Pay water to draw cards.'],
                ['yrkoon', "Steersman Y'rkoon", 'Spacing Guild', 'Bloodlines', 'Navigator: Uses special Navigation deck.', 'Fold Space: Travel to any non-faction space.'],
                ['duncan-bloodlines', 'Duncan Idaho', 'Atreides', 'Bloodlines', 'Swordmaster of Ginaz: Combat bonuses.', 'Loyalty: Gain influence or troops.'],
                ['chani-bloodlines', 'Chani', 'Fremen', 'Bloodlines', 'Fedaykin: Sandworm synergy.', 'Sietch Life: Gain water or troops.'],
                ['kota', 'Kota Odax of Ix', 'Ixian', 'Bloodlines', 'Technocrat: Synergies with Tech tiles.', 'Surveillance: Place spies.'],
                ['liet', 'Liet Kynes', 'Fremen', 'Bloodlines', 'Planetologist: Sandworm interactions.', 'Ecology: Gain Solari or Spice.'],
                ['mohiam', 'Gaius Helen Mohiam', 'Bene Gesserit', 'Bloodlines', 'Truthsayer: Spy synergy.', 'Voice: Manipulate opponent agents.'],
                ['hasimir', 'Count Hasimir Fenring', 'Corrino', 'Bloodlines', 'Assassin: Trashing cards benefits.', 'Deep Cover: Trash card to gain Solari/Spy.']
            ];

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Leader Names!A1',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: defaultLeaders }
            });

            rows = defaultLeaders;
        }

        // 4. Transform to JSON
        const leaders = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 2) {
                leaders.push({
                    id: row[0],
                    name: row[1],
                    house: row[2] || '',
                    game: row[3] || '',
                    passive: row[4] || '',
                    signet: row[5] || ''
                });
            }
        }

        res.json(leaders);

    } catch (error) {
        console.error('Error fetching/seeding leaders:', error.message);
        res.status(500).send(error.message);
    }
});

app.get('/api/vp-actions', async (req, res) => {
    const { spreadsheetId } = req.query;

    if (!spreadsheetId) {
        return res.status(400).send('Missing spreadsheetId');
    }

    try {
        const sheets = await getSheetsClient();

        // 1. Check if 'VP Actions' tab exists
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const existingTitles = meta.data.sheets.map(s => s.properties.title);

        if (!existingTitles.includes('VP Actions')) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: 'VP Actions' } } }]
                }
            });
            console.log("Created 'VP Actions' tab.");
        }

        // 2. Read all columns dynamically
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'VP Actions!A:Z',
        });

        let rows = response.data.values;

        // 3. Seed if empty
        if (!rows || rows.length === 0) {
            console.log("Seeding 'VP Actions' with defaults...");
            const defaultActions = [
                ['Category', 'Action', 'Points'],
                ['reputation', 'emperor', '1'],
                ['reputation', 'spacing guild', '1']
            ];

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'VP Actions!A1',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: defaultActions }
            });

            rows = defaultActions;
        }

        // 4. Build column index map from header row (case-insensitive, trimmed)
        const headerRow = (rows[0] || []).map(h => h.toLowerCase().trim());
        const col = {
            category: headerRow.indexOf('category'),
            action: headerRow.indexOf('action') !== -1 ? headerRow.indexOf('action') : headerRow.indexOf('name'),
            points: headerRow.indexOf('points'),
            imageAsset: headerRow.indexOf('image asset'),
            hexcode: headerRow.indexOf('hexcode'),
        };

        // 5. Transform to JSON
        const actions = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (col.category === -1 || col.action === -1 || col.points === -1) continue;
            if (!row[col.category] || !row[col.action]) continue;

            const rawHex = col.hexcode !== -1 && row[col.hexcode] ? row[col.hexcode].trim() : '';
            const hexcode = rawHex ? (rawHex.startsWith('#') ? rawHex : `#${rawHex}`) : '';

            actions.push({
                category: row[col.category],
                action: row[col.action],
                points: parseInt(row[col.points]) || 0,
                imageAsset: col.imageAsset !== -1 && row[col.imageAsset] ? row[col.imageAsset].trim() : '',
                hexcode,
            });
        }

        res.json(actions);

    } catch (error) {
        console.error('Error fetching/seeding VP actions:', error.message);
        res.status(500).send(error.message);
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

// Export the app for Cloud Functions
export default app;

// Only listen if run directly (e.g. node server.js)
if (import.meta.url === `file://${process.argv[1]}`) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
