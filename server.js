const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const dbPath = path.join(os.homedir(), 'smyf-refresh2024.db');

// Check if the database exists in the user root and create it if it does not
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
}

const db = new sqlite3.Database(dbPath); // Database file

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (HTML, CSS, JS)

// Create necessary tables if they don't exist
db.serialize(() => {
    // Create 'submissions' table for storing form data
    db.run(`
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chname TEXT NOT NULL,
            cpname TEXT NOT NULL,
            name TEXT NOT NULL,
            pnumber TEXT NOT NULL,
            nvcount INTEGER NOT NULL,
            vcount INTEGER NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating "submissions" table:', err.message);
        } else {
            console.log('Table "submissions" is ready.');
        }
    });

    // Create 'tag_submissions' table for storing tags
    db.run(`
        CREATE TABLE IF NOT EXISTS tag_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tags TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating "tag_submissions" table:', err.message);
        } else {
            console.log('Table "tag_submissions" is ready.');
        }
    });
});

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission (for the detailed form with tags)
app.post('/submit', (req, res) => {
    const { chname, cpname, name, pnumber, nvcount, vcount, tags } = req.body;
    
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ message: 'No tags provided' });
    }

    const tagsJson = JSON.stringify(tags); // Convert the tags array to a JSON string

    // Insert form data into the submissions table
    db.run(`
        INSERT INTO submissions (chname, cpname, name, pnumber, nvcount, vcount)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [chname, cpname, name, pnumber, nvcount, vcount], function (err) {
        if (err) {
            console.error('Error inserting form data into submissions:', err.message);
            return res.status(500).json({ message: 'Database error' });
        }

        // Insert tags into the tag_submissions table
        db.run(`
            INSERT INTO tag_submissions (tags)
            VALUES (?)
        `, [tagsJson], function (err) {
            if (err) {
                console.error('Error inserting tags into tag_submissions:', err.message);
                return res.status(500).json({ message: 'Database error' });
            }
            res.send(`
                <script>
                    alert("Thank you for registering!");
                    window.location.href = "/";
                </script>
        });
    });
});

// Retrieve and display registration data (only from submissions table here)
app.get('/retrieve', (req, res) => {
    db.all("SELECT * FROM submissions", [], (err, rows) => {
        if (err) {
            return res.status(500).send("Failed to retrieve submission data.");
        }

        let response = `
            <html>
                <head>
                    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
                    <style>
                        body {
                            background-color: #121212;
                            color: #ffffff;
                        }
                        .table-dark {
                            background-color: #333333;
                        }
                        .table-dark th {
                            background-color: #444444;
                        }
                        .table-dark td {
                            background-color: #222222;
                        }
                    </style>
                </head>
                <body>
                    <div class="container mt-5">
                        <h1 class="mb-4">Stored Data</h1>
                        <table class="table table-dark table-striped">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Church Name</th>
                                    <th>Pastorate Name</th>
                                    <th>Name</th>
                                    <th>Phone No</th>
                                    <th>Non-Veg Count</th>
                                    <th>Veg Count</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        rows.forEach((row) => {
            response += `
                <tr>
                    <td>${row.id}</td>
                    <td>${row.chname}</td>
                    <td>${row.cpname}</td>
                    <td>${row.name}</td>
                    <td>${row.pnumber}</td>
                    <td>${row.nvcount}</td>
                    <td>${row.vcount}</td>
                </tr>
            `;
        });

        response += `
                            </tbody>
                        </table>
                    </div>
                </body>
            </html>
        `;
        res.send(response);
    });
});

// Start the server
app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Server is running`);
});
