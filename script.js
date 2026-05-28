const canvas = document.querySelector("#signalCanvas");
const ctx = canvas.getContext("2d");
const scrollMeter = document.querySelector(".scroll-meter");
const reveals = document.querySelectorAll("[data-reveal]");
const counters = document.querySelectorAll("[data-count]");
const tiltCards = document.querySelectorAll("[data-tilt]");
const contactButton = document.querySelector("#contactButton");
const formNote = document.querySelector("#formNote");
const contactForm = document.querySelector(".contact-form");
const topbar = document.querySelector(".topbar");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav a");
const navCta = document.querySelector(".nav-cta");
const analyzerForm = document.querySelector("#instagramAnalyzerForm");
const analyzerResult = document.querySelector("#analyzerResult");
const analyzerNote = document.querySelector("#analyzerNote");
const whatsappNumber = "5511924638012";

let width = 0;
let height = 0;
let particles = [];
let counterStarted = false;
let latestAnalyzerReport = null;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  particles = Array.from({ length: Math.min(110, Math.floor(width / 12)) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.38,
    vy: (Math.random() - 0.5) * 0.38,
    r: Math.random() * 1.7 + 0.6,
  }));
}

function drawNetwork() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(49, 245, 255, 0.72)";
  ctx.strokeStyle = "rgba(185, 255, 59, 0.1)";

  for (const particle of particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);

      if (distance < 118) {
        ctx.globalAlpha = 1 - distance / 118;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(drawNetwork);
}

function updateScrollMeter() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  scrollMeter.style.width = `${progress * 100}%`;
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

function startCounters() {
  if (counterStarted) return;
  counterStarted = true;

  counters.forEach((counter) => {
    const target = Number(counter.dataset.count);
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased).toLocaleString("pt-BR");

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

const proofObserver = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) startCounters();
  },
  { threshold: 0.35 }
);

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${y * -7}deg) rotateY(${x * 9}deg) translateY(-8px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

contactButton?.addEventListener("click", () => {
  const formData = new FormData(contactForm);
  const name = formData.get("name")?.toString().trim() || "Não informado";
  const contact = formData.get("contact")?.toString().trim() || "Não informado";
  const goal = formData.get("goal")?.toString().trim() || "Não informado";
  const message = formData.get("message")?.toString().trim() || "Não informado";
  const whatsappMessage = [
    "Olá, quero falar com a Tennta.",
    "",
    `Nome: ${name}`,
    `Email/WhatsApp: ${contact}`,
    `Objetivo: ${goal}`,
    `Mensagem: ${message}`,
  ].join("\n");

  formNote.textContent = "Abrindo WhatsApp com os dados do formulário...";
  window.open(
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`,
    "_blank",
    "noreferrer"
  );
});

menuToggle?.addEventListener("click", () => {
  const isOpen = topbar.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    topbar.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Abrir menu");
  });
});

navCta?.addEventListener("click", () => {
  topbar.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Abrir menu");
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

function renderAnalyzerList(items = []) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`;
}

function renderReportRows(items = []) {
  return items
    .map(
      (item) => `
        <article class="analyzer-idea">
          <strong>${escapeHtml(item.fraqueza || item.sinal || "Ponto de analise")}</strong>
          <p>${escapeHtml(item.impacto || item.fonte || "")}</p>
          <p>${escapeHtml(item.correcao || item.aplicacao || "")}</p>
        </article>
      `
    )
    .join("");
}

function getAnalyzerPayload(formData) {
  return {
    handle: formData.get("handle"),
    niche: formData.get("niche"),
    bio: formData.get("bio"),
    followers: Number(formData.get("followers") || 0),
    averageLikes: Number(formData.get("averageLikes") || 0),
    averageComments: Number(formData.get("averageComments") || 0),
    postingFrequency: formData.get("postingFrequency"),
    posts: String(formData.get("posts") || "")
      .split("\n")
      .map((post) => post.trim())
      .filter(Boolean),
  };
}

function renderAnalyzerResult(analysis) {
  const ideas = Array.isArray(analysis.ideiasDeConteudo) ? analysis.ideiasDeConteudo : [];
  const calendar = Array.isArray(analysis.calendario7Dias) ? analysis.calendario7Dias : [];
  const weaknesses = Array.isArray(analysis.fraquezasDetalhadas) ? analysis.fraquezasDetalhadas : [];
  const trends = Array.isArray(analysis.tendenciasAtuais) ? analysis.tendenciasAtuais : [];

  analyzerResult.innerHTML = `
    <div class="analyzer-score">
      <div>
        <span>Score</span>
        <strong>${escapeHtml(String(analysis.notaGeral ?? "--"))}</strong>
      </div>
      <p>${escapeHtml(analysis.diagnostico || "Analise gerada.")}</p>
    </div>
    <div class="report-actions">
      <button class="report-download" type="button" id="downloadAnalyzerReport">Baixar relatorio</button>
    </div>
    <div class="analyzer-block">
      <h3>Resumo executivo</h3>
      <p>${escapeHtml(analysis.resumoExecutivo || analysis.diagnostico || "")}</p>
    </div>
    <div class="analyzer-block">
      <h3>Bio sugerida</h3>
      <p>${escapeHtml(analysis.bioMelhorada || "")}</p>
    </div>
    <div class="analyzer-block">
      <h3>Gargalos</h3>
      ${renderAnalyzerList(analysis.gargalos)}
    </div>
    <div class="analyzer-block">
      <h3>Fraquezas e correcoes</h3>
      ${renderReportRows(weaknesses)}
    </div>
    <div class="analyzer-block">
      <h3>Tendencias atuais e oportunidades</h3>
      ${renderReportRows(trends)}
      ${renderAnalyzerList(analysis.oportunidadesContextuais)}
    </div>
    <div class="analyzer-block">
      <h3>Ideias de conteudo</h3>
      ${ideas
        .map(
          (idea) => `
            <article class="analyzer-idea">
              <strong>${escapeHtml(idea.titulo || "Ideia de conteudo")}</strong>
              <span>${escapeHtml(idea.formato || "")}</span>
              <p>${escapeHtml(idea.motivo || "")}</p>
              ${renderAnalyzerList(idea.roteiroCurto)}
            </article>
          `
        )
        .join("")}
    </div>
    <div class="analyzer-block">
      <h3>Plano de 7 dias</h3>
      <ol>
        ${calendar
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.dia || "")}:</strong> ${escapeHtml(
                item.acao || ""
              )} (${escapeHtml(item.objetivo || "")})</li>`
          )
          .join("")}
      </ol>
    </div>
    <div class="analyzer-block">
      <h3>Prioridades</h3>
      ${renderAnalyzerList(analysis.prioridades)}
    </div>
  `;

}

function renderAnalyzerError(message) {
  analyzerResult.innerHTML = `<p class="analyzer-error">${escapeHtml(message)}</p>`;
}

function reportList(items = []) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`;
}

function reportCards(items = [], titleKey, bodyKeys) {
  return items
    .map(
      (item) => `
        <article class="report-card">
          <h3>${escapeHtml(item[titleKey] || "Item")}</h3>
          ${bodyKeys.map((key) => `<p>${escapeHtml(item[key] || "")}</p>`).join("")}
        </article>
      `
    )
    .join("");
}

function buildReportHtml(payload, analysis) {
  const generatedAt = new Date().toLocaleString("pt-BR");
  const ideas = Array.isArray(analysis.ideiasDeConteudo) ? analysis.ideiasDeConteudo : [];
  const calendar = Array.isArray(analysis.calendario7Dias) ? analysis.calendario7Dias : [];
  const trends = Array.isArray(analysis.tendenciasAtuais) ? analysis.tendenciasAtuais : [];
  const weaknesses = Array.isArray(analysis.fraquezasDetalhadas) ? analysis.fraquezasDetalhadas : [];
  const logoUrl = `${window.location.origin}/logo.svg`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Diagnostico Instagram Tennta - ${escapeHtml(String(payload.handle || ""))}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; background: #dfe7f0; font-family: Arial, Helvetica, sans-serif; line-height: 1.55; }
    .page { width: min(1120px, calc(100% - 32px)); margin: 28px auto; background: #fff; border-radius: 28px; overflow: hidden; box-shadow: 0 34px 110px rgba(15, 23, 42, 0.22); }
    header { position: relative; min-height: 420px; padding: 44px 52px; color: #fff; overflow: hidden; background: radial-gradient(circle at 85% 10%, rgba(185,255,59,.35), transparent 24rem), radial-gradient(circle at 10% 20%, rgba(49,245,255,.28), transparent 25rem), linear-gradient(135deg, #05060a, #101827 58%, #0f3338); }
    header:before { position: absolute; inset: 0; content: ""; opacity: .18; background-image: linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px); background-size: 54px 54px; }
    header > * { position: relative; }
    header img { width: 240px; max-height: 80px; object-fit: contain; filter: brightness(1.2); }
    header h1 { max-width: 760px; margin: 70px 0 16px; font-size: 54px; line-height: .96; letter-spacing: -1px; }
    header p { max-width: 720px; margin: 0; color: #cbd5e1; font-size: 18px; }
    section { padding: 34px 52px; border-top: 1px solid #e5e7eb; }
    h2 { margin: 0 0 16px; font-size: 25px; color: #0f172a; }
    h3 { margin: 0 0 8px; font-size: 18px; color: #111827; }
    p, li { color: #475569; font-size: 15px; }
    ul, ol { padding-left: 22px; }
    .score { display: grid; grid-template-columns: 190px 1fr; gap: 30px; align-items: center; background: linear-gradient(135deg, #f8fafc, #ecfeff); }
    .score strong { display: block; color: #0891b2; font-size: 96px; line-height: .9; }
    .badge { display: inline-block; margin-bottom: 8px; color: #365314; background: #d9f99d; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .score-meter { height: 12px; overflow: hidden; border-radius: 999px; background: #dbeafe; }
    .score-meter span { display: block; width: ${Math.min(Number(analysis.notaGeral || 0), 100)}%; height: 100%; background: linear-gradient(90deg, #06b6d4, #84cc16); }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .report-card { padding: 18px; border: 1px solid #e5e7eb; border-radius: 18px; background: linear-gradient(180deg, #fff, #f8fafc); box-shadow: 0 14px 34px rgba(15, 23, 42, .06); }
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .meta div { padding: 16px; background: #f8fafc; border-radius: 16px; border: 1px solid #e5e7eb; }
    .meta span { display: block; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .pill-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .pill-row span { display: inline-flex; padding: 8px 11px; border-radius: 999px; color: #164e63; background: #cffafe; font-size: 13px; font-weight: 700; }
    .matrix { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .panel { padding: 22px; border-radius: 22px; background: #0f172a; }
    .panel h2, .panel h3 { color: #fff; }
    .panel p, .panel li { color: #cbd5e1; }
    .panel.light { color: #111827; background: #f8fafc; border: 1px solid #e5e7eb; }
    .panel.light h2, .panel.light h3 { color: #111827; }
    .panel.light p, .panel.light li { color: #475569; }
    footer { padding: 24px 42px; color: #64748b; background: #f8fafc; }
    @media (max-width: 760px) { header h1 { font-size: 36px; } .score, .grid, .meta, .matrix { grid-template-columns: 1fr; } }
    @media print { body { background: #fff; } .page { width: 100%; margin: 0; box-shadow: none; border-radius: 0; } header { min-height: 330px; } }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <img src="${logoUrl}" alt="Tennta Marketing Digital" />
      <h1>Diagnostico profissional de Instagram</h1>
      <p>Relatorio gerado pela Tennta Marketing Digital em ${escapeHtml(generatedAt)}</p>
    </header>
    <section class="score">
      <div><span class="badge">Score</span><strong>${escapeHtml(String(analysis.notaGeral ?? "--"))}</strong></div>
      <div>
        <h2>${escapeHtml(String(payload.handle || "Perfil analisado"))}</h2>
        <p>${escapeHtml(analysis.resumoExecutivo || analysis.diagnostico || "")}</p>
        <div class="score-meter"><span></span></div>
      </div>
    </section>
    <section class="meta">
      <div><span>Nicho</span>${escapeHtml(String(payload.niche || "Nao informado"))}</div>
      <div><span>Seguidores</span>${escapeHtml(String(payload.followers || "Nao informado"))}</div>
      <div><span>Frequencia</span>${escapeHtml(String(payload.postingFrequency || "Nao informado"))}</div>
    </section>
    <section><h2>Bio sugerida</h2><p>${escapeHtml(analysis.bioMelhorada || "")}</p></section>
    <section class="matrix">
      <div class="panel light"><h2>Pontos fortes</h2>${reportList(analysis.pontosFortes)}</div>
      <div class="panel"><h2>Gargalos principais</h2>${reportList(analysis.gargalos)}</div>
    </section>
    <section><h2>Fraquezas e correcoes</h2><div class="grid">${reportCards(weaknesses, "fraqueza", ["impacto", "correcao"])}</div></section>
    <section><h2>Tendencias atuais e oportunidades</h2><div class="grid">${reportCards(trends, "sinal", ["fonte", "aplicacao"])}</div>${reportList(analysis.oportunidadesContextuais)}</section>
    <section><h2>Ideias de conteudo</h2><div class="grid">${reportCards(ideas, "titulo", ["formato", "motivo"])}</div></section>
    <section><h2>Plano de 7 dias</h2><ol>${calendar
      .map(
        (item) =>
          `<li><strong>${escapeHtml(item.dia || "")}:</strong> ${escapeHtml(item.acao || "")} (${escapeHtml(
            item.objetivo || ""
          )})</li>`
      )
      .join("")}</ol></section>
    <section><h2>Prioridades</h2>${reportList(analysis.prioridades)}</section>
    <section><h2>Hashtags recomendadas</h2><div class="pill-row">${(analysis.hashtags || [])
      .map((tag) => `<span>${escapeHtml(String(tag))}</span>`)
      .join("")}</div></section>
    <footer>Tennta Marketing Digital | Relatorio consultivo gerado com IA e revisao estrategica automatizada.</footer>
  </main>
</body>
</html>`;
}

function getAnalyzerReportData() {
  if (!latestAnalyzerReport) {
    throw new Error("Gere um diagnostico antes de baixar o relatorio.");
  }

  const html = buildReportHtml(latestAnalyzerReport.payload, latestAnalyzerReport.analysis);
  const handle = String(latestAnalyzerReport.payload.handle || "perfil").replace(/[^a-z0-9_-]+/gi, "-");

  return {
    filename: `diagnostico-tennta-${handle}.pdf`,
    html,
  };
}

async function downloadAnalyzerReport() {
  const report = getAnalyzerReportData();

  if (!window.html2pdf) {
    throw new Error("O gerador de PDF ainda nao carregou. Atualize a pagina e tente novamente.");
  }

  const frame = document.createElement("iframe");
  frame.className = "pdf-render-frame";
  frame.setAttribute("aria-hidden", "true");
  document.body.appendChild(frame);

  const frameDoc = frame.contentDocument || frame.contentWindow.document;
  frameDoc.open();
  frameDoc.write(report.html);
  frameDoc.close();

  await new Promise((resolve) => {
    frame.onload = resolve;
    setTimeout(resolve, 1200);
  });

  const reportElement = frameDoc.querySelector(".page");

  if (!reportElement) {
    frame.remove();
    throw new Error("Nao foi possivel montar o relatorio em PDF.");
  }

  await window.html2pdf()
    .set({
      margin: [0.18, 0.18, 0.18, 0.18],
      filename: report.filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#dfe7f0",
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [".report-card", ".panel", ".meta div"],
      },
    })
    .from(reportElement)
    .save();

  frame.remove();
  analyzerNote.textContent = "Relatorio em PDF baixado.";
}

function ensureLeadModal() {
  let modal = document.querySelector("#leadReportModal");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.id = "leadReportModal";
  modal.className = "lead-modal";
  modal.innerHTML = `
    <div class="lead-modal__backdrop" data-close-lead-modal></div>
    <form class="lead-modal__dialog" id="leadReportForm">
      <button class="lead-modal__close" type="button" data-close-lead-modal aria-label="Fechar">x</button>
      <p class="kicker">Relatorio Tennta</p>
      <h3>Receba o diagnostico profissional</h3>
      <p>Preencha seus dados para liberar o download. A Tennta tambem recebe uma copia para acompanhar sua analise.</p>
      <label>
        Nome
        <input name="name" type="text" placeholder="Seu nome" required />
      </label>
      <label>
        Email
        <input name="email" type="email" placeholder="seuemail@empresa.com" required />
      </label>
      <label>
        WhatsApp
        <input name="whatsapp" type="tel" placeholder="(11) 99999-9999" required />
      </label>
      <button type="submit">Enviar e baixar relatorio</button>
      <small id="leadReportNote" role="status"></small>
    </form>
  `;
  document.body.appendChild(modal);
  return modal;
}

function openLeadModal() {
  const modal = ensureLeadModal();
  modal.classList.add("is-open");
  modal.querySelector("input")?.focus();
}

function closeLeadModal() {
  document.querySelector("#leadReportModal")?.classList.remove("is-open");
}

async function submitLeadAndDownload(form) {
  if (!latestAnalyzerReport) {
    throw new Error("Gere um diagnostico antes de baixar o relatorio.");
  }

  const note = form.querySelector("#leadReportNote");
  const button = form.querySelector("button[type='submit']");
  const originalText = button.textContent;
  const formData = new FormData(form);
  const lead = {
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
  };

  button.disabled = true;
  button.textContent = "Enviando...";
  note.textContent = "Registrando seus dados com seguranca...";

  try {
    const response = await fetch("/api/report-lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lead,
        profile: latestAnalyzerReport.payload,
        analysis: latestAnalyzerReport.analysis,
      }),
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.errors?.join(" ") || data.detail || data.error || "Nao foi possivel enviar seus dados.");
    }

    note.textContent = "Dados enviados. Baixando relatorio...";
    closeLeadModal();
    await downloadAnalyzerReport();
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

document.addEventListener("click", (event) => {
  const downloadButton = event.target.closest("#downloadAnalyzerReport");
  const closeLeadButton = event.target.closest("[data-close-lead-modal]");

  try {
    if (downloadButton) {
      openLeadModal();
    }

    if (closeLeadButton) {
      closeLeadModal();
    }
  } catch (error) {
    analyzerNote.textContent = error instanceof Error ? error.message : "Nao foi possivel gerar o relatorio.";
  }
});

document.addEventListener("submit", async (event) => {
  if (!event.target.matches("#leadReportForm")) {
    return;
  }

  event.preventDefault();

  try {
    await submitLeadAndDownload(event.target);
  } catch (error) {
    const note = event.target.querySelector("#leadReportNote");
    note.textContent = error instanceof Error ? error.message : "Nao foi possivel liberar o relatorio.";
  }
});

analyzerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = analyzerForm.querySelector("button");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Analisando...";
  analyzerNote.textContent = "Gerando diagnostico com IA...";

  try {
    const payload = getAnalyzerPayload(new FormData(analyzerForm));
    const response = await fetch("/api/instagram-analysis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        "A rota /api/instagram-analysis nao respondeu como JSON. Confira se o arquivo api/instagram-analysis.js existe no GitHub e se o deploy da Vercel terminou sem erro."
      );
    }

    if (!response.ok || !data.ok) {
      const message = data.errors?.join(" ") || data.detail || data.error || "Erro inesperado.";
      renderAnalyzerError(message);
      analyzerNote.textContent = "Revise os dados e tente novamente.";
      return;
    }

    latestAnalyzerReport = { payload, analysis: data.analysis };
    renderAnalyzerResult(data.analysis);
    analyzerNote.textContent = "Diagnostico gerado.";
  } catch (error) {
    renderAnalyzerError(error instanceof Error ? error.message : "Erro inesperado.");
    analyzerNote.textContent = "Nao foi possivel concluir a analise agora.";
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

reveals.forEach((item) => revealObserver.observe(item));
proofObserver.observe(document.querySelector(".proof-strip"));

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", updateScrollMeter, { passive: true });

resizeCanvas();
drawNetwork();
updateScrollMeter();
