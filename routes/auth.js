const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// INSCRIPTION
router.post('/inscription', async (req, res) => {
  const { nom, email, mot_de_passe } = req.body;

  try {
    // Vérifier si l'email existe déjà
    const existe = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Chiffrer le mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 10);

    // Créer l'utilisateur
    const result = await pool.query(
      'INSERT INTO users (nom, email, mot_de_passe) VALUES ($1, $2, $3) RETURNING id, nom, email, role',
      [nom, email, hash]
    );

    res.status(201).json({ message: 'Compte créé', user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
});

// CONNEXION
router.post('/connexion', async (req, res) => {
  const { email, mot_de_passe } = req.body;

  try {
    // Chercher l'utilisateur
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const valide = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valide) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Connecté', token, user: { id: user.id, nom: user.nom, role: user.role } });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
});

module.exports = router;