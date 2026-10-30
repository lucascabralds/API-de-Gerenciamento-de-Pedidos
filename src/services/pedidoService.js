const { STATUS_INICIAL } = require('../models/pedido');
const { validarCriacao } = require('../validators/pedidoValidator');
const { ErroNaoEncontrado } = require('../errors/erros');

// Regras de negócio. Não conhece HTTP nem a forma de armazenamento.
function criarPedidoService(repository) {
  return {
    listar() {
      return repository.listar();
    },

    buscarPorId(id) {
      const pedido = repository.buscarPorId(id);
      if (!pedido) {
        throw new ErroNaoEncontrado(`Pedido ${id} não encontrado.`);
      }
      return pedido;
    },

    criar(dados) {
      validarCriacao(dados);

      // Copia só os campos esperados: id e status enviados pelo cliente são ignorados.
      const { cliente, tipo, valor, prioridade } = dados;
      return repository.salvar({
        cliente: cliente.trim(),
        tipo,
        valor,
        prioridade,
        status: STATUS_INICIAL,
      });
    },
  };
}

module.exports = { criarPedidoService };
