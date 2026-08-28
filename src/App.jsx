import React, { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Escalas organizacionais (base = predial, topo = fora do alcance)   */
/* ------------------------------------------------------------------ */
const ESCALAS = [
  { id: 0, curto: "Propriedade", longo: "Propriedade (médico veterinário e produtor)" },
  { id: 1, curto: "Cadeia local", longo: "Cadeia e comércio local" },
  { id: 2, curto: "Coord. regional", longo: "Coordenação regional" },
  { id: 3, curto: "Estado", longo: "Estado e regulação" },
  { id: 4, curto: "Fora do alcance", longo: "Fora do alcance individual" },
];

/* ------------------------------------------------------------------ */
/*  As doze dimensões, com escalas conforme o Quadro 1 do manuscrito   */
/* ------------------------------------------------------------------ */
const DIMENSOES = [
  {
    id: "patologica", n: 1, nome: "Patológica", decisao: 0, condicionante: 4,
    notaDec: "execução do teste", notaCond: "genética da resistência",
    pergunta: "Foi realizado teste de redução da contagem de ovos (FECRT) neste rebanho nos últimos 24 meses?",
    opcoes: [
      { r: "Sim, com resultado documentado", flag: false },
      { r: "Não, ou não há registro", flag: true },
      { r: "Não sei informar", flag: true },
    ],
    achado: "A decisão terapêutica se apoia em presunção de eficácia. Uma troca de base química, se ocorrer, será feita sem saber qual classe falhou.",
  },
  {
    id: "rebanho", n: 2, nome: "Do rebanho", decisao: 0, condicionante: 2,
    pergunta: "No último tratamento, que parcela do lote recebeu anti-helmíntico?",
    opcoes: [
      { r: "Parte do lote foi deliberadamente mantida sem tratar", flag: false },
      { r: "Todos os animais do lote", flag: true },
      { r: "Todos, com transferência para pastagem limpa em seguida", flag: true },
    ],
    achado: "O refúgio foi eliminado. Cada evento terapêutico opera como pressão seletiva máxima sobre a população parasitária.",
  },
  {
    id: "produtor", n: 3, nome: "Do produtor", decisao: 0, condicionante: 1,
    pergunta: "Como a dose é definida no momento da aplicação?",
    opcoes: [
      { r: "Pesagem, ou dose pelo animal mais pesado do grupo", flag: false },
      { r: "Estimativa visual de peso", flag: true },
      { r: "Peso médio do lote", flag: true },
    ],
    achado: "Há subdosagem provável. Parte da população parasitária é exposta a concentração subterapêutica, o que favorece genótipos heterozigotos resistentes.",
  },
  {
    id: "setor", n: 4, nome: "Do setor produtivo", decisao: 1, condicionante: 3,
    verificacao: "Onde foi tomada a decisão",
    pergunta: "Onde foi tomada, de fato, a decisão de compra do último anti-helmíntico utilizado?",
    opcoes: [
      { r: "Prescrição de médico veterinário", flag: false },
      { r: "Indicação recebida no balcão da agropecuária", flag: true },
      { r: "Escolha do produtor, sem consulta técnica", flag: true },
    ],
    achado: "A decisão técnica está localizada fora da relação clínica. Quem recomenda não diagnostica e tem incentivo comercial associado à recomendação.",
  },
  {
    id: "institucional", n: 5, nome: "Institucional", decisao: 3, condicionante: null,
    pergunta: "A propriedade se reporta a algum programa oficial de vigilância da resistência?",
    opcoes: [
      { r: "Sim, com notificação regular", flag: false },
      { r: "Não existe programa acessível", flag: true },
    ],
    achado: "A resistência só será detectada quando a falha de controle já for clinicamente manifesta, isto é, em estágio avançado.",
  },
  {
    id: "economica", n: 6, nome: "Econômica", decisao: 0, condicionante: 1,
    pergunta: "Qual critério predomina na escolha do produto?",
    opcoes: [
      { r: "Custo por animal efetivamente tratado com sucesso", flag: false },
      { r: "Menor preço por frasco", flag: true },
    ],
    achado: "Seleção adversa em sentido estrito. O produto mais barato tende a ser escolhido porque sua eficácia real não é verificável.",
  },
  {
    id: "informacional", n: 7, nome: "Informacional", decisao: 0, condicionante: 3,
    notaDec: "e cadeia", notaCond: "rotulagem",
    pergunta: "O produtor identifica a classe química do produto, e não apenas o nome comercial?",
    opcoes: [
      { r: "Sim, reconhece a base química", flag: false },
      { r: "Não, identifica apenas a marca", flag: true },
    ],
    achado: "Rotação entre marcas da mesma classe é percebida como rotação de base. A mesma pressão seletiva se repete sob rótulo distinto.",
  },
  {
    id: "tecnologica", n: 8, nome: "Tecnológica", decisao: 1, condicionante: 3,
    verificacao: "Exequibilidade do monitoramento",
    pergunta: "Qual a acessibilidade real do laboratório de referência para OPG e coprocultura?",
    opcoes: [
      { r: "Acessível na rotina da propriedade", flag: false },
      { r: "Acessível apenas com dificuldade e custo relevante", flag: true },
      { r: "Inacessível na prática", flag: true },
    ],
    achado: "Prescrever monitoramento coproparasitológico periódico é formalmente correto e materialmente inexequível nesta propriedade.",
  },
  {
    id: "territorial", n: 9, nome: "Territorial", decisao: 2, condicionante: 3,
    verificacao: "Contiguidade e circulação animal",
    pergunta: "Há entrada de animais sem quarentena e pastagens contíguas a propriedades vizinhas?",
    opcoes: [
      { r: "Não, há quarentena e isolamento de pastagens", flag: false },
      { r: "Sim, em uma das duas condições", flag: true },
      { r: "Sim, em ambas", flag: true },
    ],
    achado: "O genótipo resistente não permanece confinado à unidade produtiva. O refúgio mantido aqui não protege quem trata a totalidade do rebanho ao lado.",
  },
  {
    id: "temporal", n: 12, nome: "Temporal", decisao: 0, condicionante: 2,
    notaCond: "trajetória herdada",
    pergunta: "O planejamento de controle parasitário considera horizonte superior a uma estação?",
    opcoes: [
      { r: "Sim, há planejamento plurianual", flag: false },
      { r: "Não, a decisão é tomada por estação ou por episódio", flag: true },
    ],
    achado: "O custo do manejo conservador é imediato e privado; o benefício é diferido e coletivo. O adiamento é esperável mesmo em quem reconhece o valor da medida.",
  },
];

/* Dimensões estruturais: não dependem de resposta da propriedade */
const ESTRUTURAIS = [
  {
    id: "extraterritorial", n: 10, nome: "Extraterritorial e geopolítica", decisao: 4, condicionante: null,
    achado: "Concentração do desenvolvimento de moléculas em número reduzido de corporações e exigências de limite máximo de resíduo dos mercados de destino.",
  },
  {
    id: "dependencia", n: 11, nome: "De dependência", decisao: 4, condicionante: 3,
    achado: "Desde a década de 1980, apenas duas novas classes alcançaram o mercado de ruminantes, com disponibilidade heterogênea por espécie e país.",
  },
];

/* ------------------------------------------------------------------ */
/*  Carteira sintética para a visão regional (dados de demonstração)   */
/* ------------------------------------------------------------------ */
const CARTEIRA = [
  { nome: "Sítio Boa Esperança", mun: "Ananindeua", flags: ["patologica", "rebanho", "setor", "institucional", "economica", "tecnologica", "territorial", "temporal"] },
  { nome: "Faz. Santa Luzia", mun: "Castanhal", flags: ["patologica", "setor", "institucional", "informacional", "tecnologica", "territorial"] },
  { nome: "Faz. Três Irmãos", mun: "Castanhal", flags: ["patologica", "rebanho", "produtor", "setor", "institucional", "economica", "informacional", "tecnologica", "territorial", "temporal"] },
  { nome: "Sítio do Km 42", mun: "Santa Izabel", flags: ["rebanho", "produtor", "setor", "institucional", "economica", "tecnologica", "territorial", "temporal"] },
  { nome: "Faz. Nova Aliança", mun: "Santa Izabel", flags: ["patologica", "setor", "institucional", "tecnologica", "territorial"] },
  { nome: "Faz. Bom Retiro", mun: "Benevides", flags: ["patologica", "rebanho", "setor", "institucional", "informacional", "territorial", "temporal"] },
];

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const T = {
  papel: "#E7EAE4",
  papelClaro: "#F1F3EE",
  tinta: "#161C18",
  tintaMedia: "#4A544C",
  regua: "#C2C9BF",
  sinal: "#8A6A05",      // restrição identificada
  sinalFraco: "#E8DFC0",
  estrutural: "#2C4A57",  // fora do alcance
  estruturalFraco: "#D3DDE1",
  neutro: "#9AA398",
};

const mono = "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, monospace";
const sans = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const serif = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";

function Etiqueta({ children, cor = T.tintaMedia, style }) {
  return (
    <span style={{
      fontFamily: mono, fontSize: 10, letterSpacing: "0.14em",
      textTransform: "uppercase", color: cor, ...style
    }}>{children}</span>
  );
}

/* ------------------------------------------------------------------ */
/*  Signature: coluna de escalas                                       */
/* ------------------------------------------------------------------ */
function ColunaDeEscalas({ marcados }) {
  const itens = marcados;
  const L = 132, R = 24, TOPO = 34, ALT = 58;
  const larg = Math.max(560, L + R + itens.length * 62);
  const alturaTotal = TOPO + 4 * ALT + 74;
  const y = (esc) => TOPO + (4 - esc) * ALT;
  const x = (i) => L + 34 + i * 62;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <svg viewBox={`0 0 ${larg} ${alturaTotal}`} width="100%"
           style={{ minWidth: larg > 700 ? larg : undefined, display: "block" }}
           role="img" aria-label="Distribuição das restrições por escala organizacional">
        {ESCALAS.map((e) => (
          <g key={e.id}>
            <line x1={L} y1={y(e.id)} x2={larg - R} y2={y(e.id)}
                  stroke={T.regua} strokeWidth="1" />
            <text x={L - 12} y={y(e.id) + 3} textAnchor="end"
                  style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", fill: T.tintaMedia }}>
              {e.curto.toUpperCase()}
            </text>
          </g>
        ))}
        <line x1={L} y1={y(4) - 14} x2={L} y2={y(0) + 14} stroke={T.tinta} strokeWidth="1.25" />

        {itens.map((d, i) => {
          const cor = d.estrutural ? T.estrutural : T.sinal;
          const yd = y(d.decisao);
          const yc = d.condicionante !== null ? y(d.condicionante) : null;
          const sobe = yc !== null && yc < yd;
          return (
            <g key={d.id}>
              {yc !== null && (
                <>
                  <line x1={x(i)} y1={yd} x2={x(i)} y2={yc}
                        stroke={cor} strokeWidth="1.5"
                        strokeDasharray={sobe ? "none" : "3 3"} opacity="0.75" />
                  <circle cx={x(i)} cy={yc} r="3.5" fill="none" stroke={cor} strokeWidth="1.5" />
                </>
              )}
              <circle cx={x(i)} cy={yd} r="5" fill={cor} />
              <text x={x(i)} y={alturaTotal - 46} textAnchor="start"
                    transform={`rotate(35 ${x(i)} ${alturaTotal - 46})`}
                    style={{ fontFamily: sans, fontSize: 11, fill: T.tinta }}>
                {d.nome}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 8 }}>
        <Legenda cor={T.sinal} texto="Restrição identificada nesta consulta" preenchido />
        <Legenda cor={T.estrutural} texto="Restrição estrutural, independe da propriedade" preenchido />
        <Legenda cor={T.tintaMedia} texto="Círculo vazado: escala que condiciona a eficácia" />
      </div>
    </div>
  );
}

function Legenda({ cor, texto, preenchido }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{
        width: 9, height: 9, borderRadius: "50%",
        background: preenchido ? cor : "transparent",
        border: `1.5px solid ${cor}`
      }} />
      <Etiqueta cor={T.tintaMedia}>{texto}</Etiqueta>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Aplicação                                                          */
/* ------------------------------------------------------------------ */
export default function AmasDemonstrador() {
  const [aba, setAba] = useState("consulta");
  const [propriedade, setPropriedade] = useState("Faz. Três Irmãos");
  const [municipio, setMunicipio] = useState("Castanhal, PA");
  const [respostas, setRespostas] = useState({});

  const respondidas = Object.keys(respostas).length;
  const completo = respondidas === DIMENSOES.length;

  const flagged = useMemo(
    () => DIMENSOES.filter((d) => {
      const r = respostas[d.id];
      return r !== undefined && d.opcoes[r].flag;
    }),
    [respostas]
  );

  const marcados = useMemo(() => {
    const est = ESTRUTURAIS.map((e) => ({ ...e, estrutural: true }));
    return [...flagged.map((f) => ({ ...f, estrutural: false })), ...est]
      .sort((a, b) => a.n - b.n);
  }, [flagged]);

  const prediais = flagged.filter((d) => d.decisao === 0);
  const prediaisCondicionadas = prediais.filter(
    (d) => d.condicionante !== null && d.condicionante > 0
  );
  const supra = flagged.filter((d) => d.decisao > 0);
  const contradiz = flagged.filter(
    (d) => d.decisao > 0 && d.condicionante === 0
  );

  function responder(id, idx) {
    setRespostas((p) => ({ ...p, [id]: idx }));
  }
  function limpar() {
    setRespostas({});
  }
  function exemplo() {
    const e = {};
    DIMENSOES.forEach((d) => {
      const cand = d.opcoes.findIndex((o) => o.flag);
      e[d.id] = d.id === "produtor" || d.id === "informacional" ? 0 : cand;
    });
    setRespostas(e);
  }

  return (
    <div style={{
      background: T.papel, color: T.tinta, fontFamily: sans,
      minHeight: "100vh", padding: "0 0 56px"
    }}>
      <style>{`
        * { box-sizing: border-box; }
        button:focus-visible { outline: 2px solid ${T.tinta}; outline-offset: 2px; }
        @media (prefers-reduced-motion: no-preference) {
          .fade { animation: f .35s ease both; }
          @keyframes f { from { opacity: 0; transform: translateY(4px);} to {opacity:1;transform:none;} }
        }
      `}</style>

      {/* ---------------- Cabeçalho ---------------- */}
      <header style={{
        borderBottom: `1px solid ${T.tinta}`, background: T.papelClaro,
        padding: "22px 26px 18px"
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <Etiqueta>Instrumento de pré-diagnóstico estrutural</Etiqueta>
          <h1 style={{
            fontFamily: sans, fontSize: 27, fontWeight: 600, letterSpacing: "-0.02em",
            margin: "8px 0 6px", lineHeight: 1.15
          }}>
            Análise Multiescalar de Assimetrias Sanitárias
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: T.tintaMedia, maxWidth: 620, lineHeight: 1.5 }}>
            Consulta de rebanho, controle de nematoides gastrintestinais. Mapeia onde cada
            restrição é decidida e o que condiciona sua eficácia, antes da prescrição.
          </p>

          <nav style={{ display: "flex", gap: 2, marginTop: 20 }}>
            {[
              ["consulta", "Consulta"],
              ["mapa", "Mapa estrutural"],
              ["carteira", "Visão regional"],
              ["nota", "Nota metodológica"],
            ].map(([k, r]) => (
              <button key={k} onClick={() => setAba(k)}
                style={{
                  border: `1px solid ${aba === k ? T.tinta : T.regua}`,
                  borderBottom: aba === k ? `1px solid ${T.papelClaro}` : `1px solid ${T.regua}`,
                  background: aba === k ? T.papelClaro : "transparent",
                  color: aba === k ? T.tinta : T.tintaMedia,
                  padding: "8px 15px", cursor: "pointer",
                  fontFamily: mono, fontSize: 11, letterSpacing: "0.1em",
                  textTransform: "uppercase", marginBottom: -19,
                }}>
                {r}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px" }}>

        {/* ---------------- CONSULTA ---------------- */}
        {aba === "consulta" && (
          <div className="fade">
            <div style={{
              display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end",
              paddingBottom: 18, borderBottom: `1px solid ${T.regua}`, marginBottom: 22
            }}>
              <Campo rotulo="Propriedade" valor={propriedade} onChange={setPropriedade} largura={230} />
              <Campo rotulo="Município" valor={municipio} onChange={setMunicipio} largura={170} />
              <div style={{ flex: 1 }} />
              <div style={{ textAlign: "right" }}>
                <Etiqueta>{respondidas} de {DIMENSOES.length} respondidas</Etiqueta>
                <div style={{
                  width: 150, height: 3, background: T.regua, marginTop: 6, marginLeft: "auto"
                }}>
                  <div style={{
                    width: `${(respondidas / DIMENSOES.length) * 100}%`, height: "100%",
                    background: T.tinta, transition: "width .25s"
                  }} />
                </div>
              </div>
            </div>

            {DIMENSOES.map((d) => (
              <Pergunta key={d.id} d={d} valor={respostas[d.id]} onResponder={responder} />
            ))}

            <div style={{
              marginTop: 26, paddingTop: 18, borderTop: `1px solid ${T.regua}`,
              display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center"
            }}>
              <button onClick={() => setAba("mapa")} disabled={!completo}
                style={{
                  background: completo ? T.tinta : T.regua, color: T.papelClaro, border: "none",
                  padding: "12px 22px", cursor: completo ? "pointer" : "not-allowed",
                  fontFamily: mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase"
                }}>
                Gerar mapa estrutural
              </button>
              <button onClick={exemplo} style={btnLeve}>Preencher com caso de exemplo</button>
              <button onClick={limpar} style={btnLeve}>Limpar</button>
              {!completo && (
                <Etiqueta cor={T.tintaMedia}>
                  Faltam {DIMENSOES.length - respondidas} respostas
                </Etiqueta>
              )}
            </div>
          </div>
        )}

        {/* ---------------- MAPA ---------------- */}
        {aba === "mapa" && (
          <div className="fade">
            {respondidas === 0 ? (
              <Vazio onIr={() => setAba("consulta")} />
            ) : (
              <>
                <div style={{ marginBottom: 6 }}>
                  <Etiqueta>{propriedade} · {municipio}</Etiqueta>
                </div>
                <h2 style={h2}>Onde as restrições são decididas</h2>
                <p style={paragrafo}>
                  Cada ponto cheio marca a escala em que a restrição é efetivamente decidida.
                  O círculo vazado acima indica a escala que condiciona a eficácia daquela
                  decisão. Linha contínua sobe; linha tracejada desce.
                </p>

                <div style={{ ...cartao, padding: "20px 18px 12px", marginBottom: 26 }}>
                  <ColunaDeEscalas marcados={marcados} />
                </div>

                {/* Leitura estrutural */}
                <div style={{ ...cartao, padding: 20, marginBottom: 22 }}>
                  <Etiqueta>Leitura estrutural</Etiqueta>
                  <ul style={{ margin: "12px 0 0", paddingLeft: 18, lineHeight: 1.65, fontSize: 15 }}>
                    <li>
                      Restrições decididas na propriedade: <b>{prediais.length}</b>.
                      Dessas, <b>{prediaisCondicionadas.length}</b> têm a eficácia condicionada
                      por escala superior.
                    </li>
                    <li>
                      Restrições decididas acima da propriedade: <b>{supra.length + ESTRUTURAIS.length}</b>,
                      incluindo as duas dimensões estruturais que independem desta consulta.
                    </li>
                    <li>
                      Restrições supraindividuais condicionadas por decisão predial:{" "}
                      <b>{contradiz.length}</b>.
                      {contradiz.length === 0 &&
                        " O condicionamento observado é unidirecional, de cima para baixo."}
                    </li>
                  </ul>
                </div>

                {/* Signature textual */}
                <div style={{
                  border: `1px solid ${T.tinta}`, background: T.papelClaro,
                  padding: "24px 22px", marginBottom: 22
                }}>
                  <Etiqueta>O que é razoável prometer nesta propriedade</Etiqueta>
                  <div style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.62, marginTop: 12 }}>
                    {promessas(flagged).map((p, i) => (
                      <p key={i} style={{ margin: i === 0 ? 0 : "12px 0 0" }}>{p}</p>
                    ))}
                  </div>
                </div>

                {/* Detalhe por dimensão */}
                <h2 style={h2}>Restrições identificadas</h2>
                {marcados.map((d) => (
                  <div key={d.id} style={{
                    ...cartao, padding: "16px 18px", marginBottom: 10,
                    borderLeft: `3px solid ${d.estrutural ? T.estrutural : T.sinal}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        <span style={{ fontFamily: mono, color: T.tintaMedia, marginRight: 8 }}>
                          {String(d.n).padStart(2, "0")}
                        </span>
                        {d.nome}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Etiqueta cor={T.tintaMedia}>
                          decide: {ESCALAS[d.decisao].curto}
                          {d.condicionante !== null && ` · condiciona: ${ESCALAS[d.condicionante].curto}`}
                        </Etiqueta>
                      </div>
                    </div>
                    <p style={{ margin: "9px 0 0", fontSize: 14.5, lineHeight: 1.55, color: T.tintaMedia }}>
                      {d.achado}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ---------------- CARTEIRA ---------------- */}
        {aba === "carteira" && (
          <div className="fade">
            <h2 style={h2}>Padrão de uma carteira de propriedades</h2>
            <p style={paragrafo}>
              Agregando consultas de uma mesma área, aparecem as dimensões que se repetem.
              Restrições recorrentes decididas acima da propriedade não se corrigem
              propriedade a propriedade. Dados fictícios, para demonstração.
            </p>

            <div style={{ ...cartao, padding: 0, overflowX: "auto", marginBottom: 20 }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ ...th, textAlign: "left", minWidth: 190 }}>Propriedade</th>
                    {[...DIMENSOES].sort((a, b) => a.n - b.n).map((d) => (
                      <th key={d.id} style={{ ...th, width: 42 }}>
                        <span style={{ fontFamily: mono, fontSize: 10 }}>
                          {String(d.n).padStart(2, "0")}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CARTEIRA.map((p) => (
                    <tr key={p.nome}>
                      <td style={{ ...td, textAlign: "left" }}>
                        {p.nome}
                        <div><Etiqueta cor={T.neutro}>{p.mun}</Etiqueta></div>
                      </td>
                      {[...DIMENSOES].sort((a, b) => a.n - b.n).map((d) => (
                        <td key={d.id} style={td}>
                          {p.flags.includes(d.id) ? (
                            <span style={{
                              display: "inline-block", width: 11, height: 11,
                              background: d.decisao === 0 ? T.sinal : T.estrutural
                            }} />
                          ) : (
                            <span style={{ color: T.neutro }}>·</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
              <Legenda cor={T.sinal} texto="Decidida na propriedade" preenchido />
              <Legenda cor={T.estrutural} texto="Decidida acima da propriedade" preenchido />
            </div>

            <div style={{ ...cartao, padding: 20 }}>
              <Etiqueta>Recorrência na carteira</Etiqueta>
              <div style={{ marginTop: 14 }}>
                {[...DIMENSOES]
                  .map((d) => ({ d, c: CARTEIRA.filter((p) => p.flags.includes(d.id)).length }))
                  .sort((a, b) => b.c - a.c)
                  .slice(0, 6)
                  .map(({ d, c }) => (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
                      <div style={{ width: 168, fontSize: 13.5 }}>{d.nome}</div>
                      <div style={{ flex: 1, height: 14, background: T.papel }}>
                        <div style={{
                          width: `${(c / CARTEIRA.length) * 100}%`, height: "100%",
                          background: d.decisao === 0 ? T.sinalFraco : T.estruturalFraco,
                          borderRight: `2px solid ${d.decisao === 0 ? T.sinal : T.estrutural}`
                        }} />
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 11, width: 40, color: T.tintaMedia }}>
                        {c}/{CARTEIRA.length}
                      </div>
                    </div>
                  ))}
              </div>
              <p style={{ ...paragrafo, marginTop: 16, marginBottom: 0, fontSize: 14 }}>
                Nesta carteira, as restrições mais recorrentes estão nas dimensões do setor
                produtivo, institucional e territorial. Nenhuma delas é decidida na
                propriedade, e é isso que a visão por unidade produtiva não mostra.
              </p>
            </div>
          </div>
        )}

        {/* ---------------- NOTA ---------------- */}
        {aba === "nota" && (
          <div className="fade" style={{ maxWidth: 660 }}>
            <h2 style={h2}>Nota metodológica</h2>
            <p style={paragrafo}>
              Este instrumento organiza a leitura de uma consulta de rebanho segundo doze
              dimensões, atribuindo a cada restrição identificada a escala em que a decisão
              é tomada e a escala que condiciona sua eficácia.
            </p>
            <div style={{ ...cartao, padding: 20, marginBottom: 18 }}>
              <Etiqueta cor={T.tinta}>O que este instrumento não faz</Etiqueta>
              <ul style={{ margin: "12px 0 0", paddingLeft: 18, lineHeight: 1.6, fontSize: 14.5 }}>
                <li>Não gera escore agregado nem índice de risco.</li>
                <li>Não pondera as dimensões entre si.</li>
                <li>Não prediz desfecho de falha de controle.</li>
                <li>Não substitui diagnóstico laboratorial nem prescrição.</li>
              </ul>
            </div>
            <p style={paragrafo}>
              A ausência de ponderação é deliberada. Atribuir pesos relativos exigiria
              evidência de importância comparada entre dimensões que a literatura disponível
              não fornece. A atribuição de escalas é interpretativa e aguarda validação por
              consenso estruturado de especialistas.
            </p>
            <p style={paragrafo}>
              As respostas registradas correspondem às variáveis previstas para levantamento
              transversal em região definida. Qualquer uso das respostas para fins de
              pesquisa depende de consentimento explícito e de aprovação em comitê de ética,
              obtidos antes da coleta.
            </p>
            <div style={{ borderTop: `1px solid ${T.regua}`, marginTop: 22, paddingTop: 14 }}>
              <Etiqueta cor={T.neutro}>
                Demonstrador de pesquisa · dados de exemplo · não é dispositivo médico veterinário
              </Etiqueta>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Componentes auxiliares                                             */
/* ------------------------------------------------------------------ */
function Pergunta({ d, valor, onResponder }) {
  const respondida = valor !== undefined;
  const marcada = respondida && d.opcoes[valor].flag;
  return (
    <div style={{
      padding: "16px 0", borderBottom: `1px solid ${T.regua}`,
      display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10
    }}>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: T.tintaMedia }}>
            {String(d.n).padStart(2, "0")}
          </span>
          <Etiqueta cor={T.tintaMedia}>{d.nome}</Etiqueta>
          {d.verificacao && (
            <Etiqueta cor={T.sinal} style={{ border: `1px solid ${T.sinal}`, padding: "1px 6px" }}>
              {d.verificacao}
            </Etiqueta>
          )}
          {marcada && (
            <span style={{
              width: 7, height: 7, borderRadius: "50%", background: T.sinal, marginLeft: "auto"
            }} />
          )}
        </div>
        <p style={{ margin: "7px 0 0", fontSize: 15.5, lineHeight: 1.45 }}>{d.pergunta}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {d.opcoes.map((o, i) => {
          const sel = valor === i;
          return (
            <button key={i} onClick={() => onResponder(d.id, i)}
              style={{
                border: `1px solid ${sel ? (o.flag ? T.sinal : T.tinta) : T.regua}`,
                background: sel ? (o.flag ? T.sinalFraco : T.papelClaro) : "transparent",
                color: T.tinta, padding: "8px 13px", cursor: "pointer",
                fontFamily: sans, fontSize: 13.5, textAlign: "left", lineHeight: 1.35,
              }}>
              {o.r}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Campo({ rotulo, valor, onChange, largura }) {
  return (
    <label style={{ display: "block" }}>
      <Etiqueta>{rotulo}</Etiqueta>
      <input value={valor} onChange={(e) => onChange(e.target.value)}
        style={{
          display: "block", width: largura, maxWidth: "100%", marginTop: 5,
          border: "none", borderBottom: `1px solid ${T.tinta}`, background: "transparent",
          fontFamily: sans, fontSize: 15, padding: "4px 0", color: T.tinta, outline: "none"
        }} />
    </label>
  );
}

function Vazio({ onIr }) {
  return (
    <div style={{ ...cartao, padding: "40px 24px", textAlign: "center" }}>
      <p style={{ fontFamily: serif, fontSize: 17, margin: "0 0 16px", color: T.tintaMedia }}>
        O mapa aparece depois da consulta.
      </p>
      <button onClick={onIr} style={{
        background: T.tinta, color: T.papelClaro, border: "none", padding: "11px 20px",
        cursor: "pointer", fontFamily: mono, fontSize: 11, letterSpacing: "0.12em",
        textTransform: "uppercase"
      }}>
        Abrir consulta
      </button>
    </div>
  );
}

function promessas(flagged) {
  const tem = (id) => flagged.some((d) => d.id === id);
  const out = [];

  if (tem("tecnologica")) {
    out.push("Não prometa monitoramento coproparasitológico periódico. O laboratório de referência não está ao alcance da rotina desta propriedade, e a recomendação seria correta no papel e inexequível no campo. Combine antes o acesso, depois prescreva.");
  }
  if (tem("territorial")) {
    out.push("O retorno da manutenção de refúgio nesta propriedade é limitado pelo que ocorre nas vizinhas. Diga isso ao produtor antes de recomendar a medida, para que a ausência de resultado visível não seja lida como falha da recomendação técnica.");
  }
  if (tem("setor")) {
    out.push("A recomendação será remediada no ponto de venda. Registre por escrito a classe química indicada, e não a marca, para reduzir a chance de substituição por produto da mesma base.");
  }
  if (tem("patologica")) {
    out.push("Sem FECRT, qualquer troca de base é aposta. O primeiro item da conduta é estabelecer a linha de base de eficácia, não substituir o produto.");
  }
  if (tem("informacional") && !tem("setor")) {
    out.push("Antes de qualquer rotação, verifique com o produtor a classe química efetivamente utilizada no último ciclo.");
  }
  if (out.length === 0) {
    out.push("As restrições identificadas estão predominantemente ao alcance desta propriedade. A conduta técnica usual tende a produzir o resultado esperado, e a expectativa pode ser comunicada sem ressalvas adicionais.");
  }
  out.push("As dimensões extraterritorial e de dependência permanecem fora do alcance de qualquer conduta aqui adotada e devem ser tratadas como restrição de horizonte, não como item de prescrição.");
  return out;
}

/* estilos compartilhados */
const cartao = { background: T.papelClaro, border: `1px solid ${T.regua}` };
const h2 = { fontFamily: sans, fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 8px" };
const paragrafo = { fontSize: 15, lineHeight: 1.6, color: T.tintaMedia, margin: "0 0 18px", maxWidth: 660 };
const btnLeve = {
  background: "transparent", border: `1px solid ${T.regua}`, color: T.tintaMedia,
  padding: "11px 16px", cursor: "pointer", fontFamily: mono, fontSize: 11,
  letterSpacing: "0.1em", textTransform: "uppercase"
};
const th = {
  padding: "10px 8px", borderBottom: `1px solid ${T.tinta}`, textAlign: "center",
  fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: T.tintaMedia, fontWeight: 400
};
const td = { padding: "9px 8px", borderBottom: `1px solid ${T.regua}`, textAlign: "center" };
