const request = require('supertest');
const { criarApp } = require('../src/app');

const pedidoValido = {
  cliente: 'Carlos Silva',
  tipo: 'entrega',
  valor: 350,
  prioridade: 'normal',
};

let app;

beforeEach(() => {
  app = criarApp();
});

describe('POST /pedidos', () => {
  test('cria pedido válido com 201, id gerado e status inicial', async () => {
    const resposta = await request(app).post('/pedidos').send(pedidoValido);

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
  });

  test('gera identificadores diferentes para cada pedido', async () => {
    const primeiro = await request(app).post('/pedidos').send(pedidoValido);
    const segundo = await request(app).post('/pedidos').send(pedidoValido);

    expect(primeiro.body.id).toBe(1);
    expect(segundo.body.id).toBe(2);
  });

  test('remove espaços nas extremidades do cliente', async () => {
    const resposta = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: '  Carlos Silva  ' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.cliente).toBe('Carlos Silva');
  });

  test('aceita valor decimal', async () => {
    const resposta = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, valor: 0.01 });

    expect(resposta.status).toBe(201);
    expect(resposta.body.valor).toBe(0.01);
  });

  test('ignora id, status e campos desconhecidos enviados pelo cliente', async () => {
    const resposta = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, id: 999, status: 'entregue', desconto: 50 });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
  });

  test.each([
    ['cliente ausente', { cliente: undefined }, 'cliente'],
    ['cliente vazio', { cliente: '' }, 'cliente'],
    ['cliente só com espaços', { cliente: '   ' }, 'cliente'],
    ['cliente numérico', { cliente: 123 }, 'cliente'],
    ['cliente nulo', { cliente: null }, 'cliente'],
    ['tipo ausente', { tipo: undefined }, 'tipo'],
    ['tipo não reconhecido', { tipo: 'correio' }, 'tipo'],
    ['tipo com maiúscula', { tipo: 'Entrega' }, 'tipo'],
    ['valor ausente', { valor: undefined }, 'valor'],
    ['valor zero', { valor: 0 }, 'valor'],
    ['valor negativo', { valor: -10 }, 'valor'],
    ['valor em texto', { valor: '350' }, 'valor'],
    ['valor nulo', { valor: null }, 'valor'],
    ['valor booleano', { valor: true }, 'valor'],
    ['prioridade ausente', { prioridade: undefined }, 'prioridade'],
    ['prioridade não reconhecida', { prioridade: 'urgente' }, 'prioridade'],
  ])('recusa com 400: %s', async (_cenario, alteracao, campo) => {
    const resposta = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, ...alteracao });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('Dados inválidos.');
    expect(resposta.body.detalhes).toHaveLength(1);
    expect(resposta.body.detalhes[0]).toContain(campo);
  });

  test('informa todos os campos inválidos de uma vez', async () => {
    const resposta = await request(app).post('/pedidos').send({});

    expect(resposta.status).toBe(400);
    expect(resposta.body.detalhes).toHaveLength(4);
  });

  test('recusa valor infinito (1e999 no JSON)', async () => {
    const resposta = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"cliente":"Ana","tipo":"entrega","valor":1e999,"prioridade":"normal"}');

    expect(resposta.status).toBe(400);
    expect(resposta.body.detalhes[0]).toContain('valor');
  });

  test('responde 400 em JSON para corpo malformado', async () => {
    const resposta = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"cliente": "Ana",');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('O corpo da requisição não é um JSON válido.');
  });

  test('responde 400 para requisição sem corpo', async () => {
    const resposta = await request(app).post('/pedidos');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('Dados inválidos.');
  });

  test('responde 400 para corpo que não é JSON', async () => {
    const resposta = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'text/plain')
      .send('cliente=Ana');

    expect(resposta.status).toBe(400);
  });

  test('responde 400 para corpo que é uma lista', async () => {
    const resposta = await request(app).post('/pedidos').send([pedidoValido]);

    expect(resposta.status).toBe(400);
  });
});

describe('GET /pedidos', () => {
  test('responde 200 com lista vazia quando não há pedidos', async () => {
    const resposta = await request(app).get('/pedidos');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  test('responde 200 com os pedidos cadastrados', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: 'Ana Souza', tipo: 'retirada' });

    const resposta = await request(app).get('/pedidos');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(2);
    expect(resposta.body.map((pedido) => pedido.cliente)).toEqual(['Carlos Silva', 'Ana Souza']);
  });

  test('não inclui tentativas de cadastro inválidas', async () => {
    await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, valor: -1 });

    const resposta = await request(app).get('/pedidos');

    expect(resposta.body).toEqual([]);
  });
});

describe('GET /pedidos/:id', () => {
  test('responde 200 com o pedido existente', async () => {
    const { body: criado } = await request(app).post('/pedidos').send(pedidoValido);

    const resposta = await request(app).get(`/pedidos/${criado.id}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(criado);
  });

  test('responde 404 em JSON para id inexistente', async () => {
    const resposta = await request(app).get('/pedidos/999');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('Pedido 999 não encontrado.');
  });

  test.each(['abc', '1abc', '1.0', '01', '-1', '0'])(
    'responde 404 para o identificador "%s", mesmo com o pedido 1 cadastrado',
    async (id) => {
      await request(app).post('/pedidos').send(pedidoValido);

      const resposta = await request(app).get(`/pedidos/${id}`);

      expect(resposta.status).toBe(404);
    }
  );
});

describe('PATCH /pedidos/:id/status', () => {
  let pedido;

  beforeEach(async () => {
    const resposta = await request(app).post('/pedidos').send(pedidoValido);
    pedido = resposta.body;
  });

  const alterarStatus = (status, id = pedido.id) =>
    request(app).patch(`/pedidos/${id}/status`).send({ status });

  test('responde 200 com o pedido atualizado', async () => {
    const resposta = await alterarStatus('cancelado');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ ...pedido, status: 'cancelado' });
  });

  test('a alteração aparece nas consultas seguintes', async () => {
    await alterarStatus('em_preparacao');

    const consulta = await request(app).get(`/pedidos/${pedido.id}`);

    expect(consulta.body.status).toBe('em_preparacao');
  });

  test('percorre o fluxo completo até a entrega', async () => {
    for (const status of ['em_preparacao', 'enviado', 'entregue']) {
      const resposta = await alterarStatus(status);
      expect(resposta.status).toBe(200);
      expect(resposta.body.status).toBe(status);
    }
  });

  test('altera apenas o status, ignorando outros campos do corpo', async () => {
    const resposta = await request(app)
      .patch(`/pedidos/${pedido.id}/status`)
      .send({ status: 'em_preparacao', valor: 1, cliente: 'Outra Pessoa', id: 50 });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ ...pedido, status: 'em_preparacao' });
  });

  test('responde 404 para id inexistente', async () => {
    const resposta = await alterarStatus('cancelado', 999);

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('Pedido 999 não encontrado.');
  });

  test('responde 404 para id inexistente mesmo com status inválido', async () => {
    const resposta = await alterarStatus('qualquer', 999);

    expect(resposta.status).toBe(404);
  });

  test.each([
    ['status não reconhecido', { status: 'pago' }],
    ['status com maiúscula', { status: 'Cancelado' }],
    ['status ausente', {}],
    ['status nulo', { status: null }],
    ['status numérico', { status: 1 }],
    ['status em lista', { status: ['cancelado'] }],
    ['nome de propriedade interna', { status: 'constructor' }],
  ])('responde 400 para %s', async (_cenario, corpo) => {
    const resposta = await request(app).patch(`/pedidos/${pedido.id}/status`).send(corpo);

    expect(resposta.status).toBe(400);
    expect(resposta.body.detalhes[0]).toContain('status deve ser um dos valores');
  });

  test('responde 400 para requisição sem corpo', async () => {
    const resposta = await request(app).patch(`/pedidos/${pedido.id}/status`);

    expect(resposta.status).toBe(400);
  });

  test('responde 400 para JSON malformado', async () => {
    const resposta = await request(app)
      .patch(`/pedidos/${pedido.id}/status`)
      .set('Content-Type', 'application/json')
      .send('{"status":');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('O corpo da requisição não é um JSON válido.');
  });

  test('responde 400 para transição não permitida e explica o motivo', async () => {
    const resposta = await alterarStatus('entregue');

    expect(resposta.status).toBe(400);
    expect(resposta.body.detalhes[0]).toBe(
      'Transição de "recebido" para "entregue" não permitida. ' +
        'Próximos status possíveis: em_preparacao, cancelado.'
    );
  });

  test('uma alteração recusada mantém o status anterior', async () => {
    await alterarStatus('entregue');

    const consulta = await request(app).get(`/pedidos/${pedido.id}`);

    expect(consulta.body.status).toBe('recebido');
  });

  test('pedido em status final não muda mais', async () => {
    await alterarStatus('cancelado');

    const resposta = await alterarStatus('recebido');

    expect(resposta.status).toBe(400);
    expect(resposta.body.detalhes[0]).toContain('Próximos status possíveis: nenhum.');
  });
});

describe('rotas desconhecidas', () => {
  test('respondem 404 em JSON', async () => {
    const resposta = await request(app).get('/produtos');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toContain('/produtos');
  });

  test('método não suportado em rota existente responde 404 em JSON', async () => {
    const resposta = await request(app).delete('/pedidos/1');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toContain('DELETE');
  });
});

describe('erros de requisição detectados pelo Express', () => {
  test('corpo acima do limite responde 413 em JSON', async () => {
    const resposta = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: 'a'.repeat(200 * 1024) });

    expect(resposta.status).toBe(413);
    expect(resposta.body.erro).toBeDefined();
  });

  test('identificador com codificação inválida na URL responde 400 em JSON', async () => {
    const resposta = await request(app).get('/pedidos/%E0%A4%A');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBeDefined();
  });
});

describe('erros inesperados', () => {
  const falha = new Error('conexão perdida com o armazenamento');
  const repositoryComFalha = {
    salvar() {
      throw falha;
    },
    listar() {
      throw falha;
    },
    buscarPorId() {
      throw falha;
    },
  };

  let logDeErro;
  let appComFalha;

  beforeEach(() => {
    logDeErro = jest.spyOn(console, 'error').mockImplementation(() => {});
    appComFalha = criarApp({ repository: repositoryComFalha });
  });

  afterEach(() => {
    logDeErro.mockRestore();
  });

  test.each([
    ['POST /pedidos', (agente) => agente.post('/pedidos').send(pedidoValido)],
    ['GET /pedidos', (agente) => agente.get('/pedidos')],
    ['GET /pedidos/:id', (agente) => agente.get('/pedidos/1')],
    ['PATCH /pedidos/:id/status', (agente) => agente.patch('/pedidos/1/status').send({ status: 'enviado' })],
  ])('%s responde 500 sem expor o detalhe do erro', async (_rota, enviar) => {
    const resposta = await enviar(request(appComFalha));

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: 'Erro interno do servidor.' });
  });

  test('registra o erro original no log do servidor', async () => {
    await request(appComFalha).get('/pedidos');

    expect(logDeErro).toHaveBeenCalledWith(falha);
  });
});
