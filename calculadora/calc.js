// Calculadora de bebidas do Minha Viagem (passo 4B do plano, Leonardo, 21/11/2026), no site desde 21/11/2026
// (minhaviagem.360cruzeiros.com.br/calculadora; ANTES ficava sozinha em minhaviagem-calculadora/ do projeto).
// Só a conta: nada de tela aqui. Roda no navegador (window.CalcBebidas) e no node (require) para os testes
// testes/minhaviagem_calculadora_21_11.test.js e testes/minhaviagem_calculadora_site_21_11.test.js.
// Preços avulsos = habilidade precos-bebidas-msc-costa-2026 (já com a taxa de 15%). Mudou a habilidade, mude aqui.
(function (raiz) {
  "use strict";

  // Itens da tela, na ordem. alcool: some quando o cliente diz que não bebe álcool.
  // FOCO (Leonardo, 21/11/2026: "se a pessoa está buscando preço mais barato ou bebidas de maior qualidade... só deixar
  // selecionar os drinks daquele pacote"): cerveja e drink separados pelo pacote que cobre cada um. O nome e o nível
  // (basico/premium) de cada item alcoólico mudam por companhia em CIAS[cia].itens (a long neck Corona é do Premium
  // Extra na MSC e do My Drinks na Costa). ANTES: um "Cerveja" (chope) e um "Drink da casa" só, sem separar por pacote.
  var ITENS = [
    { id: "refri", nome: "Refrigerante ou suco", alcool: false },
    { id: "agua", nome: "Água (garrafa)", alcool: false },
    { id: "cafe", nome: "Café especial ou cappuccino", alcool: false },
    { id: "cerveja", nome: "Chope", alcool: true },
    { id: "longneck", nome: "Cerveja long neck (Corona, Heineken...)", alcool: true },
    { id: "artesanal", nome: "Cerveja artesanal ou premium", alcool: true },
    { id: "vinho", nome: "Vinho da casa (taça)", alcool: true },
    { id: "drink", nome: "Drink clássico (caipirinha, mojito...)", alcool: true },
    { id: "premium", nome: "Drink premium ou destilado (whisky, gin...)", alcool: true },
  ];

  // O que a pessoa busca: "economia" (só o básico), "qualidade" (só o premium) ou "todos" (os dois, em blocos).
  var FOCOS = ["economia", "qualidade", "todos"];

  // Dia já preenchido = o MÍNIMO em que o pacote passa a valer a pena (Leonardo, 21/11/2026: "coloque que é o
  // mínimo que vale a pena para o pacote de bebidas"). Sem álcool: o exemplo da habilidade (MSC 6 refris + 3 águas
  // contra 205; Costa 5 refris + 3 águas contra 180). Com álcool: um dia comum que chega ao básico pela referência
  // (MSC 2 refris + 1 água + 2 cervejas + 2 drinks = 297 contra o Easy 285; Costa o mesmo com 3 drinks = 294
  // contra o My Drinks 270). Com 1 drink a menos, o pacote já não compensa (o teste confere).
  // Foco "qualidade" (21/11/2026): o mínimo em que o premium compensa (MSC 2 refris + 1 água + 5 drinks premium = 489
  // contra o Premium Extra 485; Costa o mesmo com 4 = 413 contra o My Drinks Plus 360; contas com a média das marcas, 21/11/2026). Com 1 a menos já não compensa.
  var DIA_MINIMO = {
    msc: {
      sem_alcool: { refri: 6, agua: 3, cafe: 0, cerveja: 0, longneck: 0, artesanal: 0, vinho: 0, drink: 0, premium: 0 },
      com_alcool: { refri: 2, agua: 1, cafe: 0, cerveja: 2, longneck: 0, artesanal: 0, vinho: 0, drink: 2, premium: 0 },
      qualidade: { refri: 2, agua: 1, cafe: 0, cerveja: 0, longneck: 0, artesanal: 0, vinho: 0, drink: 0, premium: 5 },
    },
    costa: {
      sem_alcool: { refri: 5, agua: 3, cafe: 0, cerveja: 0, longneck: 0, artesanal: 0, vinho: 0, drink: 0, premium: 0 },
      com_alcool: { refri: 2, agua: 1, cafe: 0, cerveja: 2, longneck: 0, artesanal: 0, vinho: 0, drink: 3, premium: 0 },
      qualidade: { refri: 2, agua: 1, cafe: 0, cerveja: 0, longneck: 0, artesanal: 0, vinho: 0, drink: 0, premium: 4 },
    },
  };
  // MSC e Costa lado a lado: o dia da MSC (a habilidade manda oferecer a MSC primeiro).
  // foco "qualidade" com álcool = o dia do premium; os outros focos = o dia do básico.
  function diaMinimo(cia, alcool, foco) {
    var t = DIA_MINIMO[cia] || DIA_MINIMO.msc;
    var d = !alcool ? t.sem_alcool : foco === "qualidade" ? t.qualidade : t.com_alcool;
    var c = {};
    Object.keys(d).forEach(function (k) { c[k] = d[k]; });
    return c;
  }

  // Preço avulso por item (R$, com 15%) e o que cada nível cobre. Número = limite por dia (água no My Drinks: 1 por dia).
  var CIAS = {
    msc: {
      nome: "MSC",
      // Avulso dos itens sem álcool aqui; o dos itens com álcool sai da média das marcas (MARCAS, embaixo).
      avulso: { refri: 26, agua: 17, cafe: 21 },
      // Nome na tela, o pacote mais simples que cobre o item e TODAS as marcas com o preço de cada uma (Leonardo,
      // 21/11/2026: "Tem que mostrar todas as marcas e todos os preços possíveis... O valor pode ser a média mesmo").
      // Preço com 15%, da habilidade precos-bebidas-msc-costa-2026 (Tabela de preços avulsos MSC). "ate" = teto.
      // ANTES: um nome com 2 ou 3 marcas de exemplo e um preço só.
      itens: {
        cerveja: { nome: "Chope", nivel: "basico", marcas: [{ nome: "Chope Stella", v: 48 }] },
        longneck: { nome: "Cerveja long neck", nivel: "premium", marcas: [{ nome: "Corona ou Heineken", v: 54 }] },
        artesanal: { nome: "Cerveja artesanal", nivel: "premium", marcas: [{ nome: "Cervejas artesanais", v: 72 }] },
        vinho: { nome: "Vinho ou espumante da casa (taça)", nivel: "basico", marcas: [{ nome: "Vinho ou espumante da casa", v: 48 }] },
        drink: { nome: "Drink clássico", nivel: "basico", marcas: [{ nome: "Caipirinha, Mojito, Piña Colada, Daiquiri, Margarita ou Cosmopolitan", v: 66 }] },
        premium: { nome: "Drink premium ou destilado", nivel: "premium", marcas: [
          { nome: "Mount Gay Coco Loco, Mai-Tai, Campari Negroni ou Long Island Iced Tea", v: 84, ate: true },
          { nome: "Whisky importado, Absolut, Grey Goose ou Tanqueray", v: 84, ate: true }] },
      },
      niveis: {
        sem_alcool: { pacote: "Não Alcoólico", cobre: { refri: true, agua: true, cafe: true } },
        basico: { pacote: "Easy", cobre: { refri: true, agua: true, cerveja: true, vinho: true, drink: true } },
        premium: { pacote: "Premium Extra", cobre: { refri: true, agua: true, cafe: true, cerveja: true, longneck: true, artesanal: true, vinho: true, drink: true, premium: true } },
      },
      // Referência por dia por adulto, quando o link não traz a saída (textos aprovados da habilidade).
      referenciaDia: { sem_alcool: 205, basico: 285, premium: 485 },
    },
    costa: {
      nome: "Costa",
      avulso: { refri: 27, agua: 15, cafe: 15 },
      // Tabela de preços avulsos Costa da habilidade. Média das marcas na conta: drink clássico 55 (ANTES 54, só a
      // caipirinha), drink premium 86 (de 81 a 90; ANTES 81), vinho 44 (taça 42, espumante 45; ANTES 42).
      itens: {
        cerveja: { nome: "Chope", nivel: "basico", marcas: [{ nome: "Chope", v: 30 }] },
        longneck: { nome: "Cerveja long neck", nivel: "basico", marcas: [{ nome: "Carlsberg, Corona ou Beck's", v: 39 }] },
        artesanal: { nome: "Cerveja premium", nivel: "premium", marcas: [{ nome: "Weissbier", v: 47 }] },
        vinho: { nome: "Vinho ou espumante (taça)", nivel: "basico", marcas: [{ nome: "Vinho (taça)", v: 42 }, { nome: "Espumante (taça)", v: 45 }] },
        drink: { nome: "Drink clássico", nivel: "basico", marcas: [
          { nome: "Bellini ou Rossini", v: 42 },
          { nome: "Caipirinha, Caipirosca, Martini, Aperol Spritz ou Campari Spritz", v: 54 },
          { nome: "Cuba Libre ou Gin Tônica", v: 57 },
          { nome: "Marguerita ou Piña Colada", v: 66 }] },
        premium: { nome: "Drink premium ou destilado", nivel: "premium", marcas: [
          { nome: "Gin tônica Hendrick's ou Tanqueray Nº10", de: 81, v: 90 }] },
      },
      niveis: {
        sem_alcool: { pacote: "My Soft Drinks", cobre: { refri: true, agua: true, cafe: true } },
        basico: { pacote: "My Drinks", cobre: { refri: true, agua: 1, cafe: true, cerveja: true, longneck: true, vinho: true, drink: true } },
        premium: { pacote: "My Drinks Plus", cobre: { refri: true, agua: true, cafe: true, cerveja: true, longneck: true, artesanal: true, vinho: true, drink: true, premium: true } },
      },
      referenciaDia: { sem_alcool: 180, basico: 270, premium: 360 },
    },
  };

  // Preço de cada marca (a faixa "de 81 a 90" conta pelo meio) e o avulso do item = média das marcas, arredondada.
  // Mudou um preço na habilidade precos-bebidas-msc-costa-2026: mude a marca aqui e a conta acompanha sozinha.
  function precoMarca(m) { return isFinite(m.de) ? (m.de + m.v) / 2 : m.v; }
  function mediaMarcas(marcas) {
    var t = 0;
    marcas.forEach(function (m) { t += precoMarca(m); });
    return Math.round(t / marcas.length);
  }
  Object.keys(CIAS).forEach(function (c) {
    Object.keys(CIAS[c].itens).forEach(function (id) { CIAS[c].avulso[id] = mediaMarcas(CIAS[c].itens[id].marcas); });
  });

  var NIVEIS = ["sem_pacote", "sem_alcool", "basico", "premium"];
  var FAIXA = 0.35; // regra dos 35% (venda consultiva)

  // Itens que aparecem para o foco, nas companhias da tela. Sem álcool: sempre. "economia": os do básico (de pelo
  // menos uma das companhias); "qualidade": os do premium (idem); "todos" ou sem foco: todos. Cada item leva o nível
  // em cada companhia (nivelPor) e, com uma companhia só, o nome dela (marcas).
  function itensDoFoco(cias, foco) {
    return ITENS.filter(function (it) {
      if (!it.alcool || foco !== "economia" && foco !== "qualidade") return true;
      var alvo = foco === "qualidade" ? "premium" : "basico";
      return cias.some(function (c) { return CIAS[c].itens[it.id].nivel === alvo; });
    }).map(function (it) {
      var por = {};
      if (it.alcool) cias.forEach(function (c) { por[c] = CIAS[c].itens[it.id].nivel; });
      var uma = it.alcool && cias.length === 1 ? CIAS[cias[0]].itens[it.id] : null;
      return { id: it.id, alcool: it.alcool, nome: uma ? uma.nome : it.nome, marcas: uma ? uma.marcas : [], nivelPor: por };
    });
  }

  // Bloco do item no foco "todos": "basico" (no básico de todas as companhias da tela), "premium" (só no premium
  // delas) ou "muda" (básico numa, premium na outra: a long neck). Sem álcool = null.
  function blocoDoItem(item) {
    var ns = Object.keys(item.nivelPor || {}).map(function (c) { return item.nivelPor[c]; });
    if (!ns.length) return null;
    if (ns.every(function (n) { return n === "basico"; })) return "basico";
    if (ns.every(function (n) { return n === "premium"; })) return "premium";
    return "muda";
  }

  // Pacotes comparados por foco: "economia" = só o básico; "qualidade" = só o premium; "todos" ou sem foco = os três.
  function niveisDoFoco(foco) {
    if (foco === "economia") return ["basico"];
    if (foco === "qualidade") return ["premium"];
    return ["sem_alcool", "basico", "premium"];
  }

  // Consumo só com os itens que a tela mostra (o que sumiu da lista não entra na conta).
  function soDoFoco(consumo, cias, foco) {
    var vis = {}, c = {};
    itensDoFoco(cias, foco).forEach(function (it) { vis[it.id] = true; });
    ITENS.forEach(function (it) { c[it.id] = vis[it.id] ? consumo[it.id] || 0 : 0; });
    return c;
  }

  // Noites que já vêm da pesquisa salva no site (Leonardo, 21/11/2026: "já vim como padrão o que ela escolheu", com a
  // possibilidade de alterar). A pesquisa guarda a duração (t), não a noite exata: "mini" (3 e 4 noites) = 3 e "longo"
  // (5 ou mais) = 7, as durações mais comuns no arquivo do dia (21/11/2026: 49 saídas de 3 noites contra 29 de 4; 71 de
  // 7 contra 6 das outras longas). "todos" ou sem pesquisa = null (a tela usa 4, como antes).
  function noitesDaPesquisa(t) {
    return t === "mini" ? 3 : t === "longo" ? 7 : null;
  }

  // Foco que já vem da pesquisa (b do link ou da pesquisa guardada): basico = economia, premium = qualidade.
  function focoDaPesquisa(b) {
    return b === "basico" ? "economia" : b === "premium" ? "qualidade" : null;
  }

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

    // niveis (opcional): só os pacotes do foco (niveisDoFoco). Sem: os três.
    var lista = entrada.niveis && entrada.niveis.length ? entrada.niveis : ["sem_alcool", "basico", "premium"];
    var pacotes = lista.map(function (nivel) {
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
      // Pacote da pesquisa (b=basico|premium): a pergunta do foco já vem marcada (21/11/2026). Outro valor = vazio.
      b: p.b === "basico" || p.b === "premium" ? p.b : "",
      // WhatsApp do contato no link (w), o mesmo da página (mv.js): só os dígitos; "{{...}}" não trocado = vazio.
      // Quem confere o número é o MV.conferirWhats na tela. (Leonardo, 21/11/2026: o WhatsApp vem no link, a
      // calculadora não pede de novo.) ANTES: a calculadora não lia o w e pedia o WhatsApp num formulário.
      whats: /^\{\{.*\}\}$/.test(String(p.w || "")) ? "" : String(p.w || "").replace(/\D/g, "").slice(0, 15),
    };
  }

  var api = { ITENS: ITENS, FOCOS: FOCOS, itensDoFoco: itensDoFoco, blocoDoItem: blocoDoItem, niveisDoFoco: niveisDoFoco,
    soDoFoco: soDoFoco, precoMarca: precoMarca, mediaMarcas: mediaMarcas, focoDaPesquisa: focoDaPesquisa, noitesDaPesquisa: noitesDaPesquisa, DIA_MINIMO: DIA_MINIMO, diaMinimo: diaMinimo, CIAS: CIAS, NIVEIS: NIVEIS, FAIXA: FAIXA,
    avulsoDia: avulsoDia, precoPacote: precoPacote, calcular: calcular, decidir: decidir,
    nivelDasDuas: nivelDasDuas, NIVEL_PARA_B: NIVEL_PARA_B, montarEnvio: montarEnvio, saidaDoDia: saidaDoDia, lerLink: lerLink };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.CalcBebidas = api;
})(this);
