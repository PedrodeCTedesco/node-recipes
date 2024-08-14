# node-recipes
Repositório para testar e aprimorar o meu entendimento sobre Node.js baseado no livro "Node recipes" de Cory-Gackenheimer

## server
Nesta branch temos um servidor que opera com conexões TCP.

## Considerações (package.json)

- Script de "dev" está configurado para primeiro rodar a build do projeto e depois executá-lo mesmo em modo de desenvolvimento. Isso foi feito para que os arquivos com extensão .ts pudessem ser utilizados no projeto. Uma alternativa seria utilizar: 
    "dev": "node --loader ts-node/esm src/server.ts"