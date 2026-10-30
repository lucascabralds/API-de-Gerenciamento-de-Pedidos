const { ErroDeAplicacao } = require('../errors/erros');

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// O Express só reconhece um middleware de erro pelos quatro parâmetros, por isso `next` fica na assinatura.
function tratarErros(err, req, res, next) {
  if (err instanceof ErroDeAplicacao) {
    return res.status(err.status).json({ erro: err.message, detalhes: err.detalhes });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'O corpo da requisição não é um JSON válido.' });
  }

  // Demais erros do cliente detectados pelo Express, como corpo grande demais.
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ erro: err.message });
  }

  // Erro inesperado: o detalhe fica no log e não é exposto a quem chamou a API.
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { rotaNaoEncontrada, tratarErros };
