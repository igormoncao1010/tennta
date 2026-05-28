<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$configPath = dirname(__DIR__, 2) . '/tennta-hf-config.php';
if (is_file($configPath)) {
    $config = require $configPath;
    if (is_array($config)) {
        $GLOBALS['TENNTA_HF_CONFIG'] = $config;
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Metodo nao permitido.']);
    exit;
}

function env_value(string $key, ?string $default = null): ?string
{
    $config = $GLOBALS['TENNTA_HF_CONFIG'] ?? [];
    if (is_array($config) && isset($config[$key]) && $config[$key] !== '') {
        return (string) $config[$key];
    }

    $value = getenv($key);
    return $value === false || $value === '' ? $default : $value;
}

function json_response(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function validate_profile_input(array $input): array
{
    $errors = [];

    if (empty($input['handle']) || strlen(trim((string) $input['handle'])) < 2) {
        $errors[] = 'Informe o @ do perfil.';
    }

    if (empty($input['bio']) || strlen(trim((string) $input['bio'])) < 10) {
        $errors[] = 'Informe uma bio com pelo menos 10 caracteres.';
    }

    if (empty($input['posts']) || !is_array($input['posts'])) {
        $errors[] = 'Inclua pelo menos um post, reel ou ideia de conteudo.';
    }

    return $errors;
}

function decode_xml_text(string $value): string
{
    $value = preg_replace('/<!\[CDATA\[(.*?)\]\]>/s', '$1', $value) ?? $value;
    $value = html_entity_decode($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
    $value = strip_tags($value);
    return trim($value);
}

function extract_rss_items(string $xml, string $source): array
{
    preg_match_all('/<item>(.*?)<\/item>/s', $xml, $matches);
    $items = [];

    foreach (array_slice($matches[1] ?? [], 0, 4) as $item) {
        preg_match('/<title>(.*?)<\/title>/s', $item, $title);
        preg_match('/<link>(.*?)<\/link>/s', $item, $link);
        preg_match('/<pubDate>(.*?)<\/pubDate>/s', $item, $pubDate);

        $items[] = [
            'source' => $source,
            'title' => decode_xml_text($title[1] ?? ''),
            'url' => decode_xml_text($link[1] ?? ''),
            'publishedAt' => decode_xml_text($pubDate[1] ?? '')
        ];
    }

    return $items;
}

function fetch_current_signals(array $input): array
{
    $niche = trim((string) ($input['niche'] ?? ''));
    $handle = trim(str_replace('@', '', (string) ($input['handle'] ?? '')));
    $topic = $niche !== '' ? $niche : ($handle !== '' ? $handle : 'criadores de conteudo');
    $queries = [
        trim("{$topic} Instagram Reels tendencias marketing digital"),
        trim("{$topic} comportamento consumidor Brasil"),
        trim("{$topic} tendencias conteudo 2026")
    ];
    $signals = [];

    foreach ($queries as $query) {
        $url = 'https://news.google.com/rss/search?q=' . rawurlencode($query) . '&hl=pt-BR&gl=BR&ceid=BR:pt-419';
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => ['User-Agent: TenntaMarketingBot/1.0']
        ]);
        $raw = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);

        if (is_string($raw) && $status >= 200 && $status < 300) {
            $signals = array_merge($signals, extract_rss_items($raw, 'Google News'));
        }
    }

    $unique = [];
    $seen = [];

    foreach ($signals as $signal) {
        $key = strtolower($signal['title'] ?? '');
        if ($key === '' || isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $unique[] = $signal;
    }

    return [
        'fetchedAt' => gmdate('c'),
        'instruction' => 'Use estes sinais somente como contexto atual. Se eles forem fracos ou irrelevantes para o nicho, diga isso e nao invente fatos.',
        'signals' => array_slice($unique, 0, 8)
    ];
}

function build_analysis_messages(array $input, array $currentContext): array
{
    return [
        [
            'role' => 'system',
            'content' => 'Voce e um estrategista senior de Instagram da Tennta Marketing Digital. Analise perfis com foco em posicionamento, clareza da bio, viralizacao etica, retencao, engajamento e conversao. Use apenas o contexto atual fornecido para falar de acontecimentos ou tendencias recentes. Nao invente noticias, numeros, fatos recentes ou acontecimentos externos. Responda somente em JSON valido, sem markdown.'
        ],
        [
            'role' => 'user',
            'content' => json_encode([
                'tarefa' => 'Analise este perfil e gere recomendacoes praticas para melhorar alcance, viralidade e engajamento.',
                'formatoObrigatorio' => [
                    'notaGeral' => 'numero de 0 a 100',
                    'resumoExecutivo' => 'resumo profissional com 3 a 5 frases',
                    'diagnostico' => 'resumo curto em portugues',
                    'pontosFortes' => ['3 a 5 itens'],
                    'gargalos' => ['3 a 5 itens'],
                    'fraquezasDetalhadas' => [[
                        'fraqueza' => 'problema observado',
                        'impacto' => 'por que isso reduz alcance, engajamento ou conversao',
                        'correcao' => 'acao pratica'
                    ]],
                    'bioMelhorada' => 'nova bio em portugues com CTA',
                    'tendenciasAtuais' => [[
                        'sinal' => 'tendencia, conversa atual ou oportunidade contextual',
                        'fonte' => 'origem do sinal atual',
                        'aplicacao' => 'como transformar isso em conteudo para o perfil'
                    ]],
                    'oportunidadesContextuais' => ['ideias baseadas nos sinais atuais fornecidos'],
                    'ideiasDeConteudo' => [[
                        'titulo' => 'gancho do conteudo',
                        'formato' => 'reel | carrossel | story | live',
                        'motivo' => 'por que pode performar',
                        'roteiroCurto' => ['3 a 5 passos']
                    ]],
                    'calendario7Dias' => [[
                        'dia' => 'Dia 1',
                        'acao' => 'conteudo ou ajuste',
                        'objetivo' => 'alcance | relacionamento | conversao'
                    ]],
                    'hashtags' => ['8 a 15 hashtags relevantes'],
                    'prioridades' => ['lista ordenada das melhorias mais importantes']
                ],
                'perfil' => $input,
                'contextoAtual' => $currentContext
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)
        ]
    ];
}

function fallback_analysis(array $input): array
{
    $niche = trim((string) ($input['niche'] ?? 'seu nicho'));
    $niche = $niche !== '' ? $niche : 'seu nicho';

    return [
        'notaGeral' => 62,
        'diagnostico' => 'Analise demonstrativa da Tennta. Para usar IA real, configure HF_TOKEN no HostGator.',
        'resumoExecutivo' => 'Este relatorio demonstrativo mostra a estrutura da analise profissional. Com o Hugging Face ativo, a Tennta cruza dados do perfil com sinais atuais de mercado para sugerir melhorias mais especificas.',
        'pontosFortes' => [
            'O perfil ja tem informacoes suficientes para iniciar um diagnostico.',
            'Existe oportunidade de transformar temas soltos em quadros fixos.',
            'A bio pode virar um ativo de conversao com promessa e CTA mais claros.'
        ],
        'gargalos' => [
            'A promessa central precisa ficar obvia nos primeiros segundos.',
            'Os conteudos precisam de ganchos mais especificos e repetiveis.',
            'Faltam pedidos claros de comentario, salvamento ou contato.'
        ],
        'fraquezasDetalhadas' => [
            [
                'fraqueza' => 'Bio pouco orientada a conversao',
                'impacto' => 'Quando a promessa nao fica clara, o visitante entende menos motivos para seguir ou chamar no contato.',
                'correcao' => 'Reescrever a bio com publico, promessa, prova e chamada para acao.'
            ],
            [
                'fraqueza' => 'Falta de series repetiveis',
                'impacto' => 'Conteudos soltos dificultam reconhecimento e reduzem chance de retorno do publico.',
                'correcao' => 'Criar 3 quadros fixos semanais com formatos simples de repetir.'
            ]
        ],
        'bioMelhorada' => "Ajudo pessoas interessadas em {$niche} com conteudos praticos, ideias aplicaveis e estrategias simples. Me siga para melhorar seus resultados hoje.",
        'tendenciasAtuais' => [
            [
                'sinal' => 'Contexto atual indisponivel no modo demonstrativo',
                'fonte' => 'Fallback local',
                'aplicacao' => 'Configure HF_TOKEN para gerar recomendacoes conectadas a sinais atuais.'
            ]
        ],
        'oportunidadesContextuais' => [
            'Transformar perguntas frequentes do publico em reels curtos.',
            'Criar posts de opiniao conectando o nicho a conversas recentes quando houver contexto confiavel.'
        ],
        'ideiasDeConteudo' => [
            [
                'titulo' => "3 erros que travam resultados em {$niche}",
                'formato' => 'reel',
                'motivo' => 'Conteudo de erro gera identificacao rapida e abre espaco para comentarios.',
                'roteiroCurto' => [
                    'Abra com o erro mais comum.',
                    'Mostre um exemplo real.',
                    'Explique a correcao em uma frase.',
                    'Finalize pedindo que a pessoa comente qual erro mais acontece.'
                ]
            ]
        ],
        'calendario7Dias' => [
            ['dia' => 'Dia 1', 'acao' => 'Reescrever a bio com promessa, publico e CTA', 'objetivo' => 'conversao'],
            ['dia' => 'Dia 2', 'acao' => 'Publicar reel com erro comum do nicho', 'objetivo' => 'alcance'],
            ['dia' => 'Dia 3', 'acao' => 'Abrir caixinha de perguntas nos stories', 'objetivo' => 'relacionamento'],
            ['dia' => 'Dia 4', 'acao' => 'Postar carrossel com checklist pratico', 'objetivo' => 'engajamento'],
            ['dia' => 'Dia 5', 'acao' => 'Responder comentario em formato de reel', 'objetivo' => 'alcance'],
            ['dia' => 'Dia 6', 'acao' => 'Mostrar bastidor, prova social ou caso real', 'objetivo' => 'relacionamento'],
            ['dia' => 'Dia 7', 'acao' => 'Revisar metricas e repetir o melhor formato', 'objetivo' => 'conversao']
        ],
        'hashtags' => ['#marketingdigital', '#instagrambrasil', '#conteudodigital', '#socialmedia'],
        'prioridades' => [
            'Clarear a promessa da bio.',
            'Criar 3 quadros fixos semanais.',
            'Melhorar os ganchos dos primeiros segundos.',
            'Transformar comentarios em novos conteudos.'
        ]
    ];
}

function analyze_with_hugging_face(array $input, array $currentContext): array
{
    $token = env_value('HF_TOKEN');
    $model = env_value('HF_MODEL', 'meta-llama/Llama-3.1-8B-Instruct');
    $provider = env_value('HF_PROVIDER', 'auto');

    if (!$token) {
        return fallback_analysis($input);
    }

    $payload = json_encode([
        'model' => $model,
        'provider' => $provider,
        'messages' => build_analysis_messages($input, $currentContext),
        'temperature' => 0.4,
        'max_tokens' => 2600,
        'response_format' => ['type' => 'json_object']
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $curl = curl_init('https://router.huggingface.co/v1/chat/completions');
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_TIMEOUT => 45
    ]);

    $raw = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($raw === false || $curlError) {
        throw new RuntimeException('Erro de conexao com Hugging Face: ' . $curlError);
    }

    if ($status < 200 || $status >= 300) {
        throw new RuntimeException("Hugging Face retornou {$status}: {$raw}");
    }

    $data = json_decode($raw, true);
    $content = $data['choices'][0]['message']['content'] ?? null;

    if (!$content) {
        throw new RuntimeException('A resposta do modelo veio vazia.');
    }

    $analysis = json_decode($content, true);

    if (!is_array($analysis)) {
        throw new RuntimeException('A resposta do modelo nao veio em JSON valido.');
    }

    return $analysis;
}

try {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput ?: '{}', true);

    if (!is_array($input)) {
        json_response(400, ['ok' => false, 'errors' => ['JSON invalido.']]);
    }

    $errors = validate_profile_input($input);

    if ($errors) {
        json_response(400, ['ok' => false, 'errors' => $errors]);
    }

    $currentContext = fetch_current_signals($input);
    json_response(200, ['ok' => true, 'analysis' => analyze_with_hugging_face($input, $currentContext)]);
} catch (Throwable $error) {
    json_response(500, [
        'ok' => false,
        'error' => 'Nao foi possivel gerar a analise.',
        'detail' => $error->getMessage()
    ]);
}
