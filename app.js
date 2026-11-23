const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const pasta = process.env.DATA_DIR || path.join(__dirname, "reservas");
fs.mkdirSync(pasta, { recursive: true });
const estilos = fs.readFileSync(path.join(__dirname, "estilo.css"), "utf8");
const servicos = [
  { id: "corte", nome: "Corte & finalização", preco: 85 },
  { id: "hidratacao", nome: "Hidratação capilar", preco: 70 },
  { id: "escova", nome: "Escova modelada", preco: 65 }
];
const horarios = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const formatarDia = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Fortaleza" });
function dataValida(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const dia = new Date(data + "T12:00:00-03:00");
  return Number.isFinite(dia.getTime()) && formatarDia.format(dia) === data &&
    data >= formatarDia.format(new Date()) && dia.getUTCDay() !== 0;
}
function arquivo(data, hora) {
  return path.join(pasta, data + "_" + hora.replace(":", "-") + ".json");
}
function futuro(data, hora) {
  return Date.parse(data + "T" + hora + ":00-03:00") > Date.now();
}
function pagina(res, status, conteudo) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1"><title>Ateliê Flora • Salão de beleza</title>
    <style>${estilos}</style></head><body><header><a href="/">✳ Ateliê Flora</a><span>Salão de beleza</span></header>
    <main>${conteudo}</main><footer>Ateliê Flora · Fortaleza <span>Projeto acadêmico · Grupo 8</span></footer></body></html>`);
}
function mensagem(res, codigo, titulo, texto) {
  pagina(res, codigo, `<section class="painel"><h1>${titulo}</h1><p>${texto}</p><a class="botao" href="/">Voltar ao agendamento</a></section>`);
}
function inicio(res) {
  const lista = servicos.map(s => `<li><span>${s.nome}</span><strong>R$ ${s.preco}</strong></li>`).join("");
  const opcoes = servicos.map(s => `<option value="${s.id}">${s.nome}</option>`).join("");
  pagina(res, 200, `<div class="grade"><section><h1>Menu de<br><em>beleza.</em></h1>
    <ul>${lista}</ul><p>Todos os serviços têm duração de 1 hora.</p></section>
    <section class="painel"><h2>Agende sua visita</h2><p>Segunda a sábado, no horário de Fortaleza.</p>
    <form action="/horarios"><label>Serviço<select name="servico">${opcoes}</select></label>
    <label>Data da visita<input type="date" required name="data" min="${formatarDia.format(new Date())}"></label>
    <button>Ver horários disponíveis →</button></form></section></div>`);
}
async function atender(req, res) {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/") return inicio(res);
  const consultar = req.method === "GET" && url.pathname === "/horarios";
  const reservar = req.method === "POST" && url.pathname === "/reservar";
  if (!consultar && !reservar) return mensagem(res, 404, "Página ausente", "Use a página de agendamento.");
  let campos = url.searchParams;
  if (reservar) {
    let corpo = "";
    for await (const parte of req) {
      if (corpo.length + parte.length > 2048) return mensagem(res, 413, "Envio muito grande", "Refaça o agendamento.");
      corpo += parte.toString();
    }
    campos = new URLSearchParams(corpo);
  }
  const data = campos.get("data");
  const servico = servicos.find(s => s.id === campos.get("servico"));
  if (!servico || !dataValida(data)) return mensagem(res, 400, "Confira a data e o serviço", "Escolha um serviço do salão e uma data de segunda a sábado, a partir de hoje.");
  const resumo = `${servico.nome} · R$ ${servico.preco} · ${data.split("-").reverse().join("/")}`;
  if (consultar) {
    const livres = horarios.filter(h => futuro(data, h) && !fs.existsSync(arquivo(data, h)));
    if (!livres.length) return mensagem(res, 200, "Agenda completa", "Escolha outra data para consultar os horários.");
    const opcoes = livres.map(h => `<option>${h}</option>`).join("");
    return pagina(res, 200, `<section class="painel"><h2>Escolha seu horário</h2><p>${resumo}</p>
      <form method="post" action="/reservar"><input type="hidden" name="data" value="${data}">
      <input type="hidden" name="servico" value="${servico.id}"><label>Horário em Fortaleza<select name="hora">${opcoes}</select></label>
      <button>Confirmar agendamento</button></form><a href="/">Alterar serviço ou data</a></section>`);
  }
  const hora = campos.get("hora");
  if (!horarios.includes(hora) || !futuro(data, hora)) return mensagem(res, 400, "Horário inválido", "Consulte os horários disponíveis.");
  const codigo = randomUUID().slice(0, 8).toUpperCase();
  try {
    fs.writeFileSync(arquivo(data, hora), JSON.stringify({ codigo, servico: servico.id, data, hora }), { flag: "wx" });
  } catch (erro) {
    if (erro.code === "EEXIST") return mensagem(res, 409, "Horário já reservado", "Escolha outro horário para sua visita.");
    throw erro;
  }
  mensagem(res, 201, "Agendamento confirmado", `${resumo}, às ${hora}.<br>Seu protocolo é <strong>${codigo}</strong>.`);
}
const porta = process.env.PORT || 3000;
http.createServer((req, res) => atender(req, res).catch(erro => {
  console.error(erro.message);
  mensagem(res, 500, "Falha ao processar", "Tente novamente em instantes.");
})).listen(porta, () => console.log("Ateliê Flora na porta " + porta));
