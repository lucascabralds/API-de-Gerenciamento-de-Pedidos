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
  };
}

module.exports = { criarPedidoRepository };
