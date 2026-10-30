const express = require('express');

// Monta a aplicação sem abrir porta, para que os testes possam usá-la diretamente.
function criarApp() {
  const app = express();

  app.use(express.json());

  return app;
}

module.exports = { criarApp };
