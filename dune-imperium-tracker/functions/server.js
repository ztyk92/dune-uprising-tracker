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
    const { spreadsheetId, scoreHeaders, scoreRows, logHeaders, logRows } = req.body;

    if (!spreadsheetId || !scoreHeaders || !scoreRows || !logHeaders || !logRows) {
        return res.status(400).send('Missing required fields (spreadsheetId, headers, rows)');
    }

    try {
        const sheets = await getSheetsClient();

        // 1. Get existing sheets to check names
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const existingTitles = meta.data.sheets.map(s => s.properties.title);

        // 2. Create missing tabs
        const requests = [];
        if (!existingTitles.includes('Scores')) requests.push({ addSheet: { properties: { title: 'Scores' } } });
        if (!existingTitles.includes('Logs')) requests.push({ addSheet: { properties: { title: 'Logs' } } });

        if (requests.length > 0) {
            await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
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
                // Get the last row's first column
                const lastId = parseInt(rows[rows.length - 1][0]);
                if (!isNaN(lastId)) {
                    nextGameId = lastId + 1;
                }
            }
        } catch (e) {
            console.log("Could not read existing IDs, defaulting to 1");
        }
        console.log(`Assigning Game ID: ${nextGameId}`);

        // 4. Prepare Payload with Game ID
        // The frontend sends [placeholder, date, ...]. We overwrite [0] with nextGameId.
        const injectedScoreRows = scoreRows.map(row => {
            const newRow = [...row];
            newRow[0] = nextGameId;
            return newRow;
        });

        const injectedLogRows = logRows.map(row => {
            const newRow = [...row];
            newRow[0] = nextGameId;
            return newRow;
        });

        // Check if we need to include headers (if new tab)
        const finalScoreData = (!existingTitles.includes('Scores')) ? [scoreHeaders, ...injectedScoreRows] : injectedScoreRows;
        const finalLogData = (!existingTitles.includes('Logs')) ? [logHeaders, ...injectedLogRows] : injectedLogRows;

        // 5. Append to "Scores" and "Logs"
        await Promise.all([
            sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Scores',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: finalScoreData }
            }),
            sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Logs',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: finalLogData }
            })
        ]);

        console.log(`Appended data to 'Scores' and 'Logs'.`);
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
            range: 'Scores!A:F', // ID, Date, Name, Leader, House, VP
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return res.json([]); // No data or just header
        }

        // Group by Game ID (Index 0)
        // Structure: Map<GameID, { id, date, players: [] }>
        const gamesMap = new Map();

        // Skip header (row 0)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const gameId = row[0]; // Col A
            const date = row[1];   // Col B

            let pIdOrName, lIdOrName, vp;

            // Simple heuristic based on column count
            // New Format: [ID, Date, PlayerID, LeaderID, VP] (Length 5)
            // Old Format: [ID, Date, Name, Leader, House, VP] (Length 6)

            if (row.length === 5) {
                pIdOrName = row[2];
                lIdOrName = row[3];
                vp = row[4];
            } else if (row.length >= 6) {
                pIdOrName = row[2];
                lIdOrName = row[3];
                // row[4] is house (ignored now)
                vp = row[5];
            } else {
                continue; // Malformed row
            }

            if (!gamesMap.has(gameId)) {
                gamesMap.set(gameId, {
                    id: gameId,
                    date: date,
                    players: []
                });
            }

            // We push generic "playerId" / "leaderId" fields
            // The frontend resolves them to names if they are IDs
            gamesMap.get(gameId).players.push({
                playerId: pIdOrName,
                leaderId: lIdOrName,
                vp: vp
            });
        }

        // Convert Map to Array and take last 2
        const allGames = Array.from(gamesMap.values());
        const recentGames = allGames.slice(-2).reverse(); // Newest first

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
