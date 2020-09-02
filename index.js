const fetch = require("node-fetch");
const normalize = require("normalize-text");
const stripHtml = require("string-strip-html"); //remover html tag do texto
var sw = require("stopword"); //remover stop words
var natural = require("natural"); //radicalizar as palavras

portuguesSw = sw.ptbr;

var url = [
  "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/index.html",
  "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/rachel.html",
  "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/ross.html",
  "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/monica.html",
  "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/primeira.html",
  // "https://pocos.000webhostapp.com/PontosTuristicos.html",
  // "https://pocos.000webhostapp.com/Industrias.html",
  // "https://pocos.000webhostapp.com/Geografia.html",
  // "https://pocos.000webhostapp.com/Eventos.html",
  // "https://pocos.000webhostapp.com/Curiosidades.html",
  // "https://pocos.000webhostapp.com/Fotos.html",
];
var storedText;

var matriz = [];

for (var i = 0; i <= url.length; i++) {
  matriz[i] = [];
}

var chave = "rachel";

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

  popularMatriz(conjuntoPalavras, link);

  });
  normalizarMatriz();
  calcularMatriz();
  //mostrarMatriz();

  var chaveProcessada = done(chave);
  popularMatriz(chaveProcessada, url.length);
  similaridadeDoCosseno();

}


function popularMatriz(conjuntoPalavras, link){

  conjuntoPalavras.forEach((palavra) => {
    var palavra1 = natural.PorterStemmerPt.stem(palavra);
    if (hash.get(palavra1) != null) {
      var col = hash.get(palavra1);
      matriz[link][col] == null
        ? (matriz[link][col] = 1)
        : (matriz[link][col] += 1);
    } else {
      hash.set(palavra1, coluna);
      matriz[link][coluna] = 1;
      coluna++;
    }
  });
}

function normalizarMatriz() {
  var maior = 0;
  for (linha in matriz) {
    if (matriz[linha].length > maior) {
      maior = matriz[linha].length;
    }
    for(var i=0; i<matriz[linha].length; i++){
      if(!matriz[linha][i]){
        matriz[linha][i] = 0;
      }
    }
  }
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
    matriz[linha].forEach((coluna, index) => {
      var tf = 0;
      if (matriz[j][index] > 0) {
        tf = 1 + Math.log(matriz[j][index]);
      }else {
        tf = 0;
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
    if (matriz[linha][index] > 0) {
      ocorrencias += 1;
    }
  }

  return Math.log(quantidade / ocorrencias);
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
    for(var j = 0; j<20; j++){
      console.log("linha ", i, "coluna ", j);
      console.log(matriz[i][j]);
    }
  }
}


function similaridadeDoCosseno(){
  var vetorL2 = [];
  var vetorProdutoEscalar = [];

  var vetorCosseno = [];

  for(linha in matriz){
    vetorL2[linha] = calculaL2(linha);
    vetorProdutoEscalar[linha] = produtoEscalar(linha);
    //console.log("para o arquivo ", linha, " o l2 vale ", vetorL2[linha], " e o escalar vale ", vetorProdutoEscalar[linha]);
  }

  var normaDaChave = vetorL2[vetorL2.length-1];

  for(var i=0; i<vetorL2.length-1; i++){
    vetorCosseno[i] = vetorProdutoEscalar[i]/(normaDaChave*vetorL2[i]);
    console.log("para o arquivo ", i, " o cosseno eh ", vetorCosseno[i]);
  }




}

//inserir a chave de busca na tabela (fazer todo o processo de normalização), e colocar o valor 1 na chave que tiver

//norma L2 - eleva todos os valores da linha ao quadrado e soma, depois tira a raiz de tudo, calcular tambem da chave de busca
function calculaL2(linha){
  var soma = 0;
  for(var i=0; i<matriz[linha].length; i++){
    soma = soma + matriz[linha][i]*matriz[linha][i];
  }
  return Math.sqrt(soma);
}


function produtoEscalar(linha){
    var linhaDaChave = url.length;
    var soma = 0;
    for(var i=0; i<matriz[linha].length; i++){
      soma = soma + matriz[linha][i]*matriz[linhaDaChave][i];
    }
    return soma;
}



//produto escalar - multiplicar cada valor da linha do arquivo pelo valor da linha da chave de busca
//cosseno = produto escalar / (norma da chave * norma do arquivo)

//ordenar os 5 maiores cossenos e retornar o link desses arquivos
