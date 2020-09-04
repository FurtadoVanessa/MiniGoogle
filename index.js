import fetch from "node-fetch"; //recuperar texto de um arquivo na web
import normalize from "normalize-text"; //remover espaços e deixar tudo minúsculo
import stripHtml from "string-strip-html"; //remover html tag do texto
import sw from "stopword"; //remover stop words
import natural from "natural"; //radicalizar as palavras
import http from "http"; //servidor http para receber a requisição
import urlParser from "url"; //parser para obter a chave de busca a partir da url de requisição
import { url } from "./links.js";
/**
 * Server http que fica escutando requisições. A chave de busca é recuperada através da url
 * de requisição, e entao é passada para que realize os cãculos necessários.
 * Com o retorno dos calculos, é pego os links correspondentes aos arquivos e retornados pelo
 * response da requisição
 *
 * A requisição é feita do tipo "http://localhost:3333/?chave=curiosidade"
 */
http
  .createServer((request, response) => {
    var query = urlParser.parse(request.url, true).query;
    var cossenos = processaPalavraChave(query.chave);
    var links = [];
    for (var i = 0; i < 5; i++) {
      links[i] = url[cossenos[i][0]];
    }
    console.log(links);
    response.writeHead(200, { "Content-Type": "text/html" });
    response.write(links.toString());
    response.end();
  })
  .listen(3333);

/**
 * Definição da lingua PT-BR para tabela de stop words
 */
//portuguesSw = sw.ptbr;

// var url = [
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/index.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/rachel.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/ross.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/monica.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/pheobe.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/chandler.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/joey.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/primeira.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/segunda.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/terceira.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/quarta.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/quinta.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/sexta.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/setima.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/oitava.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/nona.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/decima.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/elenco.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/historia.html",
//   "https://furtadovanessa.github.io/ProgramacaoWebI/Interdisciplinar/curiosidades.html",
// ];

/**
 * matriz - matriz contendo todos os cálculos de vocabulário para os arquivos analisados(url)
 * hash - hashMap utilizada para mapeamento das coluna correspondente a qual palavra
 * coluna - contador de colunas (palavras) existentes no vocabulário
 * textosTratados - recebe o texto tratado com remoção de números, espaços e maiúsculas, tags html
 * e stop words
 */

var matriz = [];

var hash;

var coluna = 0;

var textosTratados;

/**
 * Inicializa as variáveis, trata os textos de cada arquivo, normaliza a matriz (deixando ela quadrada),
 * realiza os cálculos de TF-IDF,
 */
hash = new Map();
coluna = 0;

for (var i = 0; i <= url.length; i++) {
  matriz[i] = [];
}

tratarTextos().then(() => {
  normalizarMatriz();
  calcularMatriz();
  console.log("matriz esta pronta");
});

/**
 * radicaliza a chave de busca, a insere na matriz, normaliza a matriz e retorna a similaridade do
 * cosseno para a chave de busca inserida
 * @param chave de busca a ser processada
 */
function processaPalavraChave(chave) {
  matriz[url.length] = [];
  var chaveProcessada = done(chave);
  popularMatriz(chaveProcessada, url.length);
  normalizarMatriz();
  return similaridadeDoCosseno();
}

/**
 * Recupera as informações de todos os links, trata o vocabulário de cada link, e para cada um desses,
 * popula a matriz
 */
async function tratarTextos() {
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
}

/**
 * Realiza a radicalização de cada palavra do arquivo e preenche a matriz na linha do arquivo de acordo
 * com as palavras encontradas
 * @param  conjuntoPalavras - todas as palavras daquele link
 * @param  link - index correspondente àquele link
 */
function popularMatriz(conjuntoPalavras, link) {
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

/**
 * Torna a matriz quadrada, para que possa ser feito os cálculos
 */
function normalizarMatriz() {
  var maior = 0;
  for (var linha = 0; linha < matriz.length; linha++) {
    if (matriz[linha].length > maior) {
      maior = matriz[linha].length;
    }
    for (var i = 0; i < matriz[linha].length; i++) {
      if (!matriz[linha][i]) {
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

/**
 * Realiza o cálculo de TFxIDF para todos os arquivos da matriz
 */
function calcularMatriz() {
  var j = 0;
  for (var linha = 0; linha < matriz.length; linha++) {
    matriz[linha].forEach((coluna, index) => {
      var tf = 0;
      if (matriz[j][index] > 0) {
        tf = 1 + Math.log(matriz[j][index]);
      } else {
        tf = 0;
      }
      var idf = calculaIdf(index);
      matriz[j][index] = tf * idf;
    });
    j += 1;
  }
}

/**
 * Calcula o IDF de uma coluna específica em todo o vocabulário do sistema
 * @param  index coluna correspondente da palavra
 */
function calculaIdf(index) {
  var ocorrencias = 0;
  var quantidade = url.length;

  for (var linha = 0; linha < matriz.length; linha++) {
    if (matriz[linha][index] > 0) {
      ocorrencias += 1;
    }
  }

  return Math.log(quantidade / ocorrencias);
}

/**
 * realiza a remoção de digitos, letras maiúsculas, expaços, tags html e stop words de um arquivo
 * @param item conteudo do arquivo
 */
function done(item) {
  var newString = String(item).replace(/\d+/g, "");

  const textoFino = normalize.normalizeText(newString);

  const testeSemHtml = stripHtml(textoFino).result;

  return sw.removeStopwords(testeSemHtml.split(" "), sw.ptbr);
}

/**
 * Realiza o calculo de similaridade dos cossenos de cada arquivo, os ordena de forma decrescente
 * e os retorna
 */

function similaridadeDoCosseno() {
  var vetorL2 = [];
  var vetorProdutoEscalar = [];

  var vetorCosseno = [];

  for (var linha = 0; linha < matriz.length; linha++) {
    vetorL2[linha] = calculaL2(linha);
    vetorProdutoEscalar[linha] = produtoEscalar(linha);
  }
  console.log("vetor produto ", vetorProdutoEscalar);

  var normaDaChave = vetorL2[vetorL2.length - 1];

  for (var i = 0; i < vetorL2.length - 1; i++) {
    vetorCosseno[i] = [i, vetorProdutoEscalar[i] / (normaDaChave * vetorL2[i])];
  }

  vetorCosseno.sort(compare);

  return vetorCosseno;
}
/**
 * utilizada de base para ordenação, de forma a ordenar decrescente
 * @param  a cosseno 1 a ser comparado
 * @param  b cosseno 2 a ser comparado
 */
function compare(a, b) {
  const first = a[1];
  const second = b[1];
  if (first > second) {
    return -1;
  } else {
    return 1;
  }
}
//inserir a chave de busca na tabela (fazer todo o processo de normalização), e colocar o valor 1 na chave que tiver

/**
 * norma L2 - eleva todos os valores da linha ao quadrado e soma, depois tira a raiz de tudo
 * @param linha arquivo a ser calculado
 */
function calculaL2(linha) {
  var soma = 0;
  for (var i = 0; i < matriz[linha].length; i++) {
    soma = soma + matriz[linha][i] * matriz[linha][i];
  }
  return Math.sqrt(soma);
}

/**
 * Realiza a operação de produto escalar entre os valores de um arquivo com a chave de busca
 * @param linha arquivo específico para obter seu produto escalar
 */
function produtoEscalar(linha) {
  var linhaDaChave = url.length;
  var soma = 0;
  for (var i = 0; i < matriz[linha].length; i++) {
    // console.log(
    //   "soma ",
    //   soma,
    //   " matriz linha ",
    //   matriz[linha][i],
    //   "matriz chave ",
    //   matriz[linhaDaChave][i]
    // );
    soma = soma + matriz[linha][i] * matriz[linhaDaChave][i];
  }
  return soma;
}
