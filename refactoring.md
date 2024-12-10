# Refatoração de Callbacks para Funções Distribuídas com RabbitMQ

Em JavaScript, callbacks são funções passadas como argumentos para outras funções

```javascript
function square(number, callback) {
    const result = number * number
    callback(result);
}
```

Para utilizar essa função, você passaria o número e uma função de callback. Por exemplo, para exibir o resultado

```javascript
square(3, function(n) {
    console.log("Resultado:", n);
});
```

## Problema

O uso de callbacks pode levar a problemas como **`Callback Hell`**, dificulta o tratamento de erros e depuração, afetando consideravelmente a escalabilidade e manutenibilidade do projeto

## Solução

Usar o sistema de filas de mensagem RabbitMQ para desacoplar os processos garantindo uma comunicação entre os serviços a fim de evitar os problemas citados

```javascript
channel.sendToQueue(
    callbackQueue,
    Buffer.from(msgContent)
);
```


## Porque Refatorar

O uso de callbacks, embora eficiente em sistemas pequenos, pode gerar um acoplamento excessivo entre componentes e tornar o código mais difícil de gerenciar à medida que o sistema cresce

## Benefícios da Refatoração

1. **Escalabilidade**: O uso de RabbitMQ permite que o sistema seja escalado facilmente, distribuindo as cargas de trabalho para diferentes instâncias.
2. **Desacoplamento**: A comunicação via filas desacopla os produtores e consumidores de mensagens, permitindo maior flexibilidade e manutenção.
3. **Assincronia**: O uso de filas permite que o sistema execute outras tarefas enquanto espera a resposta, melhorando a performance geral.

## Como Refatorar

1. No arquivo da função de callback conectar-se ao **`RabbitMQ`** e criar um canal

```javascript
import amqp from 'amqplib';

export async function callbackFunc() {

    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
```

2. Definir a **`Fila de Callback`**

```javascript
const callbackQueue = 'callback_queue';
await channel.assertQueue(callbackQueue, { durable: false });
```

3. Chamar a função passando os parâmetros e o nome da fila de callback através do rabbitmq **`sendToQueue`**

```javascript
const msgContent = {
    number: number,
    callbackQueueName: callbackQueue
}

channel.sendToQueue(
    'square_queue',
    Buffer.from(JSON.stringify(msgContent))
);
```

4. **`Consumir`** a resposta da fila de callback e executar a lógica

```javascript
channel.consume(callbackQueue, async (msg) => {
    const params = JSON.parse(msg.content.toString());
    const n = params.result

    console.log("Resultado:", n);

}, { noAck: true });
```

5. No arquivo da função que chama o callback conectar-se ao **`RabbitMQ`** e criar um canal

```javascript
import amqp from 'amqplib';

export async function square() {

    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
```

6. Declarar a fila da chamada

```javascript
const squareQueue = 'square_queue';
await channel.assertQueue(squareQueue, { durable: false });
```

7. **`Consumir`** a fila da chamada com os parametros necessários...

```javascript
channel.consume(squareQueue, async (msg) => {
    const params = JSON.parse(msg.content.toString());
    const number = params.number
    const callbackQueueName = params.callbackQueueName

```

8. ...executar a lógica da função e enviar a resposta para a fila de callback **`sendToQueue`**

```javascript
const result = number * number

const msgContent = {
    result: result
}

channel.sendToQueue(
    callbackQueueName,
    Buffer.from(JSON.stringify(msgContent))
);

}, { noAck: true });
```

## Limitações

A refatoração se limita apenas a objetos que podem ser passados pelo método **`JSON.stringify()`**



