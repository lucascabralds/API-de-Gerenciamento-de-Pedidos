// Erros previstos pela aplicação. Carregam o código HTTP que o middleware de erros deve responder.
class ErroDeAplicacao extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

class ErroValidacao extends ErroDeAplicacao {
  constructor(detalhes) {
    super('Dados inválidos.', 400);
    this.detalhes = detalhes;
  }
}

class ErroNaoEncontrado extends ErroDeAplicacao {
  constructor(mensagem) {
    super(mensagem, 404);
  }
}

module.exports = { ErroDeAplicacao, ErroValidacao, ErroNaoEncontrado };
