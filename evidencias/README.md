# Evidências — Postman

Capturas dos testes manuais feitos no Postman. Cada imagem mostra método, URL, corpo da requisição (quando há), resposta e código HTTP.

| Arquivo | Cenário | Requisição na coleção | HTTP esperado |
| --- | --- | --- | --- |
| `01-criacao.png` | POST válido | 01 - POST valido | 201 |
| `02-validacao.png` | POST inválido | 02 - POST invalido | 400 |
| `03-listagem.png` | GET da lista de pedidos | 03 - GET lista de pedidos | 200 |
| `04-consulta-inexistente.png` | GET de ID inexistente | 04 - GET id inexistente | 404 |
| `05-atualizacao.png` | PATCH de status válido | 05 - PATCH status valido | 200 |

## Como reproduzir

1. Inicie a API com o servidor zerado: `npm start`.
2. No Postman, importe `postman/api-pedidos.postman_collection.json`.
3. Envie as requisições na ordem da tabela. A 05 altera o pedido 1, criado pela 01. Para repetir a sequência, reinicie o servidor, pois os pedidos ficam em memória.
