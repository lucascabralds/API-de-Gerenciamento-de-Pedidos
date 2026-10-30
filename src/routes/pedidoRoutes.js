const { Router } = require('express');

function criarPedidoRoutes(controller) {
  const router = Router();

  router.post('/', controller.criar);
  router.get('/', controller.listar);
  router.get('/:id', controller.buscarPorId);

  return router;
}

module.exports = { criarPedidoRoutes };
