// Minha Viagem (passo 3 do plano, Leonardo, 21/11/2026): as contas e decisões da página, sem tela.
// Roda no navegador (window.MV) e no node (require) para o teste testes/minhaviagem_site_21_11.test.js.
// Link da página (formato do passo 4, docs/ideias/minha-viagem-4.md, com o período ampliado em 21/11/2026):
//   ?t=<tipo>&p=<período>&de=<AAAAMMDD>&ate=<AAAAMMDD>&a=<adultos>&c=<crianças>&k=<cabine>&b=<pacote>&id=<código>
// p = "todas" ou meses e Carnavais separados por ponto (m2611 = nov/2026, carn27 = Carnaval 2027); os códigos do
// Lead Ads (nd26, jf27, ma27) viram os dois meses. de/ate = a janela de datas do cliente (vale sobre os meses).
// Valor fora da lista = o filtro mais aberto (nunca quebra a página).
(function (raiz) {
  "use strict";

  var LISTAS = {
    t: ["mini", "longo", "todos"],
    a: ["1", "2", "3", "4", "5"],
    c: ["0", "1", "2", "3", "4"],
    k: ["int", "ext", "var", "sui", "todas"],
    b: ["sem", "soft", "basico", "premium", "entender"],
  };
  var PADRAO = { t: "todos", p: "todas", a: "2", c: "0", k: "todas", b: "sem" };

  // Quando (Leonardo, 21/11/2026: "todos os meses... fora o carnaval, que vai ficar separado também de fevereiro, e um
  // campo para informar a data inicial e final"). Carnaval = sábado a quarta de cinzas: entra a saída que tem algum dia
  // nessa janela (o mês de fevereiro continua com todas as saídas de fevereiro).
  // Réveillon (Leonardo, 21/11/2026, 7ª rodada: "pode ter Carnaval e Réveillon também, nos 2 anos"): entra a saída que
  // está no navio na virada, embarca até 31/12 e volta a partir de 01/01. A conta é a mesma do Carnaval (embarque <= ate e
  // volta >= de), por isso no Réveillon "de" é 01/01 e "ate" é 31/12. ANTES: só Carnaval.
  var CARNAVAL = {
    rev27: { nome: "Réveillon 2027", de: "2027-01-01", ate: "2026-12-31", festa: "reveillon" },
    carn27: { nome: "Carnaval 2027", de: "2027-02-06", ate: "2027-02-10", festa: "carnaval" },
    rev28: { nome: "Réveillon 2028", de: "2028-01-01", ate: "2027-12-31", festa: "reveillon" },
    carn28: { nome: "Carnaval 2028", de: "2028-02-26", ate: "2028-03-01", festa: "carnaval" },
  };
  var ANTIGOS = { nd26: "m2611.m2612", jf27: "m2701.m2702", ma27: "m2703.m2704" };   // códigos do Lead Ads
  var MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function mesDe(iso) { return "m" + iso.slice(2, 4) + iso.slice(5, 7); }
  function nomeMes(m) { return MESES[+m.slice(3, 5) - 1] + " 20" + m.slice(1, 3); }
  function chaveOrdem(x) { return CARNAVAL[x] ? CARNAVAL[x].de.slice(2, 4) + CARNAVAL[x].de.slice(5, 7) + "z" : /^t/.test(x) ? x.slice(1) + "00" : x.slice(1); }
  // Temporada inteira como período (Leonardo, 21/11/2026, 6ª rodada: "todas as datas... vai ter que ser todas as datas da
  // temporada escolhida"): t27 = temporada 26/27 (jul/2026 a jun/2027). No link e no Salvar vai como os 12 meses dela
  // (m2607...m2706), que passam na trava de formato do fluxo 1424 do Entur; ao ler, os 12 meses juntos voltam a ser t27.
  // ANTES: "Todas as datas" = as duas temporadas juntas.
  function mesesDaTemporada(t) {
    var a = +t.slice(1), r = [];
    for (var i = 0; i < 12; i++) { var m = 7 + i, y = m > 12 ? a : a - 1; m = m > 12 ? m - 12 : m; r.push("m" + y + (m < 10 ? "0" : "") + m); }
    return r;
  }
  // "m2611.carn27" -> ["m2611", "carn27"] (ordenado, sem repetir, só códigos válidos); vazio = todas as datas
  function lerPeriodo(v) {
    v = String(v || "").trim().toLowerCase();
    if (ANTIGOS[v]) v = ANTIGOS[v];
    var ok = {};
    v.split(".").forEach(function (x) {
      if (/^m\d\d(0[1-9]|1[0-2])$/.test(x) || /^t\d\d$/.test(x) || CARNAVAL[x]) ok[x] = 1;
    });
    Object.keys(ok).forEach(function (x) {
      if (!/^m/.test(x)) return;
      var t = "t" + temporada(x).slice(2), ms = mesesDaTemporada(t);
      if (ms.every(function (m) { return ok[m]; })) { ms.forEach(function (m) { delete ok[m]; }); ok[t] = 1; }
    });
    // temporada marcada = ela inteira: os meses e o Carnaval dela não somam nada
    Object.keys(ok).forEach(function (x) { if (/^t/.test(x)) Object.keys(ok).forEach(function (y) { if (y !== x && temporada(y) === temporada(x)) delete ok[y]; }); });
    return Object.keys(ok).sort(function (a, b) { return chaveOrdem(a) < chaveOrdem(b) ? -1 : 1; });
  }
  // Período para o link e o Entur: a temporada vira os 12 meses dela.
  function periodoLink(v) {
    var r = [];
    lerPeriodo(v).forEach(function (x) { r = r.concat(/^t/.test(x) ? mesesDaTemporada(x) : [x]); });
    return r.join(".") || "todas";
  }
  function lerData(v) {
    v = String(v || "").replace(/\D/g, "");
    if (!/^20\d{6}$/.test(v)) return "";
    var iso = v.slice(0, 4) + "-" + v.slice(4, 6) + "-" + v.slice(6, 8), d = new Date(iso + "T12:00:00Z");
    return !isNaN(d) && d.toISOString().slice(0, 10) === iso ? iso : "";
  }
  var CABINES = ["int", "ext", "var", "sui"];
  var NOME_CABINE = { int: "Interna", ext: "Externa", var: "Varanda", sui: "Suíte" };
  var NOME_NIVEL = { sem: "sem pacote de bebidas", soft: "pacote sem álcool", basico: "pacote básico", premium: "pacote premium" };

  // Cabine com mais de uma escolha (Leonardo, 21/11/2026: "na pesquisa vai ter a possibilidade de selecionar mais de uma";
  // "só vai aparecer as quatro se eles falarem qualquer uma"): k = "todas" (qualquer uma) ou tipos separados por ponto,
  // na ordem int, ext, var, sui ("int.var"). As 4 marcadas = todas. ANTES: um tipo só (int, ext, var ou todas), sem suíte.
  function lerCabines(v) {
    var ok = {};
    String(v == null ? "" : v).trim().toLowerCase().split(".").forEach(function (x) { if (CABINES.indexOf(x) >= 0) ok[x] = 1; });
    var r = CABINES.filter(function (c) { return ok[c]; });
    return !r.length || r.length === CABINES.length ? "todas" : r.join(".");
  }
  // Os tipos da pesquisa: "todas" = os 4.
  function cabinesDe(k) { var x = lerCabines(k); return x === "todas" ? CABINES.slice() : x.split("."); }
  function lerPesquisa(busca) {
    var q = {};
    String(busca || "").replace(/^\?/, "").split("&").forEach(function (par) {
      if (!par) return;
      var i = par.indexOf("="), k = i < 0 ? par : par.slice(0, i), v = i < 0 ? "" : par.slice(i + 1);
      try { k = decodeURIComponent(k); v = decodeURIComponent(v.replace(/\+/g, " ")); } catch (e) { return; }
      q[k] = v;
    });
    var r = {};
    Object.keys(LISTAS).forEach(function (k) {
      var v = String(q[k] == null ? "" : q[k]).trim().toLowerCase();
      r[k] = LISTAS[k].indexOf(v) >= 0 ? v : PADRAO[k];
    });
    r.k = lerCabines(q.k);
    r.i = lerIdades(q.i, r.c);
    r.p = lerPeriodo(q.p).join(".") || "todas";
    r.de = lerData(q.de);
    r.ate = lerData(q.ate);
    if (r.de && r.ate && r.ate < r.de) { var x = r.de; r.de = r.ate; r.ate = x; }
    // código do contato: só letras, números, _ e -; "{{contact.id}}" que não foi trocado pelo Entur = sem código
    var id = String(q.id || "");
    r.id = /^[A-Za-z0-9_-]{1,40}$/.test(id) ? id : "";
    // WhatsApp do contato no link (w), para o Salvar achar o contato no CRM sem pedir nada (Leonardo, 21/11/2026: "O
    // WhatsApp não pode virar um parâmetro?"; o webhook do Entur só acha o contato por e-mail ou telefone, não pelo
    // código). Aceita "+55 54 99936-2828", "5554999362828" etc.; inválido ou "{{...}}" não trocado = vazio.
    // ANTES: o link não levava dado pessoal e o Salvar pedia o WhatsApp.
    r.w = conferirWhats(String(q.w || "").replace(/^\{\{.*\}\}$/, "")).num;
    return r;
  }

  function addDias(iso, n) { var d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function volta(s) { return addDias(s.embarque, s.noites); }
  function doTipo(s, t) { return t === "mini" ? s.noites <= 4 : t === "longo" ? s.noites >= 5 : true; }
  // Datas do cliente valem sobre os meses e contam só o EMBARQUE: embarca entre "de" e "ate" (Leonardo, 22/11/2026:
  // "posso colocar qualquer coisa, 2 a 3, 2 a 7, ela não acha essa"; "Sim, pelo embarque"; caso Virtuosa 02/01, 7 noites).
  // ANTES: a viagem inteira dentro (volta até "ate"), e "02/01 a 02/01" não achava nenhuma saída.
  // Sem datas: embarque num dos meses marcados, ou algum dia no Carnaval marcado. Nada marcado = todas.
  function noPeriodo(s, f) {
    if (typeof f === "string") f = { p: f };
    // Só a 1ª data = só as saídas que embarcam nesse dia (Leonardo, 22/11/2026, "sim": padrão dos calendários de intervalo;
    // ANTES: "a partir de" essa data, e o Virtuosa 02/01 vinha no meio de todas as seguintes).
    if (f.de && !f.ate) return s.embarque === f.de;
    if (f.de || f.ate) return (!f.de || s.embarque >= f.de) && (!f.ate || s.embarque <= f.ate);
    var ps = lerPeriodo(f.p);
    if (!ps.length) return true;
    return ps.some(function (x) {
      var c = CARNAVAL[x];
      return c ? (s.embarque <= c.ate && volta(s) >= c.de) : /^t/.test(x) ? temporada(mesDe(s.embarque)) === temporada(x) : mesDe(s.embarque) === x;
    });
  }
  // Janela do período pedido (para achar as saídas mais próximas): [de, ate] ou null.
  function janela(f) {
    if (f.de || f.ate) return [f.de || f.ate, f.ate || f.de];
    var ps = lerPeriodo(f.p);
    if (!ps.length) return null;
    var ds = [], as = [];
    ps.forEach(function (x) {
      var c = CARNAVAL[x];
      if (c) { ds.push(c.de < c.ate ? c.de : c.ate); as.push(c.de < c.ate ? c.ate : c.de); return; }
      if (/^t/.test(x)) { var y = 2000 + +x.slice(1); ds.push((y - 1) + "-07-01"); as.push(y + "-06-30"); return; }
      var a = "20" + x.slice(1, 3), m = x.slice(3, 5), fim = new Date(Date.UTC(+a, +m, 0)).toISOString().slice(0, 10);
      ds.push(a + "-" + m + "-01"); as.push(fim);
    });
    return [ds.sort()[0], as.sort()[as.length - 1]];
  }
  // Meses com saída (para os botões do Quando), em ordem.
  function mesesComSaida(saidas, hoje) {
    var m = {};
    saidas.forEach(function (s) { if (s.embarque > hoje) m[mesDe(s.embarque)] = 1; });
    return Object.keys(m).sort();
  }

  // Pacote por adulto da saída no nível pedido (MSC ou Costa já vêm certos do arquivo). Sem pacote = 0.
  // Idade de cada criança no embarque (Leonardo, 21/11/2026, "Fazer o B"): "5.12" = uma de 5 e outra de 12 anos; "x" = idade
  // não marcada; 0 = menos de 1 ano. Sempre uma por criança (c). ANTES: a página só sabia quantas crianças, não as idades.
  function lerIdades(v, c) {
    var xs = String(v == null ? "" : v).split("."), n = parseInt(c, 10) || 0, r = [];
    for (var k = 0; k < n; k++) { var x = String(xs[k] == null ? "" : xs[k]).trim(); r.push(/^(\d|1[0-7])$/.test(x) ? String(+x) : "x"); }
    return r.join(".");
  }
  // Crianças que pagam pacote de bebidas: 2 anos ou mais; sem idade marcada conta (22/11/2026). Até 1 ano não paga.
  function criancasPagantes(i, c) {
    var xs = lerIdades(i, c);
    return xs ? xs.split(".").filter(function (x) { return x !== "0" && x !== "1"; }).length : 0;
  }
  function nomeIdade(x) { return x === "0" ? "menos de 1 ano" : x === "1" ? "1 ano" : x + " anos"; }
  function juntar(xs) { return xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " e " + xs[xs.length - 1]; }
  // "(5 e 12 anos)", "(5 anos e a outra eu te passo)", "" sem nenhuma idade marcada.
  function textoIdades(i) {
    var xs = i ? String(i).split(".") : [], sabe = xs.filter(function (x) { return x !== "x"; }), falta = xs.length - sabe.length;
    if (!sabe.length) return "";
    var nomes = sabe.every(function (x) { return +x >= 2; }) && sabe.length > 1 ? [juntar(sabe) + " anos"] : [juntar(sabe.map(nomeIdade))];
    if (falta) nomes.push(falta === 1 ? "a outra eu te passo" : "as outras eu te passo");
    return "(" + nomes.join(" e ") + ")";
  }
  // Pessoas na conta do preço (Leonardo, 21/11/2026, "Fazer o B"): com criança, o preço conta cada criança como adulto
  // (é o valor máximo; com a idade pode sair menos). Mais de 4 na cabine = "5" (vai para o WhatsApp).
  // ANTES: o preço era só dos adultos e a criança ficava fora da conta.
  function lotacao(f) {
    if (String(f.a) === "5") return "5";
    var n = (parseInt(f.a, 10) || 0) + (parseInt(f.c, 10) || 0);
    return n > 4 ? "5" : String(n);
  }
  // "2 adultos e 2 crianças (5 e 12 anos)"
  function gente(f) {
    var a = String(f.a), c = String(f.c || "0");
    var t = a === "5" ? "5 ou mais adultos" : a + (a === "1" ? " adulto" : " adultos");
    if (c !== "0") { var id = textoIdades(lerIdades(f.i, c)); t += " e " + c + (c === "1" ? " criança" : " crianças") + (id ? " " + id : ""); }
    return t;
  }
  // Mensagem do botão "Valor exato com as idades" de cada saída: navio, datas, cabine, adultos e idades, para a Fila cotar
  // sem perguntar de novo. ANTES: "quero o preço exato com as idades das crianças", sem saída, cabine nem idade.
  function msgIdades(s, f, cab) {
    return "Oi, Leonardo! Vi na minha página o " + s.navio + ", de " + diaMes(s.embarque) + " a " + diaMes(volta(s)) + ", " + s.noites +
      " noites, cabine " + (NOME_CABINE[cab] || "").toLowerCase() + ", para " + gente(f) + ". Quero o valor exato com as idades." +
      (textoIdades(lerIdades(f.i, f.c)) ? "" : (String(f.c) === "1" ? " Já te passo a idade da criança." : " Já te passo a idade de cada criança."));
  }
  function diaMes(iso) { return iso.slice(8, 10) + "/" + iso.slice(5, 7); }

  // Mensagem do botão "Quero esta saída" (Leonardo, 21/11/2026: "tá enviando uma mensagem incompleta... não tá botando
  // pacote de bebidas, não tá colocando o preço total, tem que ter todas as informações possíveis"). ANTES: só navio,
  // datas, noites, cabine e pessoas. AGORA: navio e companhia, datas com o dia da semana, roteiro, cabine, pessoas, preço
  // por pessoa e total do cruzeiro, pacote de bebidas (valor por adulto e total), total com o pacote e o dia do preço.
  // salvaB = pacote do link ("entender" = ainda decidindo).
  function rs(n) { return "R$ " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  // Perguntas da janela do "Quero esta saída" (Leonardo, 21/11/2026: "aparecer uma lista de perguntas que a pessoa pode
  // fazer... só clicar"; escolheu parcelar, desconto à vista e "tudo incluso", que puxa o seguro).
  // 3 perguntas (Leonardo, 21/11/2026: "se der só três perguntas, pode tirar dois"; saiu "Esse preço ainda está valendo?").
  var PERGUNTAS_SAIDA = ["Em quantas vezes dá para parcelar?",
    "Esse valor já é com tudo incluso? Não tem nenhuma taxa a mais?", "Tem desconto pagando à vista?"];
  // Formato das cotações do Leonardo (Leonardo, 21/11/2026: "deixar no padrão das minhas cotações... com a pergunta
  // destacada no fim em negrito"; modelo da habilidade cotacao-krooze-360cruzeiros). ANTES: uma linha "Navio:", "Datas:"...
  // Sem a linha "12x": quem parcela e em quantas vezes é o Leonardo quem diz (é uma das perguntas).
  function msgSaida(s, f, cab, salvaB, pergunta) {
    var a = String(f.a), na = Number(a), o = (s.ocup || {})[a], v = o && (cab in o.cab) ? o.cab[cab] : undefined;
    var pp = function (n) { return na > 1 ? rs(n) + " total (" + rs(n / na) + "/pessoa)" : rs(n); };
    var b = f.b, pk = pacote(s, b), beb, inc = incluso(s, a, cab);
    if (inc) { beb = "Pacote " + inc.nome + " incluso na tarifa"; pk = null; }   // 22/11/2026: bebida já está no preço
    else if (s.bebidas === "a bordo") beb = "Bebidas vendidas somente a bordo";
    else if (b === "sem" || !b) beb = salvaB === "entender" ? "Ainda não decidi o pacote de bebidas" : "Sem pacote de bebidas";
    else beb = pk ? "Pacote " + pk.nome : "Pacote " + NOME_NIVEL[b].replace(/^pacote /, "") + " (preço a confirmar)";
    var l = ["Oi, Leonardo! Quero esta saída que vi na minha página:", "",
      "🚢 " + s.navio + " | " + s.noites + " noites | " + rotaTexto(s.roteiro),
      "📅 Embarque: " + diaMes(s.embarque) + "/" + s.embarque.slice(0, 4) + " | Desembarque: " + diaMes(volta(s)) + "/" + volta(s).slice(0, 4),
      "🥤 *" + beb + "*", "",
      "🛏️ " + (NOME_CABINE[cab] || cab) + " (" + gente(f) + ")"];
    if (typeof v !== "number") l.push("💰 " + (v === null ? "Esgotada nesta cabine" : "Preço a confirmar"));
    else if (inc && NIVEL_ORDEM[f.b] > NIVEL_ORDEM[inc.nivel]) l.push("💰 " + pp(v) + " com o " + inc.nome + " (o pacote que escolhi: preço a confirmar)");
    else if (pk && pk.v) {
      l.push("💰 Cruzeiro: " + pp(v), "🥤 Pacote: " + pp(pk.v * na), "💰 Com o pacote: " + pp(v + na * pk.v));
    } else l.push("💰 " + pp(v));
    l.push("", "✅ Taxas portuárias e de serviço já incluídas");
    if (o && o.dia) l.push("Preço de " + diaMes(o.dia));
    l.push("", "*" + (pergunta || PERGUNTAS_SAIDA[0]) + "*");   // uma pergunta só, a tocada, em negrito (Leonardo, 21/11/2026)
    return l.join("\n");
  }

  var NIVEL_ORDEM = { soft: 1, basico: 2, premium: 3 };
  // Pacote que já vem na tarifa da cabine ({nivel, nome}) ou null (22/11/2026).
  function incluso(s, a, cab) {
    var o = (s.ocup || {})[String(a)];
    return o && o.inc && o.inc[cab] ? o.inc[cab] : null;
  }

  function pacote(s, b) {
    if (b !== "soft" && b !== "basico" && b !== "premium") return { v: 0, nome: "" };
    // Temático (Leonardo, 21/11/2026: "Bebidas do cruzeiro temático, elas são vendidas somente a bordo"): sem pacote para
    // somar; com pacote escolhido conta só a cabine e a página avisa. ANTES: temáticos não estavam nos dados.
    if (s.bebidas === "a bordo") return { v: 0, nome: "", aBordo: true };
    var p = (s.pacotes || {})[b];
    return p ? { v: p.v, nome: p.nome, lidoEm: p.lidoEm } : null;
  }

  // Linha do roteiro no cartão: "Santos → Búzios → Santos"; sem paradas (temáticos: a API não diz) = "Saída e volta em Santos".
  function rotaTexto(roteiro) {
    var meio = String(roteiro || "").replace(/^Santos,\s*/, "").replace(/,\s*Santos$/, "").replace(/^ida e volta$/, "").replace(/^Santos$/, "");
    // Nomes longos abreviados para caber todas as cidades nas 2 linhas do card (Leonardo, 22/11/2026: "B. Camboriú pode ser
    // padrão geral"). ANTES: "Balneário Camboriú" e "Buenos Aires" inteiros cortavam a rota em "...".
    meio = meio.replace(/Balneário Camboriú/g, "B. Camboriú").replace(/Buenos Aires/g, "B. Aires");
    return meio ? "Santos → " + meio + " → Santos" : "Saída e volta em Santos";
  }

  // Paradas do card em linha (Leonardo, 22/11/2026: "o percurso do navio podia ser bem mais moderno... fazer uma linha com
  // as paradas"): ["Santos", ..., "Santos"]; sem paradas (temáticos e minis "Santos, Santos") = só as 2 pontas. Nomes longos
  // encurtados para caber 6 paradas no celular. ANTES: só o texto "Santos → A, B → Santos" (rotaTexto, que segue na mensagem).
  function paradas(roteiro) {
    var meio = String(roteiro || "").split(/,\s*/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (meio[0] === "Santos") meio.shift();
    if (meio[meio.length - 1] === "Santos") meio.pop();
    meio = meio.filter(function (x) { return x !== "ida e volta" && x !== "Santos"; }).map(function (x) {
      return x.replace("Balneário Camboriú", "B. Camboriú").replace("Buenos Aires", "B. Aires").replace("Praia de Copacabana", "Copacabana");
    });
    return ["Santos"].concat(meio, ["Santos"]);
  }

  // Nomes vizinhos que encostariam na linha de paradas (linha de ~246 px no card do celular de 360, ~6,2 px por letra a 12 px):
  // aí eles alternam em 2 alturas, e quem fica na mesma altura está 2 colunas longe. Ex.: "B. Aires" e "Montevidéu" sim;
  // "Búzios, Salvador, Maceió" não (uma linha só, card mais baixo).
  function paradasAlternam(ps) {
    var col = 246 / ps.length;
    for (var i = 0; i + 1 < ps.length; i++) if ((ps[i].length + ps[i + 1].length) * 3.1 > col - 3) return true;
    return false;
  }

  // Total da cabine para os adultos, com o pacote: cabine + adultos x pacote por adulto (regra do termômetro).
  // undefined = sem preço de hoje para essa lotação/cabine; null = esgotada; pacote pedido que não existe = sem total.
  function total(s, a, cab, b) {
    var o = (s.ocup || {})[String(a)];
    if (!o || !(cab in o.cab)) return undefined;
    var v = o.cab[cab];
    if (v === null) return null;
    // Cabine só com bebida inclusa (Leonardo, 22/11/2026: "Com selo bebida inclusa"; ex.: Suíte MSC "Premium Extra Incluso"):
    // o preço já tem o pacote, nunca soma outro por cima. Pacote pedido acima do incluso = sem total (preço a confirmar).
    // ANTES: o site somava o pacote por cima e cobrava a bebida duas vezes.
    var inc = incluso(s, a, cab);
    if (inc) return NIVEL_ORDEM[b] > NIVEL_ORDEM[inc.nivel] ? undefined : Math.round(v);
    var pk = pacote(s, b);
    if (!pk) return undefined;
    return Math.round(v + Number(a) * pk.v);
  }

  // Preço que ordena a saída: o da cabine escolhida; "todas" = a cabine mais em conta disponível.
  function precoOrdem(s, f) {
    var m = null;
    cabinesDe(f.k).forEach(function (c) { var t = total(s, f.a, c, f.b); if (typeof t === "number" && (m === null || t < m)) m = t; });
    return m;
  }

  // Lista da página. f = { t, p, a, b, k, navio, ordem: "preco" | "data" }, hoje = AAAA-MM-DD.
  // Volta { lista: com preço, esgotadas: cabines escolhidas esgotadas (aparecem depois, por data, com "Esgotada"),
  // semPreco: cabem nos filtros mas sem preço de hoje para esses adultos }.
  // Esgotadas à parte (Leonardo, 21/11/2026, "Mostrar como Esgotada"). ANTES: iam para "sem o preço de hoje".
  function filtrar(saidas, f, hoje) {
    var base = saidas.filter(function (s) {
      return s.embarque > hoje && doTipo(s, f.t) && noPeriodo(s, f) && (!f.navio || s.navio === f.navio) &&
        (!f.cia || f.cia === "todas" || s.cia === f.cia);   // companhia (Leonardo, 21/11/2026): MSC, Costa ou todas
    });
    var lista = [], esgotadas = [], semPreco = [];
    base.forEach(function (s) { (precoOrdem(s, f) !== null ? lista : esgotadaNa(s, f) ? esgotadas : semPreco).push(s); });
    lista.sort(function (x, y) {
      if (f.ordem === "data") return x.embarque < y.embarque ? -1 : x.embarque > y.embarque ? 1 : precoOrdem(x, f) - precoOrdem(y, f);
      return precoOrdem(x, f) - precoOrdem(y, f) || (x.embarque < y.embarque ? -1 : 1);
    });
    esgotadas.sort(function (x, y) { return x.embarque < y.embarque ? -1 : x.embarque > y.embarque ? 1 : 0; });
    return { lista: lista, esgotadas: esgotadas, semPreco: semPreco };
  }

  // Lida hoje para esses adultos e as cabines escolhidas que foram lidas estão todas esgotadas (valor null; a que não foi
  // lida não conta, aparece como "Indisponível").
  function esgotadaNa(s, f) {
    var o = (s.ocup || {})[String(f.a)];
    var cs = o ? cabinesDe(f.k).filter(function (c) { return c in o.cab; }) : [];
    return cs.length > 0 && cs.every(function (c) { return o.cab[c] === null; });
  }

  // Cabine fora da pesquisa que ainda tem preço (para o card esgotado): { c, t } da mais em conta, ou null.
  function outraComPreco(s, f) {
    var m = null, cs = cabinesDe(f.k);
    CABINES.forEach(function (c) {
      if (cs.indexOf(c) >= 0) return;
      var t = total(s, f.a, c, f.b);
      if (typeof t === "number" && (!m || t < m.t)) m = { c: c, t: t };
    });
    return m;
  }

  // Nada no período: as saídas mais próximas dele (mesmos filtros, sem o período), pela distância em dias.
  function maisProximas(saidas, f, hoje, n) {
    var x = janela(f);
    if (!x) return [];
    var g = Object.assign({}, f, { p: "todas", de: "", ate: "" });
    var r = filtrar(saidas, g, hoje).lista;
    function dist(s) {
      if (noPeriodo(s, f)) return 0;
      var d = s.embarque < x[0] ? (new Date(x[0]) - new Date(s.embarque)) : (new Date(s.embarque) - new Date(x[1]));
      return Math.abs(d) / 864e5;
    }
    return r.slice().sort(function (a, b) { return dist(a) - dist(b) || precoOrdem(a, g) - precoOrdem(b, g); }).slice(0, n || 5);
  }

  // A pesquisa que o "Salvar" grava (só valores das listas; navio e ordem não são salvos).
  var CAMPOS = ["t", "p", "de", "ate", "a", "c", "i", "k", "b"];
  function pesquisaDe(f) {
    var r = {};
    Object.keys(LISTAS).forEach(function (k) { r[k] = LISTAS[k].indexOf(String(f[k])) >= 0 ? String(f[k]) : PADRAO[k]; });
    r.k = lerCabines(f.k);
    r.i = lerIdades(f.i, r.c);
    r.p = lerPeriodo(f.p).join(".") || "todas";
    r.de = lerData(f.de); r.ate = lerData(f.ate);
    return r;
  }
  function mesmaPesquisa(x, y) {
    var a = pesquisaDe(x), b = pesquisaDe(y);
    return CAMPOS.every(function (k) { return a[k] === b[k]; });
  }

  // Corpo do POST ao webhook 53 "preferências salvas (site)" (formato fixado no passo 4).
  function montarEnvio(f, id, telefone, hp) {
    var p = pesquisaDe(f);
    return { telefone: "+" + telefone, id: id, t: p.t, p: periodoLink(p.p), de: p.de.replace(/-/g, ""), ate: p.ate.replace(/-/g, ""),
      a: p.a, c: p.c, k: p.k, b: p.b, hp: hp || "" };
  }

  // Endereço da página com a pesquisa (o mesmo que o Entur monta com os campos mv_*).
  function linkPesquisa(f, id) {
    var p = pesquisaDe(f);
    return "?t=" + p.t + "&p=" + periodoLink(p.p) + (p.de ? "&de=" + p.de.replace(/-/g, "") : "") + (p.ate ? "&ate=" + p.ate.replace(/-/g, "") : "") + "&a=" + p.a + "&c=" + p.c + (/\d/.test(p.i) ? "&i=" + p.i : "") + "&k=" + p.k + "&b=" + p.b + (id ? "&id=" + id : "");
  }

  function dmA(iso) { return iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4); }
  // "nov e dez 2026", "dez 2026 e jan 2027", "Carnaval 2027", "de 05/01/2027 a 20/01/2027"
  function nomePeriodo(f) {
    if (f.de && (!f.ate || f.ate === f.de)) return "embarque em " + dmA(f.de);
    if (f.de && f.ate) return "de " + dmA(f.de) + " a " + dmA(f.ate);
    if (f.ate) return "embarque até " + dmA(f.ate);
    var ps = lerPeriodo(f.p);
    if (!ps.length) return "todas as datas";
    var nomes = [], meses = ps.filter(function (x) { return /^m/.test(x); });
    ps.forEach(function (x) { if (/^t/.test(x)) nomes.push("temporada " + nomeTemporada(temporada(x))); });
    meses.forEach(function (m, i) {
      var prox = meses[i + 1];
      nomes.push(MESES[+m.slice(3, 5) - 1] + (prox && prox.slice(1, 3) === m.slice(1, 3) ? "" : " 20" + m.slice(1, 3)));
    });
    ps.forEach(function (x) { if (CARNAVAL[x]) nomes.push(CARNAVAL[x].nome); });
    return nomes.length === 1 ? nomes[0] : nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
  }

  // Resumo da pesquisa (mensagem do WhatsApp e "Você pesquisou"): as datas primeiro, a duração só se escolhida
  // (Leonardo, 21/11/2026: "a primeira informação que tem que aparecer são as datas"; "qualquer duração... não tem nada a
  // ver mais"). ANTES: "qualquer duração · todas as datas · ..." (a duração sempre primeiro).
  function resumo(f) {
    var p = pesquisaDe(f), partes = [];
    partes.push(nomePeriodo(p));
    if (p.t !== "todos") partes.push(p.t === "mini" ? "3 e 4 noites" : "5 noites ou mais");
    partes.push(gente(p));
    var ks = p.k === "todas" ? [] : p.k.split(".").map(function (c) { return NOME_CABINE[c]; });
    partes.push(!ks.length ? "qualquer cabine" : ks.length === 1 ? ks[0] : ks.slice(0, -1).join(", ") + " ou " + ks[ks.length - 1]);
    partes.push(p.b === "entender" ? "pacote de bebidas a decidir" : NOME_NIVEL[p.b]);
    return partes.join(" · ");
  }

  // Barra do Refazer (Leonardo, 21/11/2026: "mostrar o que tem na pesquisa, principalmente as datas... No celular não dá
  // para ver quase nada"): { datas, resto }. Datas curtas (dd/mm/aa, "dez/26"), só o que foi escolhido (sem "qualquer
  // cabine" nem "sem pacote"). ANTES: o resumo longo, com "qualquer duração" na frente, cortado com "…" no celular.
  function mesCurto(m) { return MESES[+m.slice(3, 5) - 1] + "/" + m.slice(1, 3); }
  function dCurta(iso) { return iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(2, 4); }
  function datasCurtas(f) {
    if (f.de && (!f.ate || f.ate === f.de)) return "embarque " + dCurta(f.de);
    if (f.de && f.ate) return dCurta(f.de) + " a " + dCurta(f.ate);
    if (f.ate) return "até " + dCurta(f.ate);
    var ps = lerPeriodo(f.p), nomes = [];
    if (!ps.length) return "Todas as datas";
    ps.forEach(function (x) { if (/^t/.test(x)) nomes.push("Temporada " + nomeTemporada(temporada(x))); });
    ps.forEach(function (x) { if (/^m/.test(x)) nomes.push(mesCurto(x)); });
    ps.forEach(function (x) { if (CARNAVAL[x]) nomes.push(CARNAVAL[x].nome); });
    return nomes.length === 1 ? nomes[0] : nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
  }
  function resumoBarra(f) {
    var p = pesquisaDe(f), resto = [];
    if (p.t !== "todos") resto.push(p.t === "mini" ? "3 e 4 noites" : "5+ noites");
    var a = p.a === "5" ? "5+ adultos" : p.a + (p.a === "1" ? " adulto" : " adultos");
    if (p.c !== "0") a += " + " + p.c + (p.c === "1" ? " criança" : " crianças");
    resto.push(a);
    if (p.k !== "todas") resto.push(p.k.split(".").map(function (c) { return NOME_CABINE[c]; }).join("/"));
    if (p.b !== "sem") resto.push(p.b === "entender" ? "bebidas a decidir" : p.b === "soft" ? "sem álcool" : p.b === "basico" ? "Básico" : "Premium");
    if (f.cia && f.cia !== "todas") resto.push(f.cia);
    if (f.navio) resto.push(f.navio);
    return { datas: datasCurtas(p), resto: resto.join(" · ") };
  }

  // WhatsApp do cliente (o mesmo conferidor do site da Black, 01/11): devolve { num: "55...", motivo }.
  var DDDS = " 11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 " +
    "71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99 ";
  function conferirWhats(t) {
    var d = String(t).replace(/\D/g, "").replace(/^0+/, ""), ex = " Ex.: (11) 99999-9999.";
    if (/^55\d{10,11}$/.test(d)) d = d.slice(2);
    if (!d) return { num: "", motivo: "Escreva seu WhatsApp com DDD." };
    if (d.length === 8 || d.length === 9) return { num: "", motivo: "Faltou o DDD antes do número." + ex };
    if (d.length < 10 || d.length > 11) return { num: "", motivo: "O WhatsApp está com números a " + (d.length < 10 ? "menos" : "mais") + ". Confira." + ex };
    var ddd = d.slice(0, 2), resto = d.slice(2);
    if (DDDS.indexOf(" " + ddd + " ") < 0) return { num: "", motivo: "O DDD " + ddd + " não existe. Confira o DDD." + ex };
    if (resto.length === 9 && resto[0] !== "9") return { num: "", motivo: "Celular com 9 dígitos começa com 9. Confira o número." + ex };
    if (resto.length === 8 && /[6-9]/.test(resto[0])) resto = "9" + resto;
    if (/^(\d)\1+$/.test(resto.slice(-8))) return { num: "", motivo: "Esse número parece não ser real. Confira." + ex };
    return { num: "55" + ddd + resto, motivo: "" };
  }

  // Linha do tempo de uma cabine: [[dia, total, daLista], ...]; total = cabine + adultos x pacote do dia
  // (o último pacote lido até aquele dia). 0 na cabine = esgotada (total null).
  function linhaDoTempo(hist, id, a, cab, b) {
    var h = hist && hist.saidas && hist.saidas[id] && hist.saidas[id][String(a)];
    if (!h || !h[cab]) return [];
    var pk = (b === "soft" || b === "basico" || b === "premium") ? (h["pk_" + b] || []) : null;
    var out = [];
    h[cab].forEach(function (p) {
      var dia = hist.dias[p[0]], v = p[1], extra = 0;
      // Marca 2 = dia só com bebida inclusa (22/11/2026): o valor já tem o pacote, nunca soma; 4º campo true.
      if (p[2] === 2) { out.push([dia, v === 0 ? null : Math.round(v), false, true]); return; }
      if (pk) {
        var ult = null;
        pk.forEach(function (q) { if (q[0] <= p[0]) ult = q; });
        if (!ult) return;   // sem pacote lido até esse dia: não dá para mostrar o total com pacote
        extra = Number(a) * ult[1];
      }
      out.push([dia, v === 0 ? null : Math.round(v + extra), p[2] === 1, false]);
    });
    return out;
  }

  // Temporada (Leonardo, 21/11/2026: "separar por 2027 ou 2028"): a temporada de Santos vai de novembro a abril e leva o
  // nome do ano do verão. nov/dez 2026 e jan a abr 2027 = "2027"; nov/dez 2027 e jan a abr 2028 = "2028".
  function temporada(x) {
    if (CARNAVAL[x]) return CARNAVAL[x].de.slice(0, 4);
    if (/^t\d\d$/.test(x)) return "20" + x.slice(1);
    var a = 2000 + +x.slice(1, 3), m = +x.slice(3, 5);
    return String(m >= 7 ? a + 1 : a);
  }
  // "2027" -> "26/27" (Leonardo, 21/11/2026: "temporada tem que ser dividida entre 26/27 e 27/28"); ANTES: "2027".
  function nomeTemporada(t) { return String(+t.slice(2) - 1) + "/" + t.slice(2); }
  function temporadas(saidas, hoje) {
    var t = {};
    mesesComSaida(saidas, hoje).forEach(function (m) { t[temporada(m)] = 1; });
    return Object.keys(t).sort();
  }

  // Paginador (Leonardo, 21/11/2026: "3 por página, por conta do celular"): pagina começa em 1; fora do limite = a mais perto.
  function paginar(lista, pagina, por) {
    por = por || 3;
    var total = Math.max(1, Math.ceil(lista.length / por)), p = Math.min(Math.max(1, Math.floor(+pagina) || 1), total);
    return { itens: lista.slice((p - 1) * por, p * por), pagina: p, paginas: total, de: lista.length ? (p - 1) * por + 1 : 0,
      ate: Math.min(p * por, lista.length), total: lista.length };
  }

  // Data digitada à mão: máscara dd/mm/aaaa enquanto digita, e a leitura ("05/01/2027", "5/1/27", "05012027") para AAAA-MM-DD.
  function mascaraData(t) {
    var d = String(t || "").replace(/\D/g, "").slice(0, 8);
    return d.length > 4 ? d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4) : d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  }
  function lerDataBR(t) {
    var m = String(t || "").trim().match(/^(\d{1,2})\D?(\d{1,2})\D?(\d{2}|\d{4})$/);
    if (!m) { var d = String(t || "").replace(/\D/g, ""); if (d.length !== 8) return ""; m = [0, d.slice(0, 2), d.slice(2, 4), d.slice(4)]; }
    var a = m[3].length === 2 ? "20" + m[3] : m[3];
    return lerData(a + ("0" + m[2]).slice(-2) + ("0" + m[1]).slice(-2));
  }
  function dataBR(iso) { return iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : ""; }

  // Calendário: as semanas do mês (domingo primeiro), com "" nos dias de fora. mes = "AAAA-MM".
  function semanasDoMes(mes) {
    var a = +mes.slice(0, 4), m = +mes.slice(5, 7), ini = new Date(Date.UTC(a, m - 1, 1)).getUTCDay(),
      dias = new Date(Date.UTC(a, m, 0)).getUTCDate(), cel = [], sem = [];
    for (var i = 0; i < ini; i++) cel.push("");
    for (var d = 1; d <= dias; d++) cel.push(mes + "-" + ("0" + d).slice(-2));
    while (cel.length % 7) cel.push("");
    for (var k = 0; k < cel.length; k += 7) sem.push(cel.slice(k, k + 7));
    return sem;
  }
  function somaMes(mes, n) { var d = new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7) - 1 + n, 1)); return d.toISOString().slice(0, 7); }
  // Toque no calendário: 1º toque = dia do embarque; 2º = último dia de embarque (22/11/2026; ANTES "a partir de" e "volta até") (antes do 1º = recomeça daquele dia).
  function tocarDia(de, ate, dia) {
    if (!de || ate) return { de: dia, ate: "" };
    if (dia < de) return { de: dia, ate: "" };
    return { de: de, ate: dia };
  }
  var SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  function diaDaSemana(iso) { return SEMANA[new Date(iso + "T12:00:00Z").getUTCDay()]; }
  function nomeMesCurto(iso) { return MESES[+iso.slice(5, 7) - 1]; }

  // Linha arredondada do gráfico (Leonardo, 21/11/2026: "tem como fazer que o gráfico dos preços fique arredondado?"):
  // curva monótona (Fritsch-Carlson), que passa por todos os pontos e nunca sobe além do maior nem desce abaixo do menor
  // entre dois dias (não inventa preço). pts = [[x, y], ...] com x crescente. ANTES: retas entre os pontos.
  function caminhoSuave(pts) {
    var n = pts.length;
    if (!n) return "";
    function f1(v) { return (Math.round(v * 10) / 10).toString(); }
    if (n === 1) return "M" + f1(pts[0][0]) + " " + f1(pts[0][1]);
    var dx = [], m = [], t = [];
    for (var i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = dx[i] ? (pts[i + 1][1] - pts[i][1]) / dx[i] : 0; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      var a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { var k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    var d = "M" + f1(pts[0][0]) + " " + f1(pts[0][1]);
    for (i = 0; i < n - 1; i++) {
      var h = dx[i] / 3;
      d += "C" + f1(pts[i][0] + h) + " " + f1(pts[i][1] + t[i] * h) + " " + f1(pts[i + 1][0] - h) + " " + f1(pts[i + 1][1] - t[i + 1] * h) +
        " " + f1(pts[i + 1][0]) + " " + f1(pts[i + 1][1]);
    }
    return d;
  }

  // Pacote de bebidas ao lado do histórico (Leonardo, 21/11/2026: o histórico é só do cruzeiro, sem bebidas; o pacote vai
  // numa linha à parte). Do histórico do pacote (pk_<nível>) tira o valor mais recente por adulto, o dia dessa leitura e
  // desde quando ele não muda (só quando houve mais de uma leitura com o mesmo valor). null = sem leitura.
  function pacoteNoHistorico(hist, id, a, b) {
    var h = hist && hist.saidas && hist.saidas[id] && hist.saidas[id][String(a)];
    var l = h && h["pk_" + b];
    if (!l || !l.length) return null;
    var ult = l[l.length - 1], k = l.length - 1;
    while (k > 0 && l[k - 1][1] === ult[1]) k--;
    return { v: ult[1], lidoEm: hist.dias[ult[0]], desde: k < l.length - 1 ? hist.dias[l[k][0]] : "" };
  }

  // Faixa do preço, como no Google Flights (Leonardo, 21/11/2026): de pts da linhaDoTempo tira o preço de hoje (o último
  // dia lido), o menor e o maior (com o dia; empate = o dia mais recente), onde o de hoje fica entre eles (pos 0 a 1) e o
  // nível: baixo (terço de baixo), medio, alto (terço de cima) ou estavel (sempre o mesmo). Esgotada hoje = hoje null.
  // Alerta de menor/maior preço: hoje igual ao menor ou ao maior, com preços diferentes no histórico.
  function temAlerta(fx) {
    return !!(fx && fx.hoje && !fx.hoje.inc && fx.min.v !== fx.max.v && (fx.hoje.v === fx.min.v || fx.hoje.v === fx.max.v));
  }

  function faixaPreco(pts) {
    // Dia só com bebida inclusa (p[3], 22/11/2026, Leonardo: "Não pode confundir tudo?") não entra no menor, no maior nem
    // no "Em alta/Em baixa": é outro tipo de preço. Hoje assim = "Preço de hoje" com o selo "Bebida inclusa" (nivel "inclusa").
    var ok = (pts || []).filter(function (p) { return p[1] !== null && !p[3]; });
    if (ok.length < 2) return null;
    var ul = pts[pts.length - 1];
    if (ul[3] && ul[1] !== null) {
      var mi = ok[0], ma = ok[0];
      ok.forEach(function (p) { if (p[1] <= mi[1]) mi = p; if (p[1] >= ma[1]) ma = p; });
      return { hoje: { v: ul[1], dia: ul[0], inc: true }, min: { v: mi[1], dia: mi[0] }, max: { v: ma[1], dia: ma[0] }, pos: null, nivel: "inclusa" };
    }
    var min = ok[0], max = ok[0];
    ok.forEach(function (p) { if (p[1] <= min[1]) min = p; if (p[1] >= max[1]) max = p; });
    // Menor e maior repetidos: vale sempre o ÚLTIMO dia com esse preço, para os dois (Leonardo, 21/11/2026: "só não pode
    // ficar um padrão diferente para cada lugar... defina se vai ser o primeiro ou o último dia"; o mais recente mostra que
    // esteve nesse preço há pouco). ANTES: menor = 1º dia da última sequência ("desde dd/mm"), maior = último dia.
    var ult = pts[pts.length - 1], hoje = ult[1] === null ? null : { v: ult[1], dia: ult[0] };
    var r = { hoje: hoje, min: { v: min[1], dia: min[0] }, max: { v: max[1], dia: max[0] }, pos: null, nivel: "estavel" };
    if (hoje && max[1] > min[1]) {
      r.pos = (hoje.v - min[1]) / (max[1] - min[1]);
      r.nivel = r.pos <= 1 / 3 ? "baixo" : r.pos >= 2 / 3 ? "alto" : "medio";
    } else if (hoje) r.pos = 0.5;
    else {
      r.nivel = "esgotada";
      // Último preço antes de esgotar, para o quadro dizer "último preço R$ X em dd/mm" (Leonardo, 21/11/2026: "Se é
      // esgotada, tem que dizer que tá esgotado"). ANTES: só o selo "Esgotada", sem o último preço.
      var u = ok[ok.length - 1];
      r.ultimo = { v: u[1], dia: u[0] };
    }
    return r;
  }

  // Convite da calculadora de bebidas (passo 4B). salvaB = pacote do link ("entender" = marcou "Quero entender a
  // diferença"); telaB = o pacote que está na tela. Sem pacote e sem "entender" = sem convite (null).
  // Texto único (Leonardo, 21/11/2026: "o cliente vai mudando o pacote"; "Sim, texto único"). ANTES: com pacote na tela
  // era "Escolheu o pacote <nível>? A calculadora mostra em 1 minuto se ele vale a pena para o que você bebe." +
  // botão "Confira se este pacote é o ideal".
  function conviteCalc(salvaB, telaB) {
    var tem = salvaB === "entender" || telaB === "entender" || telaB === "soft" || telaB === "basico" || telaB === "premium";
    if (!tem) return null;
    return { tipo: "entender", titulo: "Em dúvida sobre o pacote de bebidas?",
      texto: "A calculadora mostra em 1 minuto qual vale mais a pena para você.", botao: "Descobrir o pacote de bebidas ideal" };
    // "de bebidas" no botão (Leonardo, 21/11/2026: "Descobrir o pacote ideal fica muito vago. Pacote pode ser do cruzeiro").
    // ANTES: "Descobrir o pacote ideal".
  }
  // Link da calculadora: ?id=<código>&adultos=N e, com a saída, &saida=<id>&cia=msc|costa&noites=N (preço do pacote dela).
  // w = WhatsApp do contato (21/11/2026, Leonardo: o link não pode ficar sem o telefone): a calculadora salva o pacote
  // pelo número do link, sem depender do aparelho. ANTES: ia sem o w.
  // pesq (opcional): a pesquisa da tela (MV.linkPesquisa(f, "")). Com ela a calculadora sabe que veio do site e, no
  // "Usar este pacote", volta para a pesquisa em vez de mandar ao WhatsApp (21/11/2026).
  // cr (opcional): crianças de 2 a 17 anos, as que pagam pacote de bebidas (22/11/2026); vai como "cr" (1 a 4).
  function linkCalc(id, adultos, s, w, pesq, cr) {
    var q = [];
    if (/^[A-Za-z0-9_-]{1,40}$/.test(String(id || ""))) q.push("id=" + id);
    var a = parseInt(adultos, 10);
    if (a >= 1 && a <= 4) q.push("adultos=" + a);
    if (s && s.id) q.push("saida=" + encodeURIComponent(s.id), "cia=" + (String(s.cia).toLowerCase() === "costa" ? "costa" : "msc"), "noites=" + s.noites);
    if (/^\d{10,15}$/.test(String(w || ""))) q.push("w=" + w);
    var nc = parseInt(cr, 10);
    if (nc >= 1 && nc <= 4) q.push("cr=" + nc);
    if (/^\?t=/.test(String(pesq || ""))) q.push("pesq=" + encodeURIComponent(String(pesq).slice(1)));
    return q.length ? "?" + q.join("&") : "";
  }

  var api = { temAlerta: temAlerta, caminhoSuave: caminhoSuave, pacoteNoHistorico: pacoteNoHistorico, faixaPreco: faixaPreco, conviteCalc: conviteCalc, linkCalc: linkCalc, criancasPagantes: criancasPagantes, temporada: temporada, temporadas: temporadas, lerCabines: lerCabines, cabinesDe: cabinesDe, nomeTemporada: nomeTemporada, mesesDaTemporada: mesesDaTemporada, periodoLink: periodoLink, paginar: paginar, mascaraData: mascaraData, lerDataBR: lerDataBR, dataBR: dataBR,
    semanasDoMes: semanasDoMes, somaMes: somaMes, tocarDia: tocarDia, diaDaSemana: diaDaSemana, nomeMesCurto: nomeMesCurto, MESES: MESES,
    LISTAS: LISTAS, PADRAO: PADRAO, CARNAVAL: CARNAVAL, lerPeriodo: lerPeriodo, lerData: lerData, nomeMes: nomeMes,
    nomePeriodo: nomePeriodo, janela: janela, mesesComSaida: mesesComSaida, CABINES: CABINES, NOME_CABINE: NOME_CABINE, NOME_NIVEL: NOME_NIVEL,
    lerIdades: lerIdades, textoIdades: textoIdades, lotacao: lotacao, gente: gente, msgIdades: msgIdades, msgSaida: msgSaida, PERGUNTAS_SAIDA: PERGUNTAS_SAIDA,
    lerPesquisa: lerPesquisa, volta: volta, doTipo: doTipo, noPeriodo: noPeriodo, pacote: pacote, rotaTexto: rotaTexto, paradas: paradas, paradasAlternam: paradasAlternam, total: total, precoOrdem: precoOrdem,
    incluso: incluso,
    filtrar: filtrar, esgotadaNa: esgotadaNa, outraComPreco: outraComPreco, maisProximas: maisProximas, pesquisaDe: pesquisaDe, mesmaPesquisa: mesmaPesquisa, montarEnvio: montarEnvio,
    linkPesquisa: linkPesquisa, resumo: resumo, resumoBarra: resumoBarra, conferirWhats: conferirWhats, linhaDoTempo: linhaDoTempo };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.MV = api;
})(this);
