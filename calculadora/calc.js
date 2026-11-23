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

  // O que a pessoa busca: "economia" (só o básico) ou "qualidade" (só o premium). "todos" (os dois, em blocos) saiu da
  // tela em 21/11/2026 (Leonardo: "sempre vai ser um ou outro"); fica aqui só para link e teste antigos.
  var FOCOS = ["economia", "qualidade", "todos"];

  // Dia já preenchido = o MÍNIMO em que o pacote passa a valer a pena (Leonardo, 21/11/2026: "coloque que é o
  // mínimo que vale a pena para o pacote de bebidas"). Sem álcool: o exemplo da habilidade (MSC 6 refris + 3 águas
  // contra 205; Costa 5 refris + 3 águas contra 180). Com álcool: um dia comum que chega ao básico pela referência
  // (MSC 2 refris + 1 água + 2 cervejas + 2 drinks = 295 contra o Easy 285; 297 até 22/11, chope 48; Costa o mesmo com 3 drinks = 294
  // contra o My Drinks 270). Com 1 drink a menos, o pacote já não compensa (o teste confere).
  // Foco "qualidade" (21/11/2026): o mínimo em que o premium compensa (MSC 2 refris + 1 água + 6 drinks premium = 543
  // contra o Premium Extra 485, com 5 = 464; 22/11/2026: média do premium caiu de 84 para 79 com o cardápio oficial, ANTES 5 drinks = 489; Costa o mesmo com 4 = 413 contra o My Drinks Plus 360; contas com a média das marcas, 21/11/2026). Com 1 a menos já não compensa.
  // DIA JÁ PREENCHIDO = O MÍNIMO PARA O PACOTE DAQUELA SAÍDA VALER A PENA (Leonardo, 22/11/2026: "O objetivo geral de
  // colocar as bebidas default era ficar o mínimo possível para valer a pena o pacote de bebidas. Está extrapolando muito";
  // "não coloque tudo em doses. Pode colocar cerveja, tem que variar"). O dia é montado na hora contra a diária REAL do
  // pacote (o da saída no arquivo do dia, ou a referência sem saída): vai pondo as bebidas na ordem de SEQ (variada:
  // refri, cerveja, drink, água...) até passar da diária e depois tira a mais cara que ainda deixa acima, até nenhuma poder
  // sair. Resultado: poucos reais acima da diária e, tirando QUALQUER bebida, o pacote já não compensa.
  // "<item>_<n>" = a n-ª marca de CIAS[cia].itens[item].
  // ANTES: tabela fixa contra a referência (MSC Easy 285, Premium Extra 485), mas os pacotes da MSC no site custam bem
  // menos (22/11/2026: Easy 208 a 256 por dia, Premium Extra 259 a 448, Não Alcoólico 161 a 205), e o dia ficava muito
  // acima do pacote (ex.: 492 contra 287).
  var SEQ = {
    msc: {
      sem_alcool: ["refri", "agua", "refri", "cafe"],
      basico: ["refri", "cerveja_0", "drink_0", "agua", "cerveja_1", "drink_0", "vinho_0", "refri"],
      premium: ["refri", "longneck_1", "premium_2", "agua", "premium_4", "longneck_2", "artesanal_0", "cafe", "premium_1", "refri"],
    },
    costa: {
      sem_alcool: ["refri", "agua", "refri", "cafe"],
      basico: ["refri", "cerveja_0", "drink_1", "agua", "vinho_0", "drink_2", "longneck_0", "refri"],
      premium: ["refri", "artesanal_0", "premium_0", "agua", "cafe", "artesanal_0", "refri", "premium_0"],
    },
  };
  // Dólar dos preços avulsos (habilidade precos-bebidas-msc-costa-2026: "US$ x 1,15 x câmbio", câmbio de referência
  // R$ 5,20, setembro/2026). Mudou o câmbio na habilidade, mude aqui e os preços avulsos (22/11/2026, Leonardo: "temos
  // que ter quanto o dólar foi baseado. Isso é bem importante").
  var CAMBIO = { valor: 5.20, quando: "setembro/2026" };

  // CRIANÇAS (Leonardo, 22/11/2026: "Pode fazer"; preços da conversa da pesquisa geral, teste na API do Visual Tour em
  // 22/11/2026, docs/monitoramento/PARA-PLANO-AUDITORIA.md "Resposta: crianças nos pacotes de bebida"): de 2 a 17 anos
  // a criança paga um valor FIXO por dia, o mesmo com qualquer pacote do adulto (com alcoólico ela cai no de menores);
  // até 1 ano não paga. MSC "Não Alcoólico para Menores" R$ 109/dia (sem o desconto do adulto); Costa "My Drinks Young"
  // R$ 177/dia (igual no Soft, no Drinks e no Plus). Sempre tem um maior na cabine (Leonardo: adolescente sozinho não existe).
  var CRIANCA = {
    msc: { dia: 109, pacote: "Não Alcoólico para Menores" },
    costa: { dia: 177, pacote: "My Drinks Young (menores de 18)" },
  };
  // Dia já preenchido da criança = o mínimo em que o pacote de menores vale a pena, montado como o do adulto (montarDia)
  // contra a diária de menores (CRIANCA). ANTES (até 22/11/2026): tabela fixa (MSC 3 refris + 2 águas, Costa 5 + 3).
  function diaMinimoCrianca(cia) {
    var c = CIAS[cia] ? cia : "msc";
    return montarDia(c, "sem_alcool", CRIANCA[c].dia);
  }

  // Preço de uma chave do consumo ("refri" ou "longneck_1").
  function precoChave(cia, k) {
    var m = /^(.+)_(\d+)$/.exec(k), c = CIAS[cia];
    return m ? centavos(precoMarca(c.itens[m[1]].marcas[+m[2]])) : c.avulso[k];
  }
  // Monta o dia contra a diária "alvo" (SEQ e a regra no topo).
  function montarDia(cia, tipo, alvo) {
    var seq = SEQ[cia][tipo], d = {}, total = 0, i = 0;
    while (total < alvo && i < 300) { var k = seq[i % seq.length]; d[k] = (d[k] || 0) + 1; total += precoChave(cia, k); i++; }
    for (;;) {
      var sai = null;
      Object.keys(d).forEach(function (k) {
        if (d[k] > 0 && total - precoChave(cia, k) >= alvo && (!sai || precoChave(cia, k) > precoChave(cia, sai))) sai = k;
      });
      if (!sai) break;
      d[sai]--; total -= precoChave(cia, sai);
    }
    var c = {};
    ITENS.forEach(function (it) { c[it.id] = 0; });
    Object.keys(d).forEach(function (k) { c[k] = d[k]; });
    return comMarcas(cia, c);
  }
  // Dia já preenchido do adulto: sem álcool contra o pacote sem álcool; foco "qualidade" contra o premium; os outros
  // contra o básico. pacotesSaida e noites: os da saída (diária = valor da viagem / noites); sem eles, a referência.
  function diaMinimo(cia, alcool, foco, pacotesSaida, noites) {
    var c = CIAS[cia] ? cia : "msc";
    var nivel = !alcool ? "sem_alcool" : foco === "qualidade" ? "premium" : "basico";
    var n = noites > 0 ? noites : 1;
    var alvo = Math.ceil(precoPacote(c, nivel, n, pacotesSaida).valor / n);
    return montarDia(c, nivel, alvo);
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
        // Cardápio oficial MSC Brasil 25/26 (docs/bebidas/PRECOS-AVULSOS.md; Leonardo, 22/11/2026: "pode deixar o Shop e a
        // Amstel em lata" no Easy). ANTES: chope só Stella 48; long neck "Corona ou Heineken" 54.
        cerveja: { nome: "Chope ou Amstel em lata", nivel: "basico", padrao: 0, marcas: [{ nome: "Chope Stella", v: 48 }, { nome: "Amstel em lata", v: 45 }] },
        longneck: { nome: "Cerveja long neck ou lata", nivel: "premium", padrao: 1, marcas: [
          { nome: "Brahma", v: 39 }, { nome: "Heineken, Budweiser ou Stella", v: 45 }, { nome: "Corona", v: 51 }] },
        artesanal: { nome: "Cerveja artesanal", nivel: "premium", marcas: [{ nome: "Cervejas artesanais", v: 72 }] },
        vinho: { nome: "Vinho ou espumante da casa (taça)", nivel: "basico", marcas: [{ nome: "Vinho ou espumante da casa", v: 48 }] },
        drink: { nome: "Drink clássico", nivel: "basico", marcas: [{ nome: "Caipirinha, Mojito, Piña Colada, Daiquiri, Margarita ou Cosmopolitan", v: 66 }] },
        // Uma linha só, mesmo preço (Leonardo, 21/11/2026: "até 84 aparece 2 vezes. Tem que ficar uma só").
        // ANTES: 2 linhas (drinks / destilados), cada uma com "até R$ 84".
        // Preços diferenciados pelo cardápio oficial (Leonardo, 22/11/2026: "trocar e diferenciar os preços").
        // ANTES: uma marca só, "até R$ 84" (teto do Premium Extra).
        premium: { nome: "Drink premium ou destilado", nivel: "premium", padrao: 1, marcas: [
          // Doses (40 ml) separadas por preço, do cardápio oficial, em ordem de preço (Leonardo, 22/11/2026: "Não pode ficar
          // desse jeito, dois valores, 54 a 96. Tem que separar"). Mesmo preço numa linha só (regra de 21/11): o coquetel
          // premium e as doses de R$ 96 dividem a linha. ANTES: "Dose de whisky, vodka, gin, rum ou tequila" de 54 a 96.
          { nome: "Dose de cachaça Sagatiba, Aperol, Campari ou Martini", v: 54 },
          { nome: "Dose de Absolut, Beefeater, Bacardi, Jack Daniel's, Jameson ou Johnnie Walker Red", v: 60 },
          { nome: "Campari Negroni, Aperol Spritz ou Long Island Iced Tea", v: 66 },
          { nome: "Dose de tequila Espolòn, rum Mount Gay ou Jack Daniel's Honey", v: 72 },
          { nome: "Dose de Johnnie Walker Black, Chivas 12, Grey Goose, Belvedere ou Bombay Sapphire", v: 78 },
          { nome: "Dose de Hendrick's, Gin Mare, Malfy, Brugal 1888 ou Rémy Martin", v: 84 },
          { nome: "Coquetel premium (Mount Gay Coco Loco, Mai-Tai Brugal 1888, Hendrick's ou Grey Goose Martini) ou dose de Patrón, Glenlivet, Woodford Reserve ou Hennessy", v: 96 }] },
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
      // Água 18,58 = o mesmo por garrafa do Pacote de Água (13 de 500 ml, R$ 241,50), para o avulso não ficar mais barato
      // (Leonardo, 23/11/2026: "Deixa a garrafa também no mesmo preço do pacote"). ANTES: 15 (fonte única, vídeo). Conta: R$ 19.
      avulso: { refri: 27, agua: 18.58, cafe: 15 },
      // Tabela de preços avulsos Costa da habilidade. Média das marcas na conta: drink clássico 55 (ANTES 54, só a
      // caipirinha), drink premium 86 (de 81 a 90; ANTES 81), vinho 44 (taça 42, espumante 45; ANTES 42).
      itens: {
        // Chope 32,32 = o mesmo por unidade do Pacote de Cerveja (20 chopes R$ 646,30), até ter o preço certo
        // (Leonardo, 23/11/2026: "deixar igual até eu ter bem certo quanto vai ser o chopp"). ANTES: 30 (fonte única, vídeo).
        // A conta arredonda: R$ 32 por chope.
        cerveja: { nome: "Chope", nivel: "basico", marcas: [{ nome: "Chope", v: 32.32 }] },
        longneck: { nome: "Cerveja long neck", nivel: "basico", marcas: [{ nome: "Carlsberg, Corona ou Beck's", v: 39 }] },
        artesanal: { nome: "Cerveja premium", nivel: "premium", marcas: [{ nome: "Weissbier", v: 47 }] },
        vinho: { nome: "Vinho ou espumante (taça)", nivel: "basico", padrao: 0, marcas: [{ nome: "Vinho (taça)", v: 42 }, { nome: "Espumante (taça)", v: 45 }] },
        drink: { nome: "Drink clássico", nivel: "basico", padrao: 1, marcas: [
          { nome: "Bellini ou Rossini", v: 42 },
          { nome: "Caipirinha, Caipirosca, Martini, Aperol Spritz ou Campari Spritz", v: 54 },
          { nome: "Cuba Libre ou Gin Tônica", v: 57 },
          { nome: "Marguerita ou Piña Colada", v: 66 }] },
        premium: { nome: "Drink premium ou destilado", nivel: "premium", marcas: [
          { nome: "Gin tônica Hendrick's ou Tanqueray Nº10", ate: true, v: 90 }] },
        // Um valor só (Leonardo, 22/11/2026: "Não pode ficar desse jeito, dois valores"): a habilidade dá 81 a 90 sem dizer
        // qual gin custa quanto, então fica o teto "até R$ 90" e a conta usa 90. ANTES: "R$ 81 a R$ 90", conta pelo meio.
      },
      niveis: {
        sem_alcool: { pacote: "My Soft Drinks", cobre: { refri: true, agua: true, cafe: true } },
        basico: { pacote: "My Drinks", cobre: { refri: true, agua: 1, cafe: true, cerveja: true, longneck: true, vinho: true, drink: true } },
        premium: { pacote: "My Drinks Plus", cobre: { refri: true, agua: true, cafe: true, cerveja: true, longneck: true, artesanal: true, vinho: true, drink: true, premium: true } },
      },
      referenciaDia: { sem_alcool: 180, basico: 270, premium: 360 },
      // PACOTE PARA DIVIDIR (Leonardo, 23/11/2026: "Pode programar"): os pacotes de quantidade fixa da habilidade ("Outras
      // opções Costa"), preço fixo por reserva, sem mudar com as noites. São por pessoa e quem compra pode dar as bebidas para
      // quem quiser (já estão pagas); o pacote por dia é de todos os adultos da cabine e vale só para quem está na cabine.
      // Por isso a conta junta o consumo da cabine toda na viagem. Um pacote de cada (comprar 2 iguais não está confirmado).
      // unidade = [singular, plural, "o"|"a" para o "pago(s)/paga(s)"]. Um grupo = um item da tela; vale o maior pacote que o consumo enche (Amplo antes do Médio). Vinho fica para depois.
      fixos: [
        { item: "cerveja", unidade: ["chope", "chopes", "o"], pacotes: [{ nome: "Pacote de Cerveja", qtd: 20, valor: 646.30 }] },
        { item: "agua", unidade: ["garrafa de água", "garrafas de água", "a"], pacotes: [{ nome: "Pacote de Água", qtd: 13, valor: 241.50 }] },
        { item: "refri", unidade: ["bebida sem álcool", "bebidas sem álcool", "a"], pacotes: [
          { nome: "Pacote Boys & Girls Amplo", qtd: 40, valor: 922.30 }, { nome: "Pacote Boys & Girls Médio", qtd: 20, valor: 518.65 }] },
      ],
    },
  };

  // CONTADOR POR MARCA (Leonardo, 22/11/2026: "Sempre que tiver variantes, vai ter que ter algo para selecionar quantas a
  // pessoa quer incluir... o valor default... para incluir só uma das marcas"). Cada marca tem a sua quantidade no
  // consumo, na chave "<item>_<n>" (chaveMarca); consumo[<item>] continua o total do item. O dia já preenchido põe tudo
  // numa marca só, a "padrao" do item (a mais pedida e perto da média, para o mínimo que vale a pena continuar valendo:
  // MSC chope Stella, long neck Heineken/Budweiser/Stella, dose de destilado; Costa vinho em taça, caipirinha).
  // ANTES: um contador só por item e a conta pela média das marcas ("Na conta: média de R$ X").
  function chaveMarca(id, n) { return id + "_" + n; }
  function comMarcas(cia, consumo) {
    var c = CIAS[cia] || CIAS.msc;
    Object.keys(c.itens).forEach(function (id) {
      var marcas = c.itens[id].marcas, pad = c.itens[id].padrao || 0, q = consumo[id] || 0;
      var dado = marcas.some(function (m, n) { return consumo[chaveMarca(id, n)] !== undefined; });
      if (dado) {
        // Dia já dado marca por marca (DIA_MINIMO): completa as que faltam com 0 e o total é a soma.
        var t = 0;
        marcas.forEach(function (m, n) { var k = chaveMarca(id, n); consumo[k] = consumo[k] || 0; t += consumo[k]; });
        consumo[id] = t;
      } else marcas.forEach(function (m, n) { consumo[chaveMarca(id, n)] = n === pad ? q : 0; });
    });
    return consumo;
  }
  // Muda a quantidade de uma marca e acerta o total do item.
  function mudarMarca(cia, consumo, id, n, q) {
    var marcas = CIAS[cia].itens[id].marcas, t = 0;
    consumo[chaveMarca(id, n)] = q;
    marcas.forEach(function (m, i) { t += consumo[chaveMarca(id, i)] || 0; });
    consumo[id] = t;
    return consumo;
  }
  // Tem quantidade por marca no consumo deste item?
  function temMarcas(c, id, consumo) {
    var it = c.itens && c.itens[id];
    if (!it) return false;
    return it.marcas.some(function (m, n) { return consumo[chaveMarca(id, n)] !== undefined; });
  }

  // Preço de cada marca (a faixa "de 81 a 90" conta pelo meio) e o avulso do item = média das marcas, arredondada.
  // Mudou um preço na habilidade precos-bebidas-msc-costa-2026: mude a marca aqui e a conta acompanha sozinha.
  // Preço da marca em centavos (23/11/2026: chope R$ 32,32 igual ao pacote; ANTES arredondado ao real, 32, e 20 chopes
  // avulsos saíam R$ 6 mais baratos que o Pacote de Cerveja). Marcas de preço inteiro não mudam.
  function centavos(x) { return Math.round(x * 100) / 100; }
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
  // Regra dos 15% (Leonardo, 22/11/2026: "Se o valor individual não custar menos do que 15% do pacote, sempre indique o
  // pacote... e já venha selecionado... não quero fazer contas... Não é obrigatório"): dentro da faixa dos 35%, se o
  // avulso é pelo menos 85% do pacote, a tela já vem com "Pedir sem me preocupar" marcado (o cliente pode trocar).
  var PERTO = 0.15;

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
    // As marcas vão junto (zeradas quando o item some da tela).
    Object.keys(consumo).forEach(function (k) {
      var m = /^(.+)_(\d+)$/.exec(k);
      if (m && c[m[1]] !== undefined) c[k] = vis[m[1]] ? consumo[k] || 0 : 0;
    });
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
      var cob = cobre[it.id];
      if (cob === true) return;
      // Com quantidade por marca: cada marca pelo preço dela (faixa pelo meio, arredondado como a média).
      if (temMarcas(c, it.id, consumo)) {
        c.itens[it.id].marcas.forEach(function (m, n) {
          total += inteiro(consumo[chaveMarca(it.id, n)], 0, 50, 0) * centavos(precoMarca(m));
        });
        return;
      }
      var q = inteiro(consumo[it.id], 0, 50, 0);
      var fora = typeof cob === "number" ? Math.max(0, q - cob) : q;
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

  // Pacote para dividir (CIAS[cia].fixos): soma o consumo da cabine na viagem (adultos e crianças) por item e, onde o
  // consumo enche um pacote, usa o pacote e o resto avulso. Sem pacote que encha = null (a tela não mostra o cartão).
  // Volta { pacotes: [{ nome, qtd, valor, unidade, aMais, aMaisValor }], outras (avulso do resto), total }.
  function pacoteDividir(cia, perfis, criancas, noites, avulsoViagem) {
    var c = CIAS[cia];
    if (!c.fixos) return null;
    var usados = [], total = 0, cobertoAvulso = 0;
    c.fixos.forEach(function (g) {
      var qtd = 0;
      perfis.forEach(function (p) { qtd += inteiro(p.consumo[g.item], 0, 50, 0) * p.pessoas * noites; });
      criancas.forEach(function (k) { qtd += inteiro(k[g.item], 0, 50, 0) * noites; });
      var pk = g.pacotes.filter(function (x) { return qtd >= x.qtd; })[0];
      if (!pk) return;
      var it = c.itens[g.item], unit = it && it.marcas.length === 1 ? centavos(precoMarca(it.marcas[0])) : c.avulso[g.item], aMais = qtd - pk.qtd;
      cobertoAvulso += unit * qtd;
      usados.push({ nome: pk.nome, item: g.item, qtd: pk.qtd, valor: pk.valor, unidade: g.unidade, aMais: aMais, aMaisValor: unit * aMais });
      total += pk.valor + unit * aMais;
    });
    if (!usados.length) return null;
    var outras = Math.max(0, avulsoViagem - cobertoAvulso);
    return { pacotes: usados, outras: outras, total: total + outras };
  }

  // entrada: { cia, noites, adultos, perfis: [{ consumo, pessoas }], pacotesSaida }
  // perfis: um só quando todos bebem igual; senão o do cliente (1 pessoa) e o dos outros adultos.
  function calcular(entrada) {
    var cia = entrada.cia;
    if (!CIAS[cia]) throw new Error("companhia desconhecida: " + cia);
    var noites = inteiro(entrada.noites, 1, 30, 4);
    var adultos = inteiro(entrada.adultos, 1, 4, 2);
    var perfis = entrada.perfis && entrada.perfis.length ? entrada.perfis : [{ consumo: diaMinimo(cia, true), pessoas: adultos }];

    // criancas (opcional): o consumo de cada criança de 2 a 17 anos (só sem álcool). Avulso: o que ela bebe;
    // com pacote: o de menores (CRIANCA) por dia, o mesmo com qualquer pacote do adulto.
    var criancas = (entrada.criancas || []).slice(0, 4);
    var avulsoViagem = 0, avulsoCriancas = 0;
    perfis.forEach(function (p) { avulsoViagem += avulsoDia(cia, p.consumo, null) * noites * p.pessoas; });
    criancas.forEach(function (c) { avulsoCriancas += avulsoDia(cia, c, null) * noites; });
    avulsoViagem += avulsoCriancas;
    var pacoteCriancas = CRIANCA[cia].dia * noites * criancas.length;
    var pessoas = adultos + criancas.length;

    // niveis (opcional): só os pacotes do foco (niveisDoFoco). Sem: os três.
    var lista = entrada.niveis && entrada.niveis.length ? entrada.niveis : ["sem_alcool", "basico", "premium"];
    var pacotes = lista.map(function (nivel) {
      var preco = precoPacote(cia, nivel, noites, entrada.pacotesSaida);
      var foraViagem = 0;
      perfis.forEach(function (p) { foraViagem += avulsoDia(cia, p.consumo, nivel) * noites * p.pessoas; });
      criancas.forEach(function (c) { foraViagem += avulsoDia(cia, c, "sem_alcool") * noites; });
      var total = preco.valor * adultos + pacoteCriancas + foraViagem;
      return { nivel: nivel, pacote: CIAS[cia].niveis[nivel].pacote, porAdulto: preco.valor, fonte: preco.fonte, foraDoPacote: foraViagem,
        criancas: criancas.length, pacoteCriancas: pacoteCriancas, total: total };
    });

    // O pacote mais em conta para o que ele bebe (empate: o mais simples).
    var melhor = pacotes.reduce(function (a, b) { return b.total < a.total ? b : a; });
    var diferenca = melhor.total - avulsoViagem; // > 0: o pacote custa mais
    var faixa;
    if (diferenca <= 0) faixa = "pacote";
    else if (avulsoViagem > 0 && melhor.total <= avulsoViagem * (1 + FAIXA)) faixa = "considerar";
    else faixa = "sem_pacote";

    return {
      cia: cia, noites: noites, adultos: adultos, criancas: criancas.length,
      avulsoViagem: avulsoViagem, avulsoCriancas: avulsoCriancas,
      avulsoDiaPessoa: avulsoViagem / (noites * pessoas),
      pacotes: pacotes,
      melhor: melhor,
      faixa: faixa,
      // Na faixa e o avulso a menos de 15% do pacote: indicar o pacote já marcado (regra dos 15%, 22/11/2026).
      perto: faixa === "considerar" && avulsoViagem >= melhor.total * (1 - PERTO),
      // pacote: economia com o pacote; sem_pacote: economia sem pacote; considerar: quanto a mais custa.
      valor: Math.abs(diferenca),
      aMaisPorDiaPessoa: diferenca > 0 ? diferenca / (noites * pessoas) : 0,
      nivel: faixa === "pacote" ? melhor.nivel : faixa === "sem_pacote" ? "sem_pacote" : null,
      // Pacote para dividir (só Costa, 23/11/2026): uma opção a mais no resultado; não muda a indicação acima.
      // Só aparece quando sai mais barato que o pacote por dia mais em conta (senão só confunde; Leonardo, 23/11/2026:
      // "Não pode ficar muito confuso").
      dividir: (function () { var d = pacoteDividir(cia, perfis, criancas, noites, avulsoViagem); return d && d.total < melhor.total ? d : null; })(),
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
  // "dividir" (pacote para dividir, Costa) = sem pacote por dia: vai como "sem" e o resumo (r) diz quais pacotes.
  var NIVEL_PARA_B = { sem_pacote: "sem", sem_alcool: "soft", basico: "basico", premium: "premium", dividir: "sem" };

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
      // Crianças de 2 a 17 anos (cr), as que pagam pacote; até 1 ano a página não manda (22/11/2026).
      criancas: p.cr ? inteiro(p.cr, 0, 4, null) : null,
      saida: String(p.saida || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60),
      // Pacote da pesquisa (b=basico|premium): a pergunta do foco já vem marcada (21/11/2026). Outro valor = vazio.
      b: p.b === "basico" || p.b === "premium" ? p.b : "",
      // WhatsApp do contato no link (w), o mesmo da página (mv.js): só os dígitos; "{{...}}" não trocado = vazio.
      // Quem confere o número é o MV.conferirWhats na tela. (Leonardo, 21/11/2026: o WhatsApp vem no link, a
      // calculadora não pede de novo.) ANTES: a calculadora não lia o w e pedia o WhatsApp num formulário.
      whats: /^\{\{.*\}\}$/.test(String(p.w || "")) ? "" : String(p.w || "").replace(/\D/g, "").slice(0, 15),
      // Pesquisa da tela quando veio de uma saída do site (MV.linkCalc, 5º argumento): "?t=...". Vazio = abriu por fora.
      pesquisa: /^t=/.test(String(p.pesq || "")) ? "?" + String(p.pesq).slice(0, 400) : "",
    };
  }

  var api = { SEQ: SEQ, montarDia: montarDia, precoChave: precoChave, chaveMarca: chaveMarca, comMarcas: comMarcas, mudarMarca: mudarMarca, CAMBIO: CAMBIO, CRIANCA: CRIANCA, diaMinimoCrianca: diaMinimoCrianca, ITENS: ITENS, FOCOS: FOCOS, itensDoFoco: itensDoFoco, blocoDoItem: blocoDoItem, niveisDoFoco: niveisDoFoco,
    soDoFoco: soDoFoco, precoMarca: precoMarca, mediaMarcas: mediaMarcas, focoDaPesquisa: focoDaPesquisa, noitesDaPesquisa: noitesDaPesquisa, diaMinimo: diaMinimo, CIAS: CIAS, NIVEIS: NIVEIS, FAIXA: FAIXA, PERTO: PERTO,
    avulsoDia: avulsoDia, precoPacote: precoPacote, calcular: calcular, decidir: decidir, pacoteDividir: pacoteDividir,
    nivelDasDuas: nivelDasDuas, NIVEL_PARA_B: NIVEL_PARA_B, montarEnvio: montarEnvio, saidaDoDia: saidaDoDia, lerLink: lerLink };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.CalcBebidas = api;
})(this);
