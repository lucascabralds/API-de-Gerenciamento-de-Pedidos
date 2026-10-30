// Traduz HTTP para chamadas ao service. Erros lançados aqui chegam ao middleware de erros.
function criarPedidoController(service) {
  return {
    criar(req, res) {
      const pedido = service.criar(req.body);
      res.status(201).json(pedido);
    },
  };
}

module.exports = { criarPedidoController };
