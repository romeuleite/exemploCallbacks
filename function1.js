//Arquivo da função 1 com apenas a chamada do callback usando o rabbit

import amqp from 'amqplib';
import { funcao2 } from './function2.js';

async function funcao1() {

    //Execução da função 1
    console.log("Função 1 chamada");

    //Declarações necessárias 
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const callbackQueue = 'callback_queue';
    await channel.assertQueue(callbackQueue, { durable: false });

    /* Substitui a comunicação entre funções com rabbitmq 
    por uma chamada simples para facilitar a visualização.
    Todo código rabbitmq desse arquivo é apenas para a chamada do callback */
    funcao2(callbackQueue);

    //Consome a resposta na fila e executa a lógica do callback
    channel.consume(callbackQueue, () => {
        console.log("Callback da Função 2 executado");
    }, { noAck: true });

}

funcao1();

