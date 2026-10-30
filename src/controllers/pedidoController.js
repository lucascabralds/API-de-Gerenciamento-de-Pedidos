// Traduz HTTP para chamadas ao service. Erros lançados aqui chegam ao middleware de erros.
function criarPedidoController(service) {
  return {
    criar(req, res) {
      const pedido = service.criar(req.body);
      res.status(201).json(pedido);
    },

    listar(req, res) {
      res.status(200).json(service.listar());
    },

    buscarPorId(req, res) {
      res.status(200).json(service.buscarPorId(req.params.id));
    },

    atualizarStatus(req, res) {
      res.status(200).json(service.atualizarStatus(req.params.id, req.body));
    },
  };
}

module.exports = { criarPedidoController };
