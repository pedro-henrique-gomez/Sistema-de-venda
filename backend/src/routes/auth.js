const router = require('express').Router();

router.post('/login', (req, res) => {
  // placeholder: mantém o app rodando sem quebrar fluxos
  res.json({ token: 'dev-token', user: { id: 1, nome: 'Admin' } });
});

router.get('/me', (req, res) => {
  res.json({ id: 1, nome: 'Admin' });
});

module.exports = router;

