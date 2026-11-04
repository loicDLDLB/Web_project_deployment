const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const port = 3000;

const JWT_SECRET = 'coucoucou'; // À changer en production, et à stocker dans une variable d'environnement

const app = express();

app.use(cors({ origin: ['http://localhost:8080', 'http://localhost:8081'] }));
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

// ---------- MIDDLEWARES DE PROTECTION ----------

// Vérifie que la requête contient un jeton valide
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET); // contient { id, role }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Vérifie que l'utilisateur connecté a le rôle demandé
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    next();
  };
}

// Infos du joueur connecté (accessible à tout utilisateur connecté)
app.get('/api/auth/me', authenticate, (req, res) => {
  db.query('SELECT id, username, email, role FROM users WHERE id = ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error.' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(rows[0]);
  });
});

// Liste des utilisateurs (réservée aux admins)
app.get('/api/admin/users', authenticate, requireRole('admin'), (req, res) => {
  db.query('SELECT id, username, email, role, created_at FROM users ORDER BY id', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error.' });
    }
    res.json(rows);
  });
});

app.get('/api/health', (req, res) => {
  db.query('SELECT COUNT(*) AS nb FROM users', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: err.message });
    }
    res.json({ status: 'ok', users: results[0].nb });
  });
});

// ---------- INSCRIPTION ----------
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  const errors = {};

  // Validation côté serveur (on ne fait jamais confiance au client)
  if (typeof username !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    errors.username = 'Username must be 3-20 characters (letters, numbers, underscores).';
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    errors.email = 'Please enter a valid email address.';
  }
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    errors.password = 'Password needs 8+ characters, an uppercase letter, a lowercase letter and a number.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  // Vérifie que le pseudo et l'email ne sont pas déjà pris
  db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error.' });
    }
    if (rows.length > 0) {
      return res.status(409).json({ error: 'This username or email is already used.' });
    }

    try {
      // Hachage du mot de passe : on ne stocke JAMAIS le mot de passe en clair
      const passwordHash = await bcrypt.hash(password, 10);

      // Le rôle n'est pas lu dans la requête : tout nouveau compte est "player"
      db.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash],
        (err2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: 'Server error.' });
          }
          res.status(201).json({ message: 'Account created.' });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error.' });
    }
  });
});

// ---------- CONNEXION ----------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  db.query(
    'SELECT id, username, email, password_hash, role FROM users WHERE email = ?',
    [email],
    async (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error.' });
      }

      // Même message si l'email n'existe pas ou si le mot de passe est faux
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Jeton de session valable 2 heures
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role }
      });
    }
  );
});

app.listen(port, () => {
 console.log(`Server is running at http://localhost:${port}`);
}); 