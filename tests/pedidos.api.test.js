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

describe('rotas desconhecidas', () => {
  test('respondem 404 em JSON', async () => {
    const resposta = await request(app).get('/produtos');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toContain('/produtos');
  });
});
