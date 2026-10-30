const express = require('express');
const { criarPedidoRepository } = require('./repositories/pedidoRepository');
const { criarPedidoService } = require('./services/pedidoService');
const { criarPedidoController } = require('./controllers/pedidoController');
const { criarPedidoRoutes } = require('./routes/pedidoRoutes');
const { rotaNaoEncontrada, tratarErros } = require('./middlewares/tratamentoErros');

// Monta a aplicação sem abrir porta, para que os testes possam usá-la diretamente.
// Cada chamada cria um repositório novo, e os testes podem injetar outro.
function criarApp({ repository = criarPedidoRepository() } = {}) {
  const service = criarPedidoService(repository);
  const controller = criarPedidoController(service);

  const app = express();

  app.use(express.json());
  app.use('/pedidos', criarPedidoRoutes(controller));
  app.use(rotaNaoEncontrada);
  app.use(tratarErros);

  return app;
}

module.exports = { criarApp };
