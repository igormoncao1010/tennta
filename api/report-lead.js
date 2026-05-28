function sanitize(value) {
  return String(value || "").replace(/[<>"']/g, "").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateLead(lead) {
  const errors = [];
  const email = String(lead.email || "").trim();

  if (!lead.name || String(lead.name).trim().length < 2) {
    errors.push("Informe seu nome.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Informe um email valido.");
  }

  if (!lead.whatsapp || String(lead.whatsapp).replace(/\D/g, "").length < 10) {
    errors.push("Informe um WhatsApp valido com DDD.");
  }

  return errors;
}

function buildEmailHtml(lead, profile, analysis) {
  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
      <h1>Novo download de relatorio Tennta</h1>
      <p>Um visitante preencheu os dados para baixar o diagnostico profissional.</p>
      <h2>Contato</h2>
      <ul>
        <li><strong>Nome:</strong> ${escapeHtml(lead.name)}</li>
        <li><strong>Email:</strong> ${escapeHtml(lead.email)}</li>
        <li><strong>WhatsApp:</strong> ${escapeHtml(lead.whatsapp)}</li>
      </ul>
      <h2>Perfil analisado</h2>
      <ul>
        <li><strong>Instagram:</strong> ${escapeHtml(profile.handle)}</li>
        <li><strong>Nicho:</strong> ${escapeHtml(profile.niche)}</li>
        <li><strong>Seguidores:</strong> ${escapeHtml(profile.followers)}</li>
        <li><strong>Frequencia:</strong> ${escapeHtml(profile.postingFrequency)}</li>
      </ul>
      <h2>Resumo do diagnostico</h2>
      <ul>
        <li><strong>Score:</strong> ${escapeHtml(analysis.notaGeral)}</li>
        <li><strong>Diagnostico:</strong> ${escapeHtml(analysis.diagnostico)}</li>
        <li><strong>Resumo executivo:</strong> ${escapeHtml(analysis.resumoExecutivo)}</li>
      </ul>
      <p style="color:#64748b">Enviado automaticamente pelo site da Tennta.</p>
    </div>
  `;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Metodo nao permitido." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const lead = {
      name: sanitize(body.lead?.name),
      email: sanitize(body.lead?.email),
      whatsapp: sanitize(body.lead?.whatsapp)
    };
    const profile = body.profile || {};
    const analysis = body.analysis || {};
    const errors = validateLead(lead);

    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.LEAD_TO_EMAIL || "igormoncao86@gmail.com";
    const from = process.env.LEAD_FROM_EMAIL || "Tennta Marketing <onboarding@resend.dev>";

    if (!apiKey) {
      res.status(500).json({
        ok: false,
        error: "RESEND_API_KEY nao configurada na Vercel."
      });
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: lead.email,
        subject: `Novo lead do diagnostico Tennta - ${lead.name}`,
        html: buildEmailHtml(lead, profile, analysis)
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      res.status(500).json({
        ok: false,
        error: "Nao foi possivel enviar o email do lead.",
        detail: data?.message || data?.error || "Erro desconhecido no Resend."
      });
      return;
    }

    res.status(200).json({ ok: true, emailId: data.id });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Nao foi possivel registrar o lead.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
