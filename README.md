# AMAS — demonstrador

Instrumento de pré-diagnóstico estrutural para consulta de rebanho, controle de
nematoides gastrintestinais. Materializa em software o referencial de Análise
Multiescalar de Assimetrias Sanitárias.

**Demonstrador de pesquisa.** Não é dispositivo médico veterinário. Não gera
escore, não pondera dimensões e não prediz desfecho de falha de controle. Os
dados da aba de visão regional são fictícios.

## Rodar localmente

Requer Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Publicar

O workflow em `.github/workflows/deploy.yml` publica automaticamente no GitHub
Pages a cada push na branch `main`. Em Settings → Pages, defina **Source:
GitHub Actions**.

Para Vercel ou Netlify, defina a variável de ambiente `VITE_BASE` como `/`.

## Estrutura

- `src/App.jsx` — o instrumento inteiro: as doze dimensões, as escalas do
  Quadro 1, a coluna de escalas e a lógica do painel de expectativa.
- `src/main.jsx` — ponto de entrada.
