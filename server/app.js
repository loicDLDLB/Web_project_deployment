const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const port = 3000;
const saltRounds = 10;

const JWT_SECRET = 'coucoucou'; // À changer en production, et à stocker dans une variable d'environnement

const app = express();

app.use(cors({ origin: ['http://localhost:8080', 'http://localhost:8081'] }));
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root1234!',
    database: 'levelup'
});

// Connexion à la base de données
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
        return;
    }
    console.log('Connecté à la base de données MySQL "levelup" !');
});

// ---------- MIDDLEWARES DE PROTECTION ----------

// Vérifie le jeton, puis relit le compte en base :
// le rôle est toujours à jour et un compte supprimé est refusé immédiatement
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  db.query('SELECT id, username, role FROM users WHERE id = ?', [payload.id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error.' });
    }
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Account no longer exists.' });
    }
    req.user = rows[0]; // { id, username, role } lus en base
    next();
  });
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

// Statistiques du dashboard (réservées aux admins)
app.get('/api/admin/stats', authenticate, requireRole('admin'), (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM users WHERE role = 'admin') AS totalAdmins,
      (SELECT COUNT(*) FROM scores) AS totalGames,
      (SELECT COALESCE(MAX(score), 0) FROM scores) AS bestScore,
      (SELECT COALESCE(ROUND(AVG(score), 1), 0) FROM scores) AS avgScore,
      (SELECT u.username
         FROM scores s JOIN users u ON u.id = s.user_id
         ORDER BY s.score DESC, s.created_at ASC
         LIMIT 1) AS bestPlayer
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error.' });
    }
    const row = rows[0];
    res.json({
      totalUsers: row.totalUsers,
      totalAdmins: row.totalAdmins,
      totalGames: row.totalGames,
      bestScore: row.bestScore,
      avgScore: Number(row.avgScore),
      bestPlayer: row.bestPlayer // null s'il n'y a encore aucune partie
    });
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

// Passer un joueur en admin (l'inverse n'existe volontairement pas)
app.put('/api/admin/users/:id/promote', authenticate, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  db.query('SELECT role FROM users WHERE id = ?', [id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error.' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (rows[0].role === 'admin') {
      return res.status(400).json({ error: 'This user is already an admin.' });
    }

    db.query("UPDATE users SET role = 'admin' WHERE id = ?", [id], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: 'Server error.' });
      }
      res.json({ message: 'User promoted to admin.' });
    });
  });
});

// Supprimer un joueur (les comptes admin sont protégés)
app.delete('/api/admin/users/:id', authenticate, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  db.query('SELECT role FROM users WHERE id = ?', [id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error.' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (rows[0].role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be deleted from the dashboard.' });
    }

    db.query('DELETE FROM users WHERE id = ?', [id], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: 'Server error.' });
      }
      res.json({ message: 'User deleted.' });
    });
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
  db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error.' });
    }
    if (rows.length > 0) {
      return res.status(409).json({ error: 'This username or email is already used.' });
    }

    // Hachage du mot de passe (même principe que dans le cours) :
    // 1) on génère un sel, 2) on hache le mot de passe avec ce sel, 3) on enregistre le hash
    bcrypt
      .genSalt(saltRounds)
      .then((salt) => {
        return bcrypt.hash(password, salt);
      })
      .then((hash) => {
        // Le rôle n'est pas lu dans la requête : tout nouveau compte est "player"
        db.query(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
          [username, email, hash],
          (err2) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: 'Server error.' });
            }
            res.status(201).json({ message: 'Account created.' });
          }
        );
      })
      .catch((e) => {
        console.error(e.message);
        res.status(500).json({ error: 'Server error.' });
      });
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
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error.' });
      }

      // Même message si l'email n'existe pas ou si le mot de passe est faux
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = rows[0];

      // bcrypt.compare renvoie true ou false (comme dans le cours : validateUser)
      bcrypt
        .compare(password, user.password_hash)
        .then((match) => {
          if (!match) {
            return res.status(401).json({ error: 'Invalid email or password.' });
          }

          // Jeton de session valable 48 heures
          const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '48h' });

          res.json({
            token,
            user: { id: user.id, username: user.username, role: user.role }
          });
        })
        .catch((e) => {
          console.error(e.message);
          res.status(500).json({ error: 'Server error.' });
        });
    }
  );
});

app.listen(port, () => {
 console.log(`Server is running at http://localhost:${port}`);
}); 


// Enregistrement d'un nouveau score (nécessite d'être connecté)
app.post('/api/scores', authenticate, (req, res) => {
  const { score } = req.body;
  const userId = req.user.id; // Récupéré automatiquement via le jeton de connexion

  if (typeof score !== 'number') {
    return res.status(400).json({ error: 'Le score doit être un nombre.' });
  }

  db.query(
    'INSERT INTO scores (user_id, score) VALUES (?, ?)',
    [userId, score],
    (err) => {
      if (err) {
        console.error('Erreur SQL :', err);
        return res.status(500).json({ error: 'Erreur lors de la sauvegarde.' });
      }
      res.status(201).json({ message: 'Score enregistré avec succès !' });
    }
  );
});

// LEADERBOARD 
app.get('/api/scores/leaderboard', authenticate, (req, res) => {
  const userId = req.user.id;

  const top5Sql = `
    SELECT u.username, MAX(s.score) as bestScore
    FROM scores s
    JOIN users u ON s.user_id = u.id
    GROUP BY u.id
    ORDER BY bestScore DESC
    LIMIT 5
  `;

  db.query(top5Sql, (err, top5Rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    db.query('SELECT MAX(score) as myBest FROM scores WHERE user_id = ?', [userId], (err, bestRows) => {
      if (err) return res.status(500).json({ error: 'Server error' });

      const myBest = bestRows[0].myBest;
      if (myBest === null) {
        return res.json({ top5: top5Rows, myStats: null });
      }

      const statsSql = `
        SELECT 
          (SELECT COUNT(DISTINCT user_id) FROM scores) as totalPlayers,
          (SELECT COUNT(*) FROM (SELECT MAX(score) as maxScore FROM scores GROUP BY user_id) as userMaxes WHERE maxScore < ?) as beatenPlayers
      `;

      db.query(statsSql, [myBest], (err, statsRows) => {
        if (err) return res.status(500).json({ error: 'Server error' });

        const total = statsRows[0].totalPlayers;
        const beaten = statsRows[0].beatenPlayers;
        const percentile = total > 1 ? Math.round((beaten / (total - 1)) * 100) : 100;

        res.json({
          top5: top5Rows,
          myStats: { bestScore: myBest, percentile: percentile }
        });
      });
    });
  });
});