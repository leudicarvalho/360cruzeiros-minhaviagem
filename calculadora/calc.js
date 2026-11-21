// Calculadora de bebidas do Minha Viagem (passo 4B do plano, Leonardo, 21/11/2026), no site desde 21/11/2026
// (minhaviagem.360cruzeiros.com.br/calculadora; ANTES ficava sozinha em minhaviagem-calculadora/ do projeto).
// Só a conta: nada de tela aqui. Roda no navegador (window.CalcBebidas) e no node (require) para os testes
// testes/minhaviagem_calculadora_21_11.test.js e testes/minhaviagem_calculadora_site_21_11.test.js.
// Preços avulsos = habilidade precos-bebidas-msc-costa-2026 (já com a taxa de 15%). Mudou a habilidade, mude aqui.
(function (raiz) {
  "use strict";

  // Itens da tela, na ordem. alcool: some quando o cliente diz que não bebe álcool.
  var ITENS = [
    { id: "refri", nome: "Refrigerante ou suco", alcool: false },
    { id: "agua", nome: "Água (garrafa)", alcool: false },
    { id: "cafe", nome: "Café especial ou cappuccino", alcool: false },
    { id: "cerveja", nome: "Cerveja", alcool: true },
    { id: "vinho", nome: "Vinho (taça)", alcool: true },
    { id: "drink", nome: "Drink da casa (caipirinha, mojito...)", alcool: true },
    { id: "premium", nome: "Drink premium ou destilado (whisky, gin...)", alcool: true },
  ];

  // Dia já preenchido = o MÍNIMO em que o pacote passa a valer a pena (Leonardo, 21/11/2026: "coloque que é o
  // mínimo que vale a pena para o pacote de bebidas"). Sem álcool: o exemplo da habilidade (MSC 6 refris + 3 águas
  // contra 205; Costa 5 refris + 3 águas contra 180). Com álcool: um dia comum que chega ao básico pela referência
  // (MSC 2 refris + 1 água + 2 cervejas + 2 drinks = 297 contra o Easy 285; Costa o mesmo com 3 drinks = 291
  // contra o My Drinks 270). Com 1 drink a menos, o pacote já não compensa (o teste confere).
  var DIA_MINIMO = {
    msc: {
      sem_alcool: { refri: 6, agua: 3, cafe: 0, cerveja: 0, vinho: 0, drink: 0, premium: 0 },
      com_alcool: { refri: 2, agua: 1, cafe: 0, cerveja: 2, vinho: 0, drink: 2, premium: 0 },
    },
    costa: {
      sem_alcool: { refri: 5, agua: 3, cafe: 0, cerveja: 0, vinho: 0, drink: 0, premium: 0 },
      com_alcool: { refri: 2, agua: 1, cafe: 0, cerveja: 2, vinho: 0, drink: 3, premium: 0 },
    },
  };
  // MSC e Costa lado a lado: o dia da MSC (a habilidade manda oferecer a MSC primeiro).
  function diaMinimo(cia, alcool) {
    var d = (DIA_MINIMO[cia] || DIA_MINIMO.msc)[alcool ? "com_alcool" : "sem_alcool"];
    var c = {};
    Object.keys(d).forEach(function (k) { c[k] = d[k]; });
    return c;
  }

  // Preço avulso por item (R$, com 15%) e o que cada nível cobre. Número = limite por dia (água no My Drinks: 1 por dia).
  var CIAS = {
    msc: {
      nome: "MSC",
      avulso: { refri: 26, agua: 17, cafe: 21, cerveja: 48, vinho: 48, drink: 66, premium: 84 },
      niveis: {
        sem_alcool: { pacote: "Não Alcoólico", cobre: { refri: true, agua: true, cafe: true } },
        basico: { pacote: "Easy", cobre: { refri: true, agua: true, cerveja: true, vinho: true, drink: true } },
        premium: { pacote: "Premium Extra", cobre: { refri: true, agua: true, cafe: true, cerveja: true, vinho: true, drink: true, premium: true } },
      },
      // Referência por dia por adulto, quando o link não traz a saída (textos aprovados da habilidade).
      referenciaDia: { sem_alcool: 205, basico: 285, premium: 485 },
    },
    costa: {
      nome: "Costa",
      avulso: { refri: 27, agua: 15, cafe: 15, cerveja: 30, vinho: 42, drink: 54, premium: 81 },
      niveis: {
        sem_alcool: { pacote: "My Soft Drinks", cobre: { refri: true, agua: true, cafe: true } },
        basico: { pacote: "My Drinks", cobre: { refri: true, agua: 1, cafe: true, cerveja: true, vinho: true, drink: true } },
        premium: { pacote: "My Drinks Plus", cobre: { refri: true, agua: true, cafe: true, cerveja: true, vinho: true, drink: true, premium: true } },
      },
      referenciaDia: { sem_alcool: 180, basico: 270, premium: 360 },
    },
  };

  var NIVEIS = ["sem_pacote", "sem_alcool", "basico", "premium"];
  var FAIXA = 0.35; // regra dos 35% (venda consultiva)

  function inteiro(v, min, max, padrao) {
    var n = parseInt(v, 10);
    if (!isFinite(n)) return padrao;
    return Math.min(max, Math.max(min, n));
  }

  // Avulso de UM adulto por dia; com "nivel", só o que esse pacote não cobre.
  function avulsoDia(cia, consumo, nivel) {
    var c = CIAS[cia], cobre = nivel ? c.niveis[nivel].cobre : {}, total = 0;
    ITENS.forEach(function (it) {
      var q = inteiro(consumo[it.id], 0, 50, 0), cob = cobre[it.id];
      var fora = cob === true ? 0 : typeof cob === "number" ? Math.max(0, q - cob) : q;
      total += fora * c.avulso[it.id];
    });
    return total;
  }

  // Preço do pacote por adulto na viagem: o da saída (arquivo do dia) ou a referência × noites.
  function precoPacote(cia, nivel, noites, pacotesSaida) {
    var nome = CIAS[cia].niveis[nivel].pacote;
    if (pacotesSaida && pacotesSaida[nome] && isFinite(pacotesSaida[nome].valor)) return { valor: pacotesSaida[nome].valor, fonte: "saida" };
    return { valor: CIAS[cia].referenciaDia[nivel] * noites, fonte: "referencia" };
  }

  // entrada: { cia, noites, adultos, perfis: [{ consumo, pessoas }], pacotesSaida }
  // perfis: um só quando todos bebem igual; senão o do cliente (1 pessoa) e o dos outros adultos.
  function calcular(entrada) {
    var cia = entrada.cia;
    if (!CIAS[cia]) throw new Error("companhia desconhecida: " + cia);
    var noites = inteiro(entrada.noites, 1, 30, 4);
    var adultos = inteiro(entrada.adultos, 1, 4, 2);
    var perfis = entrada.perfis && entrada.perfis.length ? entrada.perfis : [{ consumo: diaMinimo(cia, true), pessoas: adultos }];

    var avulsoViagem = 0;
    perfis.forEach(function (p) { avulsoViagem += avulsoDia(cia, p.consumo, null) * noites * p.pessoas; });

    var pacotes = ["sem_alcool", "basico", "premium"].map(function (nivel) {
      var preco = precoPacote(cia, nivel, noites, entrada.pacotesSaida);
      var foraViagem = 0;
      perfis.forEach(function (p) { foraViagem += avulsoDia(cia, p.consumo, nivel) * noites * p.pessoas; });
      var total = preco.valor * adultos + foraViagem;
      return { nivel: nivel, pacote: CIAS[cia].niveis[nivel].pacote, porAdulto: preco.valor, fonte: preco.fonte, foraDoPacote: foraViagem, total: total };
    });

    // O pacote mais em conta para o que ele bebe (empate: o mais simples).
    var melhor = pacotes.reduce(function (a, b) { return b.total < a.total ? b : a; });
    var diferenca = melhor.total - avulsoViagem; // > 0: o pacote custa mais
    var faixa;
    if (diferenca <= 0) faixa = "pacote";
    else if (avulsoViagem > 0 && melhor.total <= avulsoViagem * (1 + FAIXA)) faixa = "considerar";
    else faixa = "sem_pacote";

    return {
      cia: cia, noites: noites, adultos: adultos,
      avulsoViagem: avulsoViagem,
      avulsoDiaPessoa: avulsoViagem / (noites * adultos),
      pacotes: pacotes,
      melhor: melhor,
      faixa: faixa,
      // pacote: economia com o pacote; sem_pacote: economia sem pacote; considerar: quanto a mais custa.
      valor: Math.abs(diferenca),
      aMaisPorDiaPessoa: diferenca > 0 ? diferenca / (noites * adultos) : 0,
      nivel: faixa === "pacote" ? melhor.nivel : faixa === "sem_pacote" ? "sem_pacote" : null,
    };
  }

  // Faixa dos 35%: a resposta da pergunta decide. "sem_preocupar" → o pacote; "controlar" → ele escolhe entre os dois.
  function decidir(resultado, preferencia) {
    if (resultado.faixa !== "considerar") return resultado.nivel;
    if (preferencia === "sem_preocupar") return resultado.melhor.nivel;
    return null; // "controlar": a tela mostra os dois lado a lado e o cliente escolhe
  }

  // MSC e Costa lado a lado (companhia fora do link): um nível só para a pesquisa. Iguais = esse;
  // diferentes = vale o da MSC (a habilidade manda oferecer a MSC primeiro). PARA APROVAR.
  function nivelDasDuas(nivelMsc, nivelCosta) {
    if (nivelMsc && nivelCosta && nivelMsc === nivelCosta) return nivelMsc;
    return nivelMsc || nivelCosta || null;
  }

  // Nível da calculadora -> valor do campo mv_bebidas (lista do passo 4: sem, soft, basico, premium).
  var NIVEL_PARA_B = { sem_pacote: "sem", sem_alcool: "soft", basico: "basico", premium: "premium" };

  // Corpo do POST ao webhook 54 "pacote calculado (calculadora)" (docs/ideias/minha-viagem-4.md, seção 2):
  // { telefone: "+55...", id: <código do link>, b: sem|soft|basico|premium, hp: honeypot }. Nada além disso.
  // telefone = "55" + DDD + número (o que MV.conferirWhats devolve). ANTES (calculadora fora do site): montava
  // { codigo, mv_bebidas, companhia, pacote, origem, site } e não enviava.
  function montarEnvio(telefone, codigo, nivel, hp) {
    if (!NIVEL_PARA_B[nivel]) throw new Error("nível inválido: " + nivel);
    var tel = String(telefone || "").replace(/\D/g, "");
    if (!/^55\d{10,11}$/.test(tel)) throw new Error("telefone inválido");
    var cod = String(codigo || "");
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(cod)) throw new Error("sem código do contato");
    return { telefone: "+" + tel, id: cod, b: NIVEL_PARA_B[nivel], hp: String(hp || "") };
  }

  // Pacotes da saída no arquivo do dia do site (dados/precos.json, gerado por minhaviagem/gerar_dados.py):
  // saidas[] = { id, cia: "MSC"|"Costa", noites, pacotes: { soft|basico|premium: { nome, v (por adulto), lidoEm } } }.
  // Devolve { cia, noites, navio, embarque, pacotes: { <nome do pacote>: { valor, lidoEm } } } ou null.
  function saidaDoDia(precos, id) {
    if (!precos || !precos.saidas || !id) return null;
    var lista = Array.isArray(precos.saidas) ? precos.saidas : Object.keys(precos.saidas).map(function (k) { return Object.assign({ id: k }, precos.saidas[k]); });
    var s = null;
    lista.forEach(function (x) { if (x && x.id === id) s = x; });
    if (!s) return null;
    var cia = String(s.cia || "").toLowerCase();
    if (!CIAS[cia]) return null;
    var pacotes = {};
    Object.keys(s.pacotes || {}).forEach(function (k) {
      var p = s.pacotes[k];
      if (p && p.nome && isFinite(p.v) && p.v > 0) pacotes[p.nome] = { valor: Number(p.v), lidoEm: p.lidoEm || "" };
    });
    return { cia: cia, noites: s.noites, navio: s.navio || "", embarque: s.embarque || "", pacotes: pacotes };
  }

  // Leitura do link: ?c=<código>&cia=msc|costa&noites=N&adultos=N&saida=<id do arquivo do dia>
  // O código também vale como "id" (é assim que as mensagens do Entur mandam: /calculadora?id=<código>).
  function lerLink(busca) {
    var p = {};
    String(busca || "").replace(/^\?/, "").split("&").forEach(function (par) {
      if (!par) return;
      var i = par.indexOf("="), k = decodeURIComponent(i < 0 ? par : par.slice(0, i)), v = i < 0 ? "" : decodeURIComponent(par.slice(i + 1).replace(/\+/g, " "));
      p[k] = v;
    });
    var cia = String(p.cia || "").toLowerCase();
    return {
      // código fora do formato (ex.: "{{contact.id}}" que o Entur não trocou) = sem código, como na página (mv.js).
      // ANTES: limpava os caracteres e "{{contact.id}}" virava o código "contactid".
      codigo: /^[A-Za-z0-9_-]{1,40}$/.test(String(p.c || p.id || "")) ? String(p.c || p.id) : "",
      cia: cia === "msc" || cia === "costa" ? cia : "",
      noites: p.noites ? inteiro(p.noites, 1, 30, null) : null,
      adultos: p.adultos ? inteiro(p.adultos, 1, 4, null) : null,
      saida: String(p.saida || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60),
    };
  }

  var api = { ITENS: ITENS, DIA_MINIMO: DIA_MINIMO, diaMinimo: diaMinimo, CIAS: CIAS, NIVEIS: NIVEIS, FAIXA: FAIXA,
    avulsoDia: avulsoDia, precoPacote: precoPacote, calcular: calcular, decidir: decidir,
    nivelDasDuas: nivelDasDuas, NIVEL_PARA_B: NIVEL_PARA_B, montarEnvio: montarEnvio, saidaDoDia: saidaDoDia, lerLink: lerLink };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.CalcBebidas = api;
})(this);
