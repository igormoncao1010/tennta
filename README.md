# Tennta Marketing Digital

Landing page moderna para a Tennta Marketing Digital, com visual de agência
global, canvas animado, efeitos de rolagem, cards 3D, métricas e seção de IA.

## Estrutura

- `index.html`: página principal estática.
- `styles.css`: visual responsivo, animações e sistema visual.
- `script.js`: canvas animado, reveal on scroll, contadores, tilt cards e analisador de Instagram.
- `api/instagram-analysis.js`: rota serverless para Vercel.
- `api/instagram-analysis.php`: rota PHP para HostGator.
- `assets/`: imagens, logos e outros arquivos visuais.
- `docs/briefing.md`: briefing inicial para ajustar posicionamento, oferta e conteúdo.
- `desktop-preview.png` e `mobile-preview.png`: capturas de validação visual.

## Como abrir

Abra o arquivo `index.html` no navegador.

## Analisador de Instagram com IA

Para usar a analise real na Vercel, configure as variaveis de ambiente:

```text
HF_TOKEN=hf_seu_token_aqui
HF_MODEL=meta-llama/Llama-3.1-8B-Instruct
HF_PROVIDER=auto
```

Sem `HF_TOKEN`, a rota retorna uma analise demonstrativa para manter a pagina funcionando.

No HostGator, envie tambem a pasta `api/` e o arquivo `.htaccess`. A URL usada pelo site continua sendo:

```text
/api/instagram-analysis
```

Configure `HF_TOKEN`, `HF_MODEL` e `HF_PROVIDER` como variaveis de ambiente no painel, se disponivel.

Se o seu plano nao permitir variaveis de ambiente, use o exemplo `docs/tennta-hf-config.example.php`, renomeie para `tennta-hf-config.php` e coloque esse arquivo uma pasta acima do `public_html`. O endpoint PHP procura automaticamente por:

```text
../tennta-hf-config.php
```

Nao coloque o token no `script.js` ou no `index.html`.

## Próximos passos

1. Inserir logo oficial da Tennta Marketing em `assets/`.
2. Substituir o botao de contato por WhatsApp, email ou CRM real.
3. Trocar nomes de clientes por logos oficiais quando disponíveis.
4. Publicar em hospedagem estática ou integrar a um CMS.
