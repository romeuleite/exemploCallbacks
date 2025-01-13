# Refatoração de Callbacks para Funções Distribuídas

Em JavaScript, callbacks são funções passadas como argumentos para outras funções

```javascript
function square(number, callback) {
    const result = number * number
    callback(result);
}
```

Para utilizar essa função, você passaria o número e uma função de callback. Por exemplo, para exibir o resultado

```javascript
const numero = 3;
square(numero, function(n) {
    console.log(`O quadrado de ${numero} é ${n}`);
});
```

## Problema

Ao tentar transformar uma função em um serviço ou microsserviço, pode-se enfrentar um problema quando um ou mais de seus argumentos são callbacks. Esses argumentos não podem ser enviados de forma trivial pela rede, pois seria necessário transmitir todo o contexto da função resultando em grande complexidade e, em muitos casos, pode ser impossível garantir a consistência entre o contexto original e o transmitido.

## Solução

Usar o sistema de filas de mensagem para desacoplar os processos garantindo uma comunicação entre os serviços a fim de evitar os problemas citados (ex: RabbitMQ)

```javascript
channel.sendToQueue(
    callbackQueue,
    Buffer.from(msgContent)
);
```


## Porque Refatorar

O uso de callbacks, embora eficiente em sistemas pequenos, pode gerar um acoplamento excessivo entre componentes e tornar o código mais difícil de gerenciar à medida que o sistema cresce

## Benefícios da Refatoração

1. **Desacoplamento**: A comunicação via filas desacopla os produtores e consumidores de mensagens, permitindo maior flexibilidade e manutenção. Além disso, é possível também acoplar diversos callbacks utilizando um sistema de broadcast.
2. **Tolerância a falhas**: O sistema de mensageria possui mecanismos de reenvio automático, o que assegura que as mensagens sejam reprocessadas, caso o consumidor não esteja disponível no momento de sua entrega. Isso contribui para a robustez e confiabilidade do sistema como um todo
3. **Persistência de Mensagens**: O sistema possibilita a capacidade de persistir mensagens por um período maior aumentando a confiabilidade do sistema, especialmente em cenários onde é necessário manter um histórico de transações ou recuperar facilmente os dados em caso de falhas.
4. **Flexibilidade**: É possível conectar múltiplos consumidores às mensagens de callback adicionando novos módulos ou serviços sem afetar os componentes existentes. Essa capacidade de expansão torna o sistema mais dinâmico e capaz de evoluir conforme novas demandas surgem.

## Como Refatorar

![image](https://github.com/user-attachments/assets/b6a32618-350a-4f65-b88a-8ec818eccaa1)

1. No (Node 1) da função de callback conectar-se ao **`RabbitMQ`** e criar um canal

```javascript
import amqp from 'amqplib';

export async function callbackFunc(number) {

    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
```

2. Definir a **`Fila de Callback`** (O nome da fila deve ser único para cada callback)

```javascript
const callbackQueue = 'callback_queue';
await channel.assertQueue(callbackQueue, { durable: false });
```

3. Encapsular os parâmetros da função em um objeto e chamar o método do rabbitmq **`sendToQueue`** passando o nome da fila da função de callback desejada

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

5. No (Node 2) da função que chama o callback conectar-se ao **`RabbitMQ`** e criar um canal

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

## Código Completo

### Original
```javascript
function square(number, callback) {
    const result = number * number
    callback(result);
}

const numero = 3;
square(numero, function(n) {
    console.log(`O quadrado de ${numero} é ${n}`);
});
```

### Refatorado

#### Node 1
```javascript
import amqp from 'amqplib';

export async function callbackFunc(number) {

    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const callbackQueue = 'callback_queue';
    await channel.assertQueue(callbackQueue, { durable: false });

    const msgContent = {
        number: number,
        callbackQueueName: callbackQueue
    }

    channel.sendToQueue(
        'square_queue',
        Buffer.from(JSON.stringify(msgContent))
    );

    channel.consume(callbackQueue, async (msg) => {
        const params = JSON.parse(msg.content.toString());
        const n = params.result

        console.log(`O quadrado de ${number} é ${n}`);

    }, { noAck: true });

}

const numero = 3;
callbackFunc(numero);
```

#### Node 2
```javascript
import amqp from 'amqplib';

export async function square() {

    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const squareQueue = 'square_queue';
    await channel.assertQueue(squareQueue, { durable: false });

    channel.consume(squareQueue, async (msg) => {
        const params = JSON.parse(msg.content.toString());
        const number = params.number
        const callbackQueueName = params.callbackQueueName

        const result = number * number

        const msgContent = {
            result: result
        }

        channel.sendToQueue(
            callbackQueueName,
            Buffer.from(JSON.stringify(msgContent))
        );

    }, { noAck: true });

}

square()
```

## Limitações

- Alguns parâmetros das funções podem não ser transformados corretamente. Esses parâmetros precisam ser valores que possam ser serializados pelo método [**`JSON.stringify()`**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description). Ou seja, objetos simples (como objetos literais, arrays e tipos primitivos) são compatíveis, mas funções, instâncias de classes e objetos com métodos ou propriedades não serializáveis podem não ser corretamente processados

- É possível utilizar a mesma fila para diferentes funções, porém verificações adicionais são necessárias para garatir a integridade dos dados, pode se utilizar por exemplo uma variável de controle `funcName: "nome_funcao"` dentro do objeto  que contém os parâmetros


