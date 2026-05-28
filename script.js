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
    <button class="report-download" type="button" id="downloadAnalyzerReport">Baixar relatorio profissional</button>
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

  document
    .querySelector("#downloadAnalyzerReport")
    ?.addEventListener("click", downloadAnalyzerReport);
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
    body { margin: 0; color: #111827; background: #eef2f7; font-family: Arial, Helvetica, sans-serif; line-height: 1.55; }
    .page { width: min(980px, calc(100% - 32px)); margin: 28px auto; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.14); }
    header { padding: 34px 42px; color: #fff; background: linear-gradient(135deg, #05060a, #12343b); }
    header img { width: 210px; max-height: 70px; object-fit: contain; filter: brightness(1.2); }
    header h1 { margin: 28px 0 8px; font-size: 34px; line-height: 1.05; }
    header p { margin: 0; color: #cbd5e1; }
    section { padding: 28px 42px; border-top: 1px solid #e5e7eb; }
    h2 { margin: 0 0 14px; font-size: 22px; color: #0f172a; }
    h3 { margin: 0 0 8px; font-size: 17px; color: #111827; }
    p, li { color: #475569; }
    ul, ol { padding-left: 22px; }
    .score { display: grid; grid-template-columns: 160px 1fr; gap: 24px; align-items: center; }
    .score strong { display: block; color: #0891b2; font-size: 76px; line-height: 1; }
    .badge { display: inline-block; margin-bottom: 8px; color: #365314; background: #d9f99d; padding: 5px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .report-card { padding: 16px; border: 1px solid #e5e7eb; border-radius: 14px; background: #f8fafc; }
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .meta div { padding: 14px; background: #f8fafc; border-radius: 12px; }
    .meta span { display: block; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    footer { padding: 24px 42px; color: #64748b; background: #f8fafc; }
    @media print { body { background: #fff; } .page { width: 100%; margin: 0; box-shadow: none; border-radius: 0; } }
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
      </div>
    </section>
    <section class="meta">
      <div><span>Nicho</span>${escapeHtml(String(payload.niche || "Nao informado"))}</div>
      <div><span>Seguidores</span>${escapeHtml(String(payload.followers || "Nao informado"))}</div>
      <div><span>Frequencia</span>${escapeHtml(String(payload.postingFrequency || "Nao informado"))}</div>
    </section>
    <section><h2>Bio sugerida</h2><p>${escapeHtml(analysis.bioMelhorada || "")}</p></section>
    <section><h2>Pontos fortes</h2>${reportList(analysis.pontosFortes)}</section>
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
    <footer>Tennta Marketing Digital | Relatorio consultivo gerado com IA e revisao estrategica automatizada.</footer>
  </main>
</body>
</html>`;
}

function downloadAnalyzerReport() {
  if (!latestAnalyzerReport) {
    return;
  }

  const html = buildReportHtml(latestAnalyzerReport.payload, latestAnalyzerReport.analysis);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const handle = String(latestAnalyzerReport.payload.handle || "perfil").replace(/[^a-z0-9_-]+/gi, "-");

  link.href = url;
  link.download = `diagnostico-tennta-${handle}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

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
