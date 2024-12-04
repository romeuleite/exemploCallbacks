import amqp from 'amqplib';

async function countAirports(req, res) {

    //Declarações necessárias 
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const callbackQueue = 'callback_queue';
    await channel.assertQueue(callbackQueue, { durable: false });

    /* Chama a função countItems passando os parametros
    countItems(dbName, callback) atraves do rabbit */
    const conteudoMsg = {
        dbName: "DBNAME",
        callback: callbackQueue
    }
    channel.sendToQueue(
        'countItems_queue',
        Buffer.from(JSON.stringify(conteudoMsg))
    );

    //Consome a resposta na fila e executa a lógica do callback
    channel.consume(callbackQueue, async (msg) => {
        const params = JSON.parse(msg.content.toString());
        const error = params.error
        const count = params.count

        console.log(`Callback da Função 2 executado`);

        //Executa a lógica do callback usando o res que é passado como parametro
        if (error) {
            res.send("-1");
        } else {
            res.send(count.toString());
        }

    }, { noAck: true });
};

// Função para ser passado como parametro para o correto funcionamento do countAirports
function response() {
    return {
        send: function (message) {
            console.log("Resposta enviada: " + message);
        }
    };
}

countAirports({}, response());


