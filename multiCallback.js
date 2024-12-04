// Exemplo mais complexo semelhante aos do acmeair exceto pela conexão no banco

function countAirports(req, res) {
    countItems("DBNAME", function (error, count) {
        if (error) {
            res.send("-1");
        } else {
            res.send(count.toString());
        }
    });
};

function countItems(dbName, callback) {
    console.log("Calling count on " + dbName);

    const count = 10

    if (count) {
        console.log("Output for "+dbName+" is "+count);
        callback(null, count);
    } else {
        console.log("Error in " + dbName);
        callback(new Error("Error"), null);
    }
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
