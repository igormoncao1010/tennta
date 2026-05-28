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

  analyzerResult.innerHTML = `
    <div class="analyzer-score">
      <div>
        <span>Score</span>
        <strong>${escapeHtml(String(analysis.notaGeral ?? "--"))}</strong>
      </div>
      <p>${escapeHtml(analysis.diagnostico || "Analise gerada.")}</p>
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

analyzerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = analyzerForm.querySelector("button");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Analisando...";
  analyzerNote.textContent = "Gerando diagnostico com IA...";

  try {
    const response = await fetch("/api/instagram-analysis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(getAnalyzerPayload(new FormData(analyzerForm))),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      const message = data.errors?.join(" ") || data.detail || data.error || "Erro inesperado.";
      renderAnalyzerError(message);
      analyzerNote.textContent = "Revise os dados e tente novamente.";
      return;
    }

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
