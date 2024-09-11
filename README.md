# node-recipes
Repositório para testar e aprimorar o meu entendimento sobre Node.js baseado no livro "Node recipes" de Cory-Gackenheimer

## server
Nesta branch temos um servidor que opera com conexões TCP.

## Considerações (package.json)

- connections.ts

Módulo que lida com o gerenciamento de conexões de rede utilizando o pacote ``` net ``` do Node.js configurando a interação entre o servidor e os clientes que tentam se conectar a ele. O módulo ``` net ``` do Node permite a criação de servidores e clientes TCP. Dentro do módulo _connections.ts_ temos os membros:

1. queue --> uma fila que armazena as conexões pendentes. Utilizado para gerenciar os clientes que aguardam para se conectar (fila de conexão)

2. ``` connectionListener ```: 
- **Propósito**: gerenciar eventos de conexão de clientes individuais em um servidor
- **Uso**: 

3. ``` connections ```: estabelece conexões com o servidor remoto; envia uma mensagem indicando uma conexão bem-sucedida, além de tratar de desconexões e erros. Possui um temporizador para encerrar as conexões após um período especificado.

4. ``` try connect ```: verifica se há itens na fila, i.e., clientes aguardando conexão em intervalos de 500 milissegundos.

- config.ts

Módulo que define as configurações do servidor como número máximo de conexões simultâneas e lidando com desconexões. A função ``` manageConnections ``` é responsável por verificar o número de conexões ativas e a função ``` handleDisconnect ``` é invocada quando uma conexão é encerrada; possui uma função _callback_ **onDisconnect** para ser invocada quando uma conexão ocorre (p.ex., tentar reestabelecer a conexão).