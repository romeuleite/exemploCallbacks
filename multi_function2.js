import amqp from 'amqplib';

export async function countItems() {

    //Declarações necessárias 
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const countItemsQueue = 'countItems_queue';
    await channel.assertQueue(countItemsQueue, { durable: false });

    //Consome a fila da chamada com os parametros necessarios
    channel.consume(countItemsQueue, async (msg) => {
        const params = JSON.parse(msg.content.toString());
        const dbName = params.dbName
        const callback = params.callback

        //Execução da função countItems
        console.log("Calling count on " + dbName);

        /*
        Variavel para fazer um mock do banco 
        (0 => não existe)
        (n => retorna o numero de itens
        */
        const count = 10

        if (count) {
            console.log("Output for " + dbName + " is " + count);
            
            //callback(null, count);
            //Envia para a fila de callback passada como parametro o error e count
            const conteudoMsg = {
                error: null,
                count: count
            }
            channel.sendToQueue(
                callback,
                Buffer.from(JSON.stringify(conteudoMsg))
            );

        } else {
            console.log("Error in " + dbName);

            //callback(new Error("Error"), null);
            //Envia para a fila de callback passada como parametro o error e count
            const conteudoMsg = {
                error: new Error("Error"),
                count: null
            }
            channel.sendToQueue(
                callback,
                Buffer.from(JSON.stringify(conteudoMsg))
            );
        }
    }, { noAck: true });
};

countItems()
