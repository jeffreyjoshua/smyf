const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('reg.db'); // Using a file-based database

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create table
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS reg (id INTEGER PRIMARY KEY AUTOINCREMENT, chname TEXT, email TEXT, headcount INTEGER)");
});

// Handle form submission
app.post('/submit', (req, res) => {
    const { chname, email, headcount } = req.body;
    const stmt = db.prepare("INSERT INTO reg (chname, email, headcount) VALUES (?, ?, ?)");
    stmt.run(chname, email, headcount, (err) => {
        if (err) {
            return res.status(500).send("Failed to save data.");
        }
        stmt.finalize();
        
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
});

// Retrieve and display stored data
app.get('/retrieve', (req, res) => {
    db.all("SELECT * FROM reg", [], (err, rows) => {
        if (err) {
            return res.status(500).send("Failed to retrieve data.");
        }
        let response = `
            <html>
                <head>
                    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
                    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
                    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js"></script>
                    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
                    <style>
                        body {
                            background-color: #121212;
                            color: #ffffff;
                            font-family: Arial, sans-serif;
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
                                    <th>Email</th>
                                    <th>Head Count</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        rows.forEach((row) => {
            response += `
                <tr>
                    <td>${row.id}</td>
                    <td>${row.chname}</td>
                    <td>${row.email}</td>
                    <td>${row.headcount}</td>
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
  
