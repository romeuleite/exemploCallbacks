import amqp from 'amqplib';

export async function funcao2(callback) {
    //Execução da função 2
    console.log("Função 2 chamada");
    
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    
    //Conteudo só para não deixa o parametro do buffer vazio
    const conteudoMsg = ''
    
    //Envia a chamada do callback para a fila recebida como parâmetro no cabeçalho
    channel.sendToQueue(
        callback,
        Buffer.from(conteudoMsg)
    );
    
    console.log("Processo na Função 2 finalizado");
}


