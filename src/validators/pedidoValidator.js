const { TIPOS, PRIORIDADES, STATUS } = require('../models/pedido');
const { ErroValidacao } = require('../errors/erros');

// Reúne todos os problemas do corpo de uma vez, para o cliente corrigir tudo em uma só tentativa.
// `dados` pode ser undefined: o Express 5 não define req.body em requisições sem corpo JSON.
function validarCriacao(dados) {
  const { cliente, tipo, valor, prioridade } = dados ?? {};
  const erros = [];

  if (typeof cliente !== 'string' || cliente.trim() === '') {
    erros.push('cliente é obrigatório e deve ser um texto não vazio.');
  }
  if (!TIPOS.includes(tipo)) {
    erros.push(`tipo deve ser um dos valores: ${TIPOS.join(', ')}.`);
  }
  // Number.isFinite não converte tipos: recusa "350" e também 1e999, que o JSON lê como Infinity.
  if (!Number.isFinite(valor) || valor <= 0) {
    erros.push('valor deve ser numérico e maior que zero.');
  }
  if (!PRIORIDADES.includes(prioridade)) {
    erros.push(`prioridade deve ser um dos valores: ${PRIORIDADES.join(', ')}.`);
  }

  if (erros.length > 0) {
    throw new ErroValidacao(erros);
  }
}

function validarStatus(dados) {
  const { status } = dados ?? {};

  if (!STATUS.includes(status)) {
    throw new ErroValidacao([`status deve ser um dos valores: ${STATUS.join(', ')}.`]);
  }
}

module.exports = { validarCriacao, validarStatus };
