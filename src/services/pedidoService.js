const { STATUS_INICIAL, TRANSICOES } = require('../models/pedido');
const { validarCriacao, validarStatus } = require('../validators/pedidoValidator');
const { ErroNaoEncontrado, ErroValidacao } = require('../errors/erros');

// Regras de negócio. Não conhece HTTP nem a forma de armazenamento.
function criarPedidoService(repository) {
  function buscarPorId(id) {
    const pedido = repository.buscarPorId(id);
    if (!pedido) {
      throw new ErroNaoEncontrado(`Pedido ${id} não encontrado.`);
    }
    return pedido;
  }

  return {
    buscarPorId,

    listar() {
      return repository.listar();
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

    atualizarStatus(id, dados) {
      // O pedido é procurado primeiro: id inexistente responde 404 mesmo com corpo inválido.
      const pedido = buscarPorId(id);
      validarStatus(dados);

      const { status } = dados;
      const permitidos = TRANSICOES[pedido.status];
      if (!permitidos.includes(status)) {
        throw new ErroValidacao([
          `Transição de "${pedido.status}" para "${status}" não permitida. ` +
            `Próximos status possíveis: ${permitidos.join(', ') || 'nenhum'}.`,
        ]);
      }

      return repository.atualizarStatus(pedido.id, status);
    },
  };
}

module.exports = { criarPedidoService };
