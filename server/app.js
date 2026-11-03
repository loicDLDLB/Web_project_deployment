const express = require('express');
const mysql = require('mysql2');
const port = 3000;
const cors = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:8080' }));
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'MAXenceT2006',
    database: 'LEVEL_UP'
});

// Connexion à la base de données
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
        return;
    }
    console.log('Connecté à la base de données MySQL "LEVEL_UP" !');
});

app.listen(port, () => {
 console.log(`Server is running at http://localhost:${port}`);
}); 