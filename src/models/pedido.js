// Valores reconhecidos pela API. Qualquer mudança aqui deve ser refletida no README.
const TIPOS = ['entrega', 'retirada'];
const PRIORIDADES = ['baixa', 'normal', 'alta'];
const STATUS_INICIAL = 'recebido';

// Máquina de estados: para cada status, os próximos status permitidos.
// Lista vazia indica status final, do qual o pedido não sai mais.
const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: [],
};
const STATUS = Object.keys(TRANSICOES);

module.exports = { TIPOS, PRIORIDADES, STATUS_INICIAL, TRANSICOES, STATUS };
