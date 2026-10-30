# API de Gerenciamento de Pedidos

API REST para gerenciar os pedidos de uma pequena loja. Projeto prático da disciplina Tópicos Avançados em Sistemas de Informação II.

Feita com Node.js e Express, em JavaScript. Os pedidos ficam em memória: ao reiniciar o servidor, a lista é apagada e os identificadores voltam a começar em 1.

## Instalação e execução

Requer Node.js 18 ou superior.

```bash
npm install
npm start
```

A API fica disponível em `http://localhost:3000`. Para usar outra porta, defina a variável de ambiente `PORT`.

## Rotas

| Método | Rota | Descrição | Respostas |
| --- | --- | --- | --- |
| POST | `/pedidos` | Cadastra um pedido (RF01) | 201 criado; 400 dados inválidos |
| GET | `/pedidos` | Lista os pedidos (RF02) | 200 |
| GET | `/pedidos/:id` | Consulta um pedido (RF03) | 200 encontrado; 404 inexistente |
| PATCH | `/pedidos/:id/status` | Atualiza o status (RF04) | 200 atualizado; 400 dados inválidos ou transição não permitida; 404 inexistente |

## Regras de validação

| Campo | Regra |
| --- | --- |
| `cliente` | Obrigatório. Texto não vazio, inclusive após remover os espaços das extremidades. É salvo sem esses espaços. |
| `tipo` | Obrigatório: `entrega` ou `retirada`. |
| `valor` | Obrigatório. Número maior que zero. Texto como `"350"` é recusado. |
| `prioridade` | Obrigatório: `baixa`, `normal` ou `alta`. |

- Os valores de `tipo`, `prioridade` e `status` diferenciam maiúsculas de minúsculas.
- `id` e `status` são definidos pela API. Se forem enviados no cadastro, são ignorados, assim como campos desconhecidos.

## Status e transições

Todo pedido nasce como `recebido`. O mesmo fluxo vale para os dois tipos de pedido.

| Status atual | Pode mudar para |
| --- | --- |
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | nenhum (status final) |
| `cancelado` | nenhum (status final) |

Um pedido não pode ser cancelado depois de enviado, e repetir o status atual também é recusado.

## Exemplos

### Cadastrar pedido

```http
POST /pedidos
Content-Type: application/json

{
  "cliente": "Carlos Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal"
}
```

Resposta `201`:

```json
{
  "id": 1,
  "cliente": "Carlos Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal",
  "status": "recebido"
}
```

### Cadastrar pedido com dados inválidos

```http
POST /pedidos
Content-Type: application/json

{
  "cliente": "   ",
  "tipo": "drone",
  "valor": -5,
  "prioridade": "normal"
}
```

Resposta `400`:

```json
{
  "erro": "Dados inválidos.",
  "detalhes": [
    "cliente é obrigatório e deve ser um texto não vazio.",
    "tipo deve ser um dos valores: entrega, retirada.",
    "valor deve ser numérico e maior que zero."
  ]
}
```

### Consultar pedido inexistente

```http
GET /pedidos/999
```

Resposta `404`:

```json
{
  "erro": "Pedido 999 não encontrado."
}
```

### Atualizar status

```http
PATCH /pedidos/1/status
Content-Type: application/json

{
  "status": "em_preparacao"
}
```

Resposta `200`:

```json
{
  "id": 1,
  "cliente": "Carlos Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal",
  "status": "em_preparacao"
}
```

### Tentar uma transição não permitida

Com o pedido em `em_preparacao`, enviar `{"status": "entregue"}` responde `400`:

```json
{
  "erro": "Dados inválidos.",
  "detalhes": [
    "Transição de \"em_preparacao\" para \"entregue\" não permitida. Próximos status possíveis: enviado, cancelado."
  ]
}
```

## Tratamento de erros

Todos os erros são respondidos em JSON pelo middleware `src/middlewares/tratamentoErros.js`.

| Situação | HTTP |
| --- | --- |
| Dados inválidos, transição não permitida ou JSON malformado | 400 |
| Pedido ou rota inexistente | 404 |
| Corpo da requisição acima do limite de 100 KB | 413 |
| Erro inesperado | 500 |

No erro 500, a resposta traz apenas `{"erro": "Erro interno do servidor."}`. O detalhe fica no log do servidor, para não ser confundido com uma validação nem expor informações internas.

Decisões tomadas:

- **Transição não permitida responde 400.** O enunciado define 200, 400 e 404 para essa rota, então a transição recusada é tratada como dado inválido.
- **Identificador que não existe responde 404, mesmo com formato estranho.** `/pedidos/abc` e `/pedidos/1abc` respondem 404, porque nenhum pedido tem esses identificadores.
- **No PATCH, o pedido é procurado antes de validar o corpo.** Um ID inexistente com status inválido responde 404.

## Arquitetura

A aplicação é organizada em camadas, e cada uma só conversa com a seguinte:

```text
requisição → routes → controllers → services → repositories → memória
                                       │
                                       ├── validators (formato dos dados)
                                       └── models (valores aceitos e transições)

qualquer erro lançado → middlewares/tratamentoErros → resposta JSON
```

| Pasta | Responsabilidade |
| --- | --- |
| `src/routes` | Liga cada método e URL a uma função do controller. |
| `src/controllers` | Lê os dados da requisição, chama o service e define o código HTTP de sucesso. |
| `src/services` | Regras de negócio: status inicial, transições e pedido inexistente. Não conhece HTTP. |
| `src/repositories` | Guarda e busca os pedidos. É a única camada que sabe que o armazenamento é em memória. |
| `src/validators` | Verifica os dados recebidos. Separada para o service ficar focado nas regras do pedido. |
| `src/models` | Valores aceitos de tipo e prioridade e a tabela de transições. Ficam juntos para serem alterados em um só lugar. |
| `src/errors` | Classes de erro previstas, cada uma com seu código HTTP. Permitem separar erro de validação de erro inesperado. |
| `src/middlewares` | Tratamento central de erros, para os controllers não repetirem `try/catch`. |

`src/app.js` conecta as camadas e `src/server.js` abre a porta. Com essa separação, os testes usam a aplicação sem precisar de um servidor rodando.

## Padrão implementado

**Repository.** `src/repositories/pedidoRepository.js` esconde como os pedidos são guardados, oferecendo apenas `salvar`, `listar`, `buscarPorId` e `atualizarStatus`. O service usa essas funções sem saber que os dados estão em um array.

O repositório é recebido como parâmetro pelo service (injeção de dependência). Isso traz dois ganhos:

- Trocar a memória por um banco de dados exigiria um novo repositório com as mesmas funções, sem mudar o service.
- Os testes podem injetar um repositório que sempre falha, e é assim que `tests/pedidos.api.test.js` comprova a resposta 500.

As transições de status usam uma **tabela de estados** (`TRANSICOES`, em `src/models/pedido.js`). Mudar o fluxo significa alterar a tabela, sem criar uma sequência de `if`.

## Testes

```bash
npm test
npm run test:coverage
```

São 90 testes automatizados com Jest e Supertest, com 100% de cobertura de `src/`, exceto `server.js`, que apenas abre a porta.

- `tests/pedidos.api.test.js`: testa as rotas pelo HTTP, incluindo cenários de sucesso, dados inválidos, IDs inexistentes, JSON malformado e erro 500.
- `tests/pedidoService.test.js`: testa as 25 combinações possíveis entre status de origem e de destino.

A coleção de testes do Postman está em `postman/api-pedidos.postman_collection.json`. A pasta [`evidencias/`](evidencias/README.md) traz as capturas de uma execução real dessa coleção com o Newman, a linha de comando do Postman.

## Uso de IA

Sim, utilizei uma ferramenta de IA para programação neste projeto, a partir do enunciado da atividade.

**Tarefas em que foi usada:** criação da estrutura do projeto, implementação das camadas, escrita dos testes automatizados, criação da coleção do Postman, redação deste README e geração das capturas da pasta `evidencias/`, feitas a partir de uma execução real da API com o Newman.

**Sugestão aceita: comparar o identificador como texto.** O repositório compara `String(pedido.id) === String(id)`, em vez de converter a URL com `parseInt`. Com `parseInt`, `/pedidos/1abc` encontraria o pedido 1, quando o enunciado pede 404 para identificadores inexistentes. O comportamento está coberto por testes.

**Sugestão rejeitada: responder 409 em transição não permitida.** 409 (Conflict) é comum para conflitos de estado, mas o enunciado define apenas 200, 400 e 404 para essa rota. Foi mantido 400 para seguir o contrato publicado, e a decisão está documentada neste README.
