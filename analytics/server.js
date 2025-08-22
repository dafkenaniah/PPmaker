const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
app.use(express.json());

let db;

(async () => {
    db = await open({
        filename: './analytics.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT,
            event_data TEXT,
            user_id TEXT,
            session_id TEXT,
            timestamp TEXT,
            url TEXT
        );

        CREATE TABLE IF NOT EXISTS time_savings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT,
            time_saved REAL,
            user_id TEXT,
            session_id TEXT,
            timestamp TEXT
        );
    `);
})();

app.post('/api/analytics', async (req, res) => {
    const { event_name, event_data, user_id, session_id, timestamp, url } = req.body;
    await db.run(
        'INSERT INTO events (event_name, event_data, user_id, session_id, timestamp, url) VALUES (?, ?, ?, ?, ?, ?)',
        event_name, JSON.stringify(event_data), user_id, session_id, timestamp, url
    );
    res.status(201).send();
});

app.post('/api/time-savings', async (req, res) => {
    const { action, time_saved, user_id, session_id, timestamp } = req.body;
    await db.run(
        'INSERT INTO time_savings (action, time_saved, user_id, session_id, timestamp) VALUES (?, ?, ?, ?, ?)',
        action, time_saved, user_id, session_id, timestamp
    );
    res.status(201).send();
});

app.listen(8080, () => {
    console.log('Analytics server running on port 8080');
});
