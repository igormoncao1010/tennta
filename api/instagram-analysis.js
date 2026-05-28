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

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractRssItems(xml, source) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 4).map((match) => {
    const item = match[1];
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";

    return {
      source,
      title: decodeXml(title),
      url: decodeXml(link),
      publishedAt: decodeXml(pubDate)
    };
  });
}

async function fetchCurrentSignals(input) {
  const niche = String(input.niche || "").trim();
  const handle = String(input.handle || "").replace("@", "").trim();
  const baseTerms = [niche, "Instagram", "Reels", "tendencias", "marketing digital"]
    .filter(Boolean)
    .join(" ");
  const searches = [
    baseTerms,
    `${niche || handle || "criadores de conteudo"} comportamento consumidor Brasil`,
    `${niche || "social media"} tendencias conteudo 2026`
  ];

  const signals = [];

  for (const query of searches) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    try {
      const response = await fetch(url, {
        headers: { "user-agent": "TenntaMarketingBot/1.0" }
      });

      if (!response.ok) {
        continue;
      }

      const xml = await response.text();
      signals.push(...extractRssItems(xml, "Google News"));
    } catch {
      continue;
    }
  }

  const unique = [];
  const seen = new Set();

  for (const signal of signals) {
    const key = signal.title.toLowerCase();

    if (!signal.title || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(signal);
  }

  return {
    fetchedAt: new Date().toISOString(),
    instruction:
      "Use estes sinais somente como contexto atual. Se eles forem fracos ou irrelevantes para o nicho, diga isso e nao invente fatos.",
    signals: unique.slice(0, 8)
  };
}

function buildAnalysisPrompt(input, currentContext) {
  return [
    {
      role: "system",
      content:
        "Voce e um estrategista senior de Instagram da Tennta Marketing Digital. Analise perfis com foco em posicionamento, clareza da bio, viralizacao etica, retencao, engajamento e conversao. Use apenas o contexto atual fornecido para falar de acontecimentos ou tendencias recentes. Nao invente noticias, numeros, fatos recentes ou acontecimentos externos. Responda somente em JSON valido, sem markdown."
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          tarefa:
            "Analise este perfil e gere recomendacoes praticas para melhorar alcance, viralidade e engajamento.",
          formatoObrigatorio: {
            notaGeral: "numero de 0 a 100",
            resumoExecutivo: "resumo profissional com 3 a 5 frases",
            diagnostico: "resumo curto em portugues",
            pontosFortes: ["3 a 5 itens"],
            gargalos: ["3 a 5 itens"],
            fraquezasDetalhadas: [
              {
                fraqueza: "problema observado",
                impacto: "por que isso reduz alcance, engajamento ou conversao",
                correcao: "acao pratica"
              }
            ],
            bioMelhorada: "nova bio em portugues com CTA",
            tendenciasAtuais: [
              {
                sinal: "tendencia, conversa atual ou oportunidade contextual",
                fonte: "origem do sinal atual",
                aplicacao: "como transformar isso em conteudo para o perfil"
              }
            ],
            oportunidadesContextuais: ["ideias baseadas nos sinais atuais fornecidos"],
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
          perfil: input,
          contextoAtual: currentContext
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
    resumoExecutivo:
      "Este relatorio demonstrativo mostra a estrutura da analise profissional. Com o Hugging Face ativo, a Tennta cruza dados do perfil com sinais atuais de mercado para sugerir melhorias mais especificas.",
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
    fraquezasDetalhadas: [
      {
        fraqueza: "Bio pouco orientada a conversao",
        impacto: "Quando a promessa nao fica clara, o visitante entende menos motivos para seguir ou chamar no contato.",
        correcao: "Reescrever a bio com publico, promessa, prova e chamada para acao."
      },
      {
        fraqueza: "Falta de series repetiveis",
        impacto: "Conteudos soltos dificultam reconhecimento e reduzem chance de retorno do publico.",
        correcao: "Criar 3 quadros fixos semanais com formatos simples de repetir."
      }
    ],
    bioMelhorada: `Ajudo pessoas interessadas em ${niche} com conteudos praticos, ideias aplicaveis e estrategias simples. Me siga para melhorar seus resultados hoje.`,
    tendenciasAtuais: [
      {
        sinal: "Contexto atual indisponivel no modo demonstrativo",
        fonte: "Fallback local",
        aplicacao: "Configure HF_TOKEN para gerar recomendacoes conectadas a sinais atuais."
      }
    ],
    oportunidadesContextuais: [
      "Transformar perguntas frequentes do publico em reels curtos.",
      "Criar posts de opiniao conectando o nicho a conversas recentes quando houver contexto confiavel."
    ],
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

async function analyzeWithHuggingFace(input, currentContext) {
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
      messages: buildAnalysisPrompt(input, currentContext),
      temperature: 0.4,
      max_tokens: 2600,
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

    const currentContext = await fetchCurrentSignals(input);
    const analysis = await analyzeWithHuggingFace(input, currentContext);
    res.status(200).json({ ok: true, analysis });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Nao foi possivel gerar a analise.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
