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
    k: ["int", "ext", "var", "todas"],
    b: ["sem", "soft", "basico", "premium", "entender"],
  };
  var PADRAO = { t: "todos", p: "todas", a: "2", c: "0", k: "todas", b: "sem" };

  // Quando (Leonardo, 21/11/2026: "todos os meses... fora o carnaval, que vai ficar separado também de fevereiro, e um
  // campo para informar a data inicial e final"). Carnaval = sábado a quarta de cinzas: entra a saída que tem algum dia
  // nessa janela (o mês de fevereiro continua com todas as saídas de fevereiro).
  var CARNAVAL = {
    carn27: { nome: "Carnaval 2027", de: "2027-02-06", ate: "2027-02-10" },
    carn28: { nome: "Carnaval 2028", de: "2028-02-26", ate: "2028-03-01" },
  };
  var ANTIGOS = { nd26: "m2611.m2612", jf27: "m2701.m2702", ma27: "m2703.m2704" };   // códigos do Lead Ads
  var MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function mesDe(iso) { return "m" + iso.slice(2, 4) + iso.slice(5, 7); }
  function nomeMes(m) { return MESES[+m.slice(3, 5) - 1] + " 20" + m.slice(1, 3); }
  function chaveOrdem(x) { return CARNAVAL[x] ? CARNAVAL[x].de.slice(2, 4) + CARNAVAL[x].de.slice(5, 7) + "z" : x.slice(1); }
  // "m2611.carn27" -> ["m2611", "carn27"] (ordenado, sem repetir, só códigos válidos); vazio = todas as datas
  function lerPeriodo(v) {
    v = String(v || "").trim().toLowerCase();
    if (ANTIGOS[v]) v = ANTIGOS[v];
    var ok = {};
    v.split(".").forEach(function (x) {
      if (/^m\d\d(0[1-9]|1[0-2])$/.test(x) || CARNAVAL[x]) ok[x] = 1;
    });
    return Object.keys(ok).sort(function (a, b) { return chaveOrdem(a) < chaveOrdem(b) ? -1 : 1; });
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
    r.p = lerPeriodo(q.p).join(".") || "todas";
    r.de = lerData(q.de);
    r.ate = lerData(q.ate);
    if (r.de && r.ate && r.ate < r.de) { var x = r.de; r.de = r.ate; r.ate = x; }
    // código do contato: só letras, números, _ e -; "{{contact.id}}" que não foi trocado pelo Entur = sem código
    var id = String(q.id || "");
    r.id = /^[A-Za-z0-9_-]{1,40}$/.test(id) ? id : "";
    return r;
  }

  function addDias(iso, n) { var d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function volta(s) { return addDias(s.embarque, s.noites); }
  function doTipo(s, t) { return t === "mini" ? s.noites <= 4 : t === "longo" ? s.noites >= 5 : true; }
  // Datas do cliente valem sobre os meses: a viagem inteira dentro da janela (embarca a partir de "de", volta até "ate").
  // Sem datas: embarque num dos meses marcados, ou algum dia no Carnaval marcado. Nada marcado = todas.
  function noPeriodo(s, f) {
    if (typeof f === "string") f = { p: f };
    if (f.de || f.ate) return (!f.de || s.embarque >= f.de) && (!f.ate || volta(s) <= f.ate);
    var ps = lerPeriodo(f.p);
    if (!ps.length) return true;
    return ps.some(function (x) {
      var c = CARNAVAL[x];
      return c ? (s.embarque <= c.ate && volta(s) >= c.de) : mesDe(s.embarque) === x;
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
      if (c) { ds.push(c.de); as.push(c.ate); return; }
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
  function pacote(s, b) {
    if (b !== "soft" && b !== "basico" && b !== "premium") return { v: 0, nome: "" };
    var p = (s.pacotes || {})[b];
    return p ? { v: p.v, nome: p.nome, lidoEm: p.lidoEm } : null;
  }

  // Total da cabine para os adultos, com o pacote: cabine + adultos x pacote por adulto (regra do termômetro).
  // undefined = sem preço de hoje para essa lotação/cabine; null = esgotada; pacote pedido que não existe = sem total.
  function total(s, a, cab, b) {
    var o = (s.ocup || {})[String(a)];
    if (!o || !(cab in o.cab)) return undefined;
    var v = o.cab[cab];
    if (v === null) return null;
    var pk = pacote(s, b);
    if (!pk) return undefined;
    return Math.round(v + Number(a) * pk.v);
  }

  // Preço que ordena a saída: o da cabine escolhida; "todas" = a cabine mais em conta disponível.
  function precoOrdem(s, f) {
    if (f.k !== "todas") { var t = total(s, f.a, f.k, f.b); return typeof t === "number" ? t : null; }
    var m = null;
    CABINES.forEach(function (c) { var t = total(s, f.a, c, f.b); if (typeof t === "number" && (m === null || t < m)) m = t; });
    return m;
  }

  // Lista da página. f = { t, p, a, b, k, navio, ordem: "preco" | "data" }, hoje = AAAA-MM-DD.
  // Volta { lista: com preço, semPreco: cabem nos filtros mas sem preço de hoje para esses adultos }.
  function filtrar(saidas, f, hoje) {
    var base = saidas.filter(function (s) {
      return s.embarque > hoje && doTipo(s, f.t) && noPeriodo(s, f) && (!f.navio || s.navio === f.navio);
    });
    var lista = [], semPreco = [];
    base.forEach(function (s) { (precoOrdem(s, f) === null ? semPreco : lista).push(s); });
    lista.sort(function (x, y) {
      if (f.ordem === "data") return x.embarque < y.embarque ? -1 : x.embarque > y.embarque ? 1 : precoOrdem(x, f) - precoOrdem(y, f);
      return precoOrdem(x, f) - precoOrdem(y, f) || (x.embarque < y.embarque ? -1 : 1);
    });
    return { lista: lista, semPreco: semPreco };
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
  var CAMPOS = ["t", "p", "de", "ate", "a", "c", "k", "b"];
  function pesquisaDe(f) {
    var r = {};
    Object.keys(LISTAS).forEach(function (k) { r[k] = LISTAS[k].indexOf(String(f[k])) >= 0 ? String(f[k]) : PADRAO[k]; });
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
    return { telefone: "+" + telefone, id: id, t: p.t, p: p.p, de: p.de.replace(/-/g, ""), ate: p.ate.replace(/-/g, ""),
      a: p.a, c: p.c, k: p.k, b: p.b, hp: hp || "" };
  }

  // Endereço da página com a pesquisa (o mesmo que o Entur monta com os campos mv_*).
  function linkPesquisa(f, id) {
    var p = pesquisaDe(f);
    return "?t=" + p.t + "&p=" + p.p + (p.de ? "&de=" + p.de.replace(/-/g, "") : "") + (p.ate ? "&ate=" + p.ate.replace(/-/g, "") : "") + "&a=" + p.a + "&c=" + p.c + "&k=" + p.k + "&b=" + p.b + (id ? "&id=" + id : "");
  }

  function dmA(iso) { return iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4); }
  // "nov e dez 2026", "dez 2026 e jan 2027", "Carnaval 2027", "de 05/01/2027 a 20/01/2027"
  function nomePeriodo(f) {
    if (f.de && f.ate) return "de " + dmA(f.de) + " a " + dmA(f.ate);
    if (f.de) return "a partir de " + dmA(f.de);
    if (f.ate) return "voltando até " + dmA(f.ate);
    var ps = lerPeriodo(f.p);
    if (!ps.length) return "todas as datas";
    var nomes = [], meses = ps.filter(function (x) { return !CARNAVAL[x]; });
    meses.forEach(function (m, i) {
      var prox = meses[i + 1];
      nomes.push(MESES[+m.slice(3, 5) - 1] + (prox && prox.slice(1, 3) === m.slice(1, 3) ? "" : " 20" + m.slice(1, 3)));
    });
    ps.forEach(function (x) { if (CARNAVAL[x]) nomes.push(CARNAVAL[x].nome); });
    return nomes.length === 1 ? nomes[0] : nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
  }

  // Resumo curto da pesquisa para o topo: "3 e 4 noites · jan/fev 2027 · 2 adultos · Varanda · pacote básico".
  function resumo(f) {
    var p = pesquisaDe(f), partes = [];
    partes.push(p.t === "mini" ? "3 e 4 noites" : p.t === "longo" ? "5 noites ou mais" : "qualquer duração");
    partes.push(nomePeriodo(p));
    var gente = p.a === "5" ? "5 ou mais adultos" : p.a + (p.a === "1" ? " adulto" : " adultos");
    if (p.c !== "0") gente += " e " + p.c + (p.c === "1" ? " criança" : " crianças");
    partes.push(gente);
    partes.push(p.k === "todas" ? "todas as cabines" : NOME_CABINE[p.k]);
    partes.push(p.b === "entender" ? "pacote de bebidas a decidir" : NOME_NIVEL[p.b]);
    return partes.join(" · ");
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
      if (pk) {
        var ult = null;
        pk.forEach(function (q) { if (q[0] <= p[0]) ult = q; });
        if (!ult) return;   // sem pacote lido até esse dia: não dá para mostrar o total com pacote
        extra = Number(a) * ult[1];
      }
      out.push([dia, v === 0 ? null : Math.round(v + extra), p[2] === 1]);
    });
    return out;
  }

  var api = { LISTAS: LISTAS, PADRAO: PADRAO, CARNAVAL: CARNAVAL, lerPeriodo: lerPeriodo, lerData: lerData, nomeMes: nomeMes,
    nomePeriodo: nomePeriodo, janela: janela, mesesComSaida: mesesComSaida, CABINES: CABINES, NOME_CABINE: NOME_CABINE, NOME_NIVEL: NOME_NIVEL,
    lerPesquisa: lerPesquisa, volta: volta, doTipo: doTipo, noPeriodo: noPeriodo, pacote: pacote, total: total, precoOrdem: precoOrdem,
    filtrar: filtrar, maisProximas: maisProximas, pesquisaDe: pesquisaDe, mesmaPesquisa: mesmaPesquisa, montarEnvio: montarEnvio,
    linkPesquisa: linkPesquisa, resumo: resumo, conferirWhats: conferirWhats, linhaDoTempo: linhaDoTempo };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.MV = api;
})(this);
