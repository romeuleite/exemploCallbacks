function funcao1() {
    console.log("Função 1 chamada");
    funcao2(function () {
        console.log("Callback da Função 2 executado");
    });
}

function funcao2(callback) {
    console.log("Função 2 chamada");
    console.log("Processo na Função 2 finalizado");
    callback();
}

funcao1();
