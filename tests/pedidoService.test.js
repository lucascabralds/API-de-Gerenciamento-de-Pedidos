const { criarPedidoRepository } = require('../src/repositories/pedidoRepository');
const { criarPedidoService } = require('../src/services/pedidoService');
const { ErroValidacao } = require('../src/errors/erros');

const TODOS_OS_STATUS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];

// Escrita à mão, sem importar TRANSICOES, para que o teste detecte mudanças indevidas na regra.
const TRANSICOES_PERMITIDAS = [
  'recebido -> em_preparacao',
  'recebido -> cancelado',
  'em_preparacao -> enviado',
  'em_preparacao -> cancelado',
  'enviado -> entregue',
];

const combinacoes = TODOS_OS_STATUS.flatMap((origem) =>
  TODOS_OS_STATUS.map((destino) => [origem, destino])
);

describe('transições de status', () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = criarPedidoRepository();
    service = criarPedidoService(repository);
  });

  // Grava direto no repositório para colocar o pedido em qualquer status de origem.
  const pedidoComStatus = (status) =>
    repository.salvar({ cliente: 'Ana', tipo: 'entrega', valor: 10, prioridade: 'baixa', status });

  test.each(combinacoes)('de %s para %s', (origem, destino) => {
    const pedido = pedidoComStatus(origem);
    const atualizar = () => service.atualizarStatus(pedido.id, { status: destino });

    if (TRANSICOES_PERMITIDAS.includes(`${origem} -> ${destino}`)) {
      expect(atualizar().status).toBe(destino);
    } else {
      expect(atualizar).toThrow(ErroValidacao);
      expect(repository.buscarPorId(pedido.id).status).toBe(origem);
    }
  });
});
