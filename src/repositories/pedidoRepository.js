// Padrão Repository: só este módulo sabe como os pedidos são guardados.
// Trocar a memória por um banco de dados não exigiria mudanças no service.
function criarPedidoRepository() {
  const pedidos = [];
  let proximoId = 1;

  return {
    salvar(dados) {
      const pedido = { id: proximoId++, ...dados };
      pedidos.push(pedido);
      return pedido;
    },

    listar() {
      return pedidos;
    },

    // Compara como texto para que "1abc" ou "1.0" não encontrem o pedido 1, como ocorreria com parseInt ou Number.
    buscarPorId(id) {
      return pedidos.find((pedido) => String(pedido.id) === String(id));
    },
  };
}

module.exports = { criarPedidoRepository };
