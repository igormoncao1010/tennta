function validateProfileInput(input) {
  const errors = [];

  if (!input.handle || String(input.handle).trim().length < 2) {
    errors.push("Informe o @ do perfil.");
  }

  if (!input.bio || String(input.bio).trim().length < 10) {
    errors.push("Informe uma bio com pelo menos 10 caracteres.");
  }

  if (!Array.isArray(input.posts) || input.posts.length === 0) {
    errors.push("Inclua pelo menos um post, reel ou ideia de conteudo.");
  }

  return errors;
}

function buildAnalysisPrompt(input) {
  return [
    {
      role: "system",
      content:
        "Voce e um estrategista senior de Instagram da Tennta Marketing Digital. Analise perfis com foco em posicionamento, clareza da bio, viralizacao etica, retencao, engajamento e conversao. Responda somente em JSON valido, sem markdown."
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          tarefa:
            "Analise este perfil e gere recomendacoes praticas para melhorar alcance, viralidade e engajamento.",
          formatoObrigatorio: {
            notaGeral: "numero de 0 a 100",
            diagnostico: "resumo curto em portugues",
            pontosFortes: ["3 a 5 itens"],
            gargalos: ["3 a 5 itens"],
            bioMelhorada: "nova bio em portugues com CTA",
            ideiasDeConteudo: [
              {
                titulo: "gancho do conteudo",
                formato: "reel | carrossel | story | live",
                motivo: "por que pode performar",
                roteiroCurto: ["3 a 5 passos"]
              }
            ],
            calendario7Dias: [
              {
                dia: "Dia 1",
                acao: "conteudo ou ajuste",
                objetivo: "alcance | relacionamento | conversao"
              }
            ],
            hashtags: ["8 a 15 hashtags relevantes"],
            prioridades: ["lista ordenada das melhorias mais importantes"]
          },
          perfil: input
        },
        null,
        2
      )
    }
  ];
}

function fallbackAnalysis(input) {
  const niche = input.niche || "seu nicho";

  return {
    notaGeral: 62,
    diagnostico:
      "Analise demonstrativa da Tennta. Para usar IA real, configure HF_TOKEN nas variaveis de ambiente da Vercel.",
    pontosFortes: [
      "O perfil ja tem informacoes suficientes para iniciar um diagnostico.",
      "Existe oportunidade de transformar temas soltos em quadros fixos.",
      "A bio pode virar um ativo de conversao com promessa e CTA mais claros."
    ],
    gargalos: [
      "A promessa central precisa ficar obvia nos primeiros segundos.",
      "Os conteudos precisam de ganchos mais especificos e repetiveis.",
      "Faltam pedidos claros de comentario, salvamento ou contato."
    ],
    bioMelhorada: `Ajudo pessoas interessadas em ${niche} com conteudos praticos, ideias aplicaveis e estrategias simples. Me siga para melhorar seus resultados hoje.`,
    ideiasDeConteudo: [
      {
        titulo: `3 erros que travam resultados em ${niche}`,
        formato: "reel",
        motivo: "Conteudo de erro gera identificacao rapida e abre espaco para comentarios.",
        roteiroCurto: [
          "Abra com o erro mais comum.",
          "Mostre um exemplo real.",
          "Explique a correcao em uma frase.",
          "Finalize pedindo que a pessoa comente qual erro mais acontece."
        ]
      },
      {
        titulo: `Checklist rapido para melhorar um perfil de ${niche}`,
        formato: "carrossel",
        motivo: "Checklists costumam gerar salvamentos e compartilhamentos.",
        roteiroCurto: [
          "Comece com uma promessa objetiva.",
          "Liste 5 ajustes simples.",
          "Mostre antes e depois quando possivel.",
          "Feche com CTA para seguir o perfil."
        ]
      }
    ],
    calendario7Dias: [
      { dia: "Dia 1", acao: "Reescrever a bio com promessa, publico e CTA", objetivo: "conversao" },
      { dia: "Dia 2", acao: "Publicar reel com erro comum do nicho", objetivo: "alcance" },
      { dia: "Dia 3", acao: "Abrir caixinha de perguntas nos stories", objetivo: "relacionamento" },
      { dia: "Dia 4", acao: "Postar carrossel com checklist pratico", objetivo: "engajamento" },
      { dia: "Dia 5", acao: "Responder comentario em formato de reel", objetivo: "alcance" },
      { dia: "Dia 6", acao: "Mostrar bastidor, prova social ou caso real", objetivo: "relacionamento" },
      { dia: "Dia 7", acao: "Revisar metricas e repetir o melhor formato", objetivo: "conversao" }
    ],
    hashtags: ["#marketingdigital", "#instagrambrasil", "#conteudodigital", "#socialmedia"],
    prioridades: [
      "Clarear a promessa da bio.",
      "Criar 3 quadros fixos semanais.",
      "Melhorar os ganchos dos primeiros segundos.",
      "Transformar comentarios em novos conteudos."
    ]
  };
}

async function analyzeWithHuggingFace(input) {
  const token = process.env.HF_TOKEN;
  const model = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
  const provider = process.env.HF_PROVIDER || "auto";

  if (!token) {
    return fallbackAnalysis(input);
  }

  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      provider,
      messages: buildAnalysisPrompt(input),
      temperature: 0.4,
      max_tokens: 1800,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Hugging Face retornou ${response.status}: ${details}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("A resposta do modelo veio vazia.");
  }

  return JSON.parse(content);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Metodo nao permitido." });
    return;
  }

  try {
    const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const errors = validateProfileInput(input);

    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const analysis = await analyzeWithHuggingFace(input);
    res.status(200).json({ ok: true, analysis });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Nao foi possivel gerar a analise.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
