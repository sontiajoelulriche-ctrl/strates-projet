const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware : vérifier que l'utilisateur est connecté
function verifierToken(req, res, next) {
  let token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }
  
  token = token.replace(/"/g, '').trim();
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
}

// Lister tous les articles publiés
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.titre, a.date_publication,
             u.nom AS auteur
      FROM articles a
      JOIN users u ON a.auteur_id = u.id
      WHERE a.statut = 'publié'
      ORDER BY a.date_publication DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
});
// Lister les brouillons (admin seulement)
router.get('/brouillons', verifierToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  try {
    const result = await pool.query(`
      SELECT a.id, a.titre, a.contenu, a.date_publication,
             u.nom AS auteur
      FROM articles a
      JOIN users u ON a.auteur_id = u.id
      WHERE a.statut = 'brouillon'
      ORDER BY a.date_publication DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
});

// Publier un article (auteur connecté seulement)
router.post('/', verifierToken, async (req, res) => {
  const { titre, contenu } = req.body;
  const auteur_id = req.user.id;
  try {
    const result = await pool.query(
      `INSERT INTO articles (titre, contenu, auteur_id, statut)
       VALUES ($1, $2, $3, 'brouillon') RETURNING *`,
      [titre, contenu, auteur_id]
    );
    res.status(201).json({ message: 'Article soumis', article: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
});

// Valider un article (admin seulement)
router.patch('/:id/valider', verifierToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  try {
    const result = await pool.query(
      `UPDATE articles SET statut = 'publié' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json({ message: 'Article publié', article: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
});

module.exports = router;