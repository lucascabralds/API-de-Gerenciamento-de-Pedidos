const { Router } = require('express');

function criarPedidoRoutes(controller) {
  const router = Router();

  router.post('/', controller.criar);

  return router;
}

module.exports = { criarPedidoRoutes };
