const fetch = require("node-fetch");
const normalize = require("normalize-text");
const stripHtml = require("string-strip-html"); //remover html tag do texto
var sw = require("stopword"); //remover stop words
var natural = require("natural"); //radicalizar as palavras

portuguesSw = sw.ptbr;

var url = [
  "http://localhost/index.html",
  "http://localhost/Historia.html",
  "http://localhost/Cassinos.html",
  // "https://pocos.000webhostapp.com/PontosTuristicos.html",
  // "https://pocos.000webhostapp.com/Industrias.html",
  // "https://pocos.000webhostapp.com/Geografia.html",
  // "https://pocos.000webhostapp.com/Eventos.html",
  // "https://pocos.000webhostapp.com/Curiosidades.html",
  // "https://pocos.000webhostapp.com/Fotos.html",
];
var storedText;

var matriz = {};

for (var i = 0; i < url.length; i++) {
  matriz[i] = [];
}

var chave = "pocos";

var hash = new Map();

var coluna = 0;

var textosTratados;

async function getTextos() {
  textosTratados = await Promise.all(
    url.map(async (item, i) => {
      const response = await fetch(item);
      const text = await response.text();
      return [done(text), i];
    })
  );
  textosTratados.forEach((value) => {
    const conjuntoPalavras = value[0];
    const link = value[1];
    console.log(
      "estamos no arquivo ",
      link,
      "que tem ",
      conjuntoPalavras.length
    );
    conjuntoPalavras.forEach((palavra) => {
      var palavra1 = natural.PorterStemmerPt.stem(palavra);
      if (hash.get(palavra1) != null) {
        var col = hash.get(palavra1);
        matriz[link][col] == null
          ? (matriz[link][col] = 1)
          : (matriz[link][col] += 1);
        // console.log(
        //   "ja foi criado a palavra ",
        //   palavra1,
        //   "na coluna ",
        //   col,
        //   "que agora vale ",
        //   matriz[link][col]
        // );
      } else {
        hash.set(palavra1, coluna);
        matriz[link][coluna] = 1;
        // console.log(
        //   "criando a palavra ",
        //   palavra1,
        //   "na coluna ",
        //   coluna,
        //   "que agora vale ",
        //   matriz[link][coluna]
        // );
        coluna++;
      }
    });
  });
  mostrarMatriz();
  normalizarMatriz();
  calcularMatriz();
  mostrarMatriz();
  var chaveProcessada = done(chave);
}

function normalizarMatriz() {
  var maior = 0;
  for (linha in matriz) {
    if (matriz[linha].length > maior) {
      maior = matriz[linha].length;
    }
  }
  console.log("o maior arquivo tem ", maior);

  for (linha in matriz) {
    var tamanho = matriz[linha].length;
    while (tamanho < maior) {
      matriz[linha][tamanho] = 0;
      tamanho += 1;
    }
  }
}

function calcularMatriz() {
  var j = 0;
  for (linha in matriz) {
    console.log("fazendo linha ", linha, "com length ", matriz[linha].length);
    matriz[linha].forEach((coluna, index) => {
      var tf = 0;
      if (matriz[j][index]) {
        tf = 1 + Math.log(matriz[j][index]);
      }
      var idf = calculaIdf(index);
      matriz[j][index] = tf * idf;
      //console.log("a matriz ", j, " ", index, "agora tem ", matriz[j][index]);
    });
    j += 1;
  }
}

function calculaIdf(index) {
  var ocorrencias = 0;
  var quantidade = url.length;

  for (linha in matriz) {
    if (matriz[linha][index] != null) {
      ocorrencias += 1;
    }
  }

  return quantidade / ocorrencias;
}

getTextos();

function done(item) {
  newString = String(item).replace(/\d+/g, "");

  const textoFino = normalize.normalizeText(newString);

  const testeSemHtml = stripHtml(textoFino).result;

  return sw.removeStopwords(testeSemHtml.split(" "), portuguesSw);
}

function mostrarMatriz() {
  for (var i = 0; i < url.length; i++) {
    console.log("linha ", i);
    console.log(matriz[i][0]);
  }
}
//inserir a chave de busca na tabela (fazer todo o processo de normalização), e colocar o valor 1 na chave que tiver

//norma L2 - eleva todos os valores da linha ao quadrado e soma, depois tira a raiz de tudo, calcular tambem da chave de busca
//produto escalar - multiplicar cada valor da linha do arquivo pelo valor da linha da chave de busca
//cosseno = produto escalar / (norma da chave * norma do arquivo)

//ordenar os 5 maiores cossenos e retornar o link desses arquivos
