import React from 'react'
import {
  Deck, Slide, Heading, Text, Box, FlexBox, Appear, Notes,
} from 'spectacle'

// ─── Configuração do dashboard (altere para a URL em produção) ────────────────
const DASHBOARD_URL = 'http://localhost:3000'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary: '#0EA674',           // corporate green — dominant
  accent:  '#34D399',           // light green — highlights
  muted:   '#065F46',           // dark green — card borders / backgrounds
  red:     '#EF4444',           // problem slides only
  dark:    '#07090F',
  darker:  '#030508',
  card:    'rgba(255,255,255,0.04)',
  border:  'rgba(14,166,116,0.18)',
  white:   '#F0EDE8',
  dim:     'rgba(240,237,232,0.50)',
}

const FONT = {
  display: '"Bebas Neue", Impact, sans-serif',
  body:    '"IBM Plex Sans", system-ui, sans-serif',
  mono:    '"Space Mono", monospace',
}

const BG = {
  dots: `radial-gradient(circle, rgba(14,166,116,0.11) 1px, transparent 1px)`,
  grid: `linear-gradient(rgba(14,166,116,0.05) 1px, transparent 1px),
         linear-gradient(90deg, rgba(14,166,116,0.05) 1px, transparent 1px)`,
}

// ─── Spectacle theme ──────────────────────────────────────────────────────────
const theme = {
  colors: {
    primary:   C.white,
    secondary: C.primary,
    tertiary:  C.dark,
  },
  fonts: {
    header:    FONT.display,
    text:      FONT.body,
    monospace: FONT.mono,
  },
  fontSizes: {
    h1: '80px', h2: '56px', h3: '40px', h4: '28px',
    text: '22px', monospace: '18px',
  },
  space: [8, 16, 24, 32, 48, 64],
}

// ─── Micro-components ─────────────────────────────────────────────────────────

const Label = ({ children, color = C.primary }) => (
  <div style={{
    fontFamily: FONT.mono,
    fontSize: '11px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color,
    marginBottom: '16px',
  }}>
    {children}
  </div>
)

const Bar = ({ color = C.primary, width = '56px' }) => (
  <div style={{ height: '2px', width, background: color, margin: '20px 0' }} />
)

const Tag = ({ children, color = C.primary }) => (
  <div style={{
    display: 'inline-block',
    border: `1px solid ${color}55`,
    color: `${color}CC`,
    fontFamily: FONT.mono,
    fontSize: '11px',
    letterSpacing: '2px',
    padding: '4px 12px',
    borderRadius: '2px',
    textTransform: 'uppercase',
  }}>
    {children}
  </div>
)

const StatCard = ({ value, label, accent = C.primary }) => (
  <div style={{
    flex: 1,
    background: C.card,
    border: `1px solid ${accent}25`,
    borderTop: `2px solid ${accent}`,
    borderRadius: '3px',
    padding: '28px 24px',
  }}>
    <div style={{
      fontFamily: FONT.display,
      fontSize: '62px',
      color: accent,
      lineHeight: 1,
      marginBottom: '10px',
    }}>
      {value}
    </div>
    <div style={{
      fontFamily: FONT.mono,
      fontSize: '11px',
      color: C.dim,
      letterSpacing: '1px',
      textTransform: 'uppercase',
      lineHeight: 1.5,
    }}>
      {label}
    </div>
  </div>
)

const FlowNode = ({ label, sub, accent = C.primary, highlighted = false }) => (
  <div style={{
    background: highlighted ? `${accent}14` : C.card,
    border: `1px solid ${highlighted ? accent : `${accent}28`}`,
    borderRadius: '3px',
    padding: '18px 14px',
    textAlign: 'center',
    minWidth: '118px',
  }}>
    <div style={{
      fontFamily: FONT.mono,
      fontSize: '11px',
      color: accent,
      letterSpacing: '1px',
      fontWeight: 700,
      textTransform: 'uppercase',
    }}>
      {label}
    </div>
    {sub && (
      <div style={{
        fontFamily: FONT.body,
        fontSize: '11px',
        color: C.dim,
        marginTop: '4px',
      }}>
        {sub}
      </div>
    )}
  </div>
)

const Arrow = ({ color = C.primary }) => (
  <div style={{
    color: `${color}60`,
    fontSize: '14px',
    padding: '0 6px',
    display: 'flex',
    alignItems: 'center',
    fontFamily: FONT.mono,
    letterSpacing: '-2px',
  }}>
    ───▶
  </div>
)

const IssueRow = ({ num, title, detail }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    background: 'rgba(239,68,68,0.05)',
    border: '1px solid rgba(239,68,68,0.15)',
    borderLeft: '2px solid rgba(239,68,68,0.6)',
    borderRadius: '3px',
    padding: '18px 22px',
    marginBottom: '12px',
  }}>
    <div style={{
      fontFamily: FONT.display,
      fontSize: '42px',
      color: 'rgba(239,68,68,0.22)',
      lineHeight: 1,
      minWidth: '50px',
    }}>
      {num}
    </div>
    <div>
      <div style={{
        fontFamily: FONT.body,
        fontSize: '18px',
        fontWeight: 700,
        color: C.white,
        marginBottom: '3px',
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: FONT.body,
        fontSize: '14px',
        color: C.dim,
      }}>
        {detail}
      </div>
    </div>
  </div>
)

const BulletRow = ({ children, color = C.primary }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '13px',
  }}>
    <div style={{
      color,
      fontFamily: FONT.mono,
      fontSize: '12px',
      minWidth: '14px',
      marginTop: '3px',
    }}>
      ▸
    </div>
    <div style={{
      fontFamily: FONT.body,
      fontSize: '16px',
      color: C.white,
      lineHeight: 1.5,
    }}>
      {children}
    </div>
  </div>
)

const SecurityCard = ({ index, title, desc }) => (
  <div style={{
    flex: 1,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderTop: `2px solid ${C.primary}`,
    borderRadius: '3px',
    padding: '26px 22px',
  }}>
    <div style={{
      fontFamily: FONT.mono,
      fontSize: '11px',
      color: `${C.primary}70`,
      letterSpacing: '2px',
      marginBottom: '14px',
    }}>
      [{String(index).padStart(2, '0')}]
    </div>
    <div style={{
      fontFamily: FONT.display,
      fontSize: '24px',
      color: C.primary,
      letterSpacing: '2px',
      marginBottom: '10px',
    }}>
      {title}
    </div>
    <div style={{
      fontFamily: FONT.body,
      fontSize: '14px',
      color: C.dim,
      lineHeight: 1.65,
    }}>
      {desc}
    </div>
  </div>
)

const PricingCard = ({ tier, model, price, highlight = false }) => (
  <div style={{
    flex: 1,
    background: highlight ? `${C.primary}0E` : C.card,
    border: `1px solid ${highlight ? C.primary : C.border}`,
    borderTop: `2px solid ${highlight ? C.primary : 'transparent'}`,
    borderRadius: '3px',
    padding: '26px 22px',
    position: 'relative',
  }}>
    {highlight && (
      <div style={{
        position: 'absolute', top: '-12px', left: '50%',
        transform: 'translateX(-50%)',
        background: C.primary, color: C.dark,
        fontFamily: FONT.mono, fontSize: '10px',
        fontWeight: 700, letterSpacing: '2px',
        padding: '3px 12px', borderRadius: '2px',
        whiteSpace: 'nowrap',
      }}>
        FOCO BRADESCO
      </div>
    )}
    <div style={{
      fontFamily: FONT.mono, fontSize: '10px',
      color: highlight ? C.primary : C.dim,
      letterSpacing: '2px', textTransform: 'uppercase',
      marginBottom: '10px',
    }}>
      {tier}
    </div>
    <div style={{
      fontFamily: FONT.display, fontSize: '34px',
      color: C.white, lineHeight: 1.1, marginBottom: '10px',
    }}>
      {price}
    </div>
    <div style={{
      fontFamily: FONT.body, fontSize: '14px',
      color: C.dim, lineHeight: 1.55,
    }}>
      {model}
    </div>
  </div>
)

const PhaseCol = ({ index, phase, items, color, done = false }) => (
  <div style={{
    flex: 1,
    background: done ? `${color}0A` : C.card,
    border: `1px solid ${color}30`,
    borderTop: `2px solid ${color}`,
    padding: '24px 22px',
  }}>
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        fontFamily: FONT.mono, fontSize: '10px',
        color: `${color}70`, letterSpacing: '2px',
        marginBottom: '4px',
      }}>
        [{String(index).padStart(2, '0')}] {done ? '— CONCLUÍDO' : '— PLANEJADO'}
      </div>
      <div style={{
        fontFamily: FONT.display, fontSize: '26px',
        color, letterSpacing: '3px',
      }}>
        {phase}
      </div>
    </div>
    {items.map((item, i) => (
      <div key={i} style={{
        fontFamily: FONT.body, fontSize: '14px',
        color: done ? C.dim : 'rgba(240,237,232,0.72)',
        marginBottom: '9px',
        paddingLeft: '12px',
        borderLeft: `1px solid ${color}30`,
        lineHeight: 1.45,
      }}>
        {item}
      </div>
    ))}
  </div>
)

// ─── Deck template ────────────────────────────────────────────────────────────
const Template = ({ slideNumber, numberOfSlides }) => (
  <FlexBox
    justifyContent="space-between"
    alignItems="center"
    position="absolute"
    bottom={0}
    width={1}
    style={{ padding: '0 48px 18px' }}
  >
    <div style={{
      fontFamily: FONT.mono, fontSize: '10px',
      color: 'rgba(240,237,232,0.18)', letterSpacing: '3px',
    }}>
      HARVESTSHIELD
    </div>
    <div style={{
      fontFamily: FONT.mono, fontSize: '10px',
      color: 'rgba(240,237,232,0.18)',
    }}>
      {slideNumber} / {numberOfSlides}
    </div>
  </FlexBox>
)

// ─── Geometric decoration ─────────────────────────────────────────────────────
const HexDecor = () => (
  <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
    <polygon points="100,8 190,55 190,145 100,192 10,145 10,55"
      stroke={C.primary} strokeWidth="1" opacity="0.3" />
    <polygon points="100,28 170,70 170,130 100,172 30,130 30,70"
      stroke={C.primary} strokeWidth="0.8" opacity="0.16" />
    <polygon points="100,48 150,85 150,115 100,152 50,115 50,85"
      stroke={C.primary} strokeWidth="0.6" opacity="0.1" />
    <circle cx="100" cy="100" r="3.5" fill={C.primary} opacity="0.7" />
    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
      const r = Math.PI / 180
      return (
        <circle key={i}
          cx={100 + 82 * Math.cos(deg * r)}
          cy={100 + 82 * Math.sin(deg * r)}
          r="2.5" fill={C.primary} opacity="0.4"
        />
      )
    })}
    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
      const r = Math.PI / 180
      return <line key={i} x1="100" y1="100"
        x2={100 + 82 * Math.cos(deg * r)}
        y2={100 + 82 * Math.sin(deg * r)}
        stroke={C.primary} strokeWidth="0.4" opacity="0.18" />
    })}
  </svg>
)

// ─── Presentation ─────────────────────────────────────────────────────────────
export default function Presentation() {
  return (
    <Deck theme={theme} template={Template}>

      {/* ── COVER ───────────────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.darker}
        backgroundImage={BG.dots}
        backgroundSize="40px 40px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" alignItems="center" style={{ padding: '0 80px' }}>
          <div style={{ flex: 1 }}>
            <Tag>inovaBra Bradesco — 2026</Tag>
            <div style={{ marginTop: '28px' }}>
              <div style={{
                fontFamily: FONT.display,
                fontSize: '112px',
                color: C.white,
                lineHeight: 0.88,
                letterSpacing: '5px',
              }}>
                HARVEST
              </div>
              <div
                className="shimmer-text"
                style={{
                  fontFamily: FONT.display,
                  fontSize: '112px',
                  lineHeight: 0.88,
                  letterSpacing: '5px',
                }}
              >
                SHIELD
              </div>
            </div>
            <Bar width="64px" />
            <div style={{
              fontFamily: FONT.body,
              fontSize: '19px',
              color: C.dim,
              lineHeight: 1.7,
              maxWidth: '460px',
            }}>
              Monitoramento agrícola com dados{' '}
              <span style={{ color: C.white, fontWeight: 600 }}>verificados e imutáveis</span>{' '}
              em blockchain — para crédito rural e seguros sem fraude.
            </div>
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['IoT — ESP32', 'Blockchain Stellar', 'Seguros Agrícolas'].map(t => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>
          <div style={{ padding: '0 0 0 40px', opacity: 0.7 }}>
            <HexDecor />
          </div>
        </FlexBox>
        <Notes>
          Pausa de 3 segundos antes de falar. Não comece com tecnologia — comece com o problema do banco.
        </Notes>
      </Slide>

      {/* ── SLIDE 1: PROBLEMA ───────────────────────────────────────────────── */}
      <Slide
        backgroundColor="#09050A"
        backgroundImage={BG.grid}
        backgroundSize="60px 60px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label color={C.red}>O problema do banco</Label>
          <div>
            <div style={{
              fontFamily: FONT.mono, fontSize: '16px',
              color: C.dim, letterSpacing: '4px',
            }}>
              R$
            </div>
            <div style={{
              fontFamily: FONT.display,
              fontSize: '148px',
              color: C.red,
              lineHeight: 0.85,
              letterSpacing: '-2px',
            }}>
              16 BI
            </div>
            <div style={{
              fontFamily: FONT.body,
              fontSize: '21px',
              color: C.dim,
              marginTop: '10px',
            }}>
              pagos em sinistros agrícolas em 2023
            </div>
          </div>
          <Bar color={C.red} width="48px" />
          <Appear>
            <div style={{
              fontFamily: FONT.body,
              fontSize: '24px',
              color: C.white,
              lineHeight: 1.55,
              maxWidth: '660px',
              fontStyle: 'italic',
            }}>
              "Quantos foram baseados em dados que{' '}
              <span style={{ color: C.red, fontStyle: 'normal', fontWeight: 700 }}>
                poderiam ter sido manipulados?
              </span>"
            </div>
          </Appear>
        </FlexBox>
        <Notes>
          PAUSA de 3 segundos após R$ 16 BI. Deixe o número impactar. Só então avance.
        </Notes>
      </Slide>

      {/* ── SLIDE 2: MERCADO ────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.dark}
        backgroundImage={BG.dots}
        backgroundSize="40px 40px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Dimensão do mercado</Label>
          <Heading fontSize="h2" style={{ letterSpacing: '3px', marginBottom: '44px' }}>
            O agro cresce.{' '}
            <span style={{ color: C.primary }}>O dado não acompanha.</span>
          </Heading>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
            <Appear>
              <StatCard value="27%" label="do PIB brasileiro é agronegócio" accent={C.primary} />
            </Appear>
            <Appear>
              <StatCard value="+180%" label="crescimento do seguro rural em 5 anos" accent={C.accent} />
            </Appear>
            <Appear>
              <StatCard value="900 km²" label="cobertos por apenas 1 estação meteorológica" accent={C.white} />
            </Appear>
          </div>
        </FlexBox>
        <Notes>
          Revele um número por vez. Enfatize: mercado cresce, infraestrutura de dados é precária.
        </Notes>
      </Slide>

      {/* ── SLIDE 3: FRAUDE HOJE ────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.dark}
        backgroundImage={BG.grid}
        backgroundSize="60px 60px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label color={C.red}>Fragilidade do processo atual</Label>
          <Heading fontSize="h2" style={{ letterSpacing: '3px', marginBottom: '36px' }}>
            Três falhas estruturais
          </Heading>
          <Appear>
            <IssueRow num="01"
              title="Dados coletados após o evento"
              detail="Não há registro contínuo — apenas relato posterior do produtor" />
          </Appear>
          <Appear>
            <IssueRow num="02"
              title="Ausência de cadeia de custódia"
              detail="Qualquer dado pode ser alterado no caminho — sem rastreabilidade" />
          </Appear>
          <Appear>
            <IssueRow num="03"
              title="Perícia cara, lenta e subjetiva"
              detail="Alto custo operacional e janela de manipulação entre evento e vistoria" />
          </Appear>
        </FlexBox>
        <Notes>
          Após o item 03, pause: "O Bradesco Seguros e o crédito rural do banco convivem com esse risco todos os dias."
        </Notes>
      </Slide>

      {/* ── SLIDE 4: SOLUÇÃO ────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.dark}
        backgroundImage={BG.dots}
        backgroundSize="40px 40px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Nossa solução</Label>
          <Heading fontSize="h2" style={{ letterSpacing: '3px', marginBottom: '10px' }}>
            Dado coletado.{' '}
            <span style={{ color: C.primary }}>Assinado. Imutável.</span>
          </Heading>
          <div style={{
            fontFamily: FONT.body, fontSize: '17px', color: C.dim,
            marginBottom: '40px',
          }}>
            Verificável por qualquer auditor, em qualquer momento, sem intermediários.
          </div>

          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.28)',
            border: `1px solid ${C.border}`,
            borderRadius: '4px',
            padding: '26px 32px',
            gap: 0,
          }}>
            <FlowNode label="ESP32" sub="Sensor IoT" accent={C.accent} />
            <Arrow color={C.accent} />
            <FlowNode label="ORACLE" sub="ECDSA + PoW" accent={C.primary} highlighted />
            <Arrow />
            <FlowNode label="DATABASE" sub="PostgreSQL" accent={C.primary} />
            <Arrow />
            <FlowNode label="STELLAR" sub="Blockchain" accent={C.accent} />
            <Arrow />
            <div style={{
              background: `${C.primary}14`,
              border: `1.5px solid ${C.primary}`,
              borderRadius: '3px',
              padding: '18px 14px',
              textAlign: 'center',
              minWidth: '118px',
            }}>
              <div style={{
                fontFamily: FONT.mono, fontSize: '11px',
                color: C.primary, fontWeight: 700, letterSpacing: '1px',
              }}>
                BRADESCO
              </div>
              <div style={{
                fontFamily: FONT.body, fontSize: '11px',
                color: C.dim, marginTop: '4px',
              }}>
                API verificada
              </div>
            </div>
          </div>

          <Appear>
            <div style={{
              marginTop: '18px',
              background: `${C.primary}08`,
              border: `1px solid ${C.primary}22`,
              borderRadius: '3px',
              padding: '13px 20px',
            }}>
              <div style={{
                fontFamily: FONT.body, fontSize: '15px',
                color: `${C.primary}CC`, fontStyle: 'italic',
              }}>
                Nenhum dado pode ser alterado retroativamente — nem pelo produtor, nem pelo operador, nem por nós.
              </div>
            </div>
          </Appear>
        </FlexBox>
        <Notes>
          Percorra o fluxo da esquerda para a direita. O ponto-chave: imutabilidade garantida em múltiplas camadas.
        </Notes>
      </Slide>

      {/* ── SLIDE 5: DEMO ───────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.darker}
        backgroundImage={BG.grid}
        backgroundSize="60px 60px"
        backgroundRepeat="repeat"
      >
        {/* Full-slide absolute layout so iframe fills the space */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '14px 20px 28px',
        }}>
          {/* Header bar */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="live-dot" />
              <span style={{
                fontFamily: FONT.mono, fontSize: '11px',
                color: C.red, letterSpacing: '4px', textTransform: 'uppercase',
              }}>
                Demonstração ao vivo
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <a
                href={DASHBOARD_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: `${C.primary}18`,
                  border: `1px solid ${C.primary}55`,
                  borderRadius: '2px',
                  padding: '4px 12px',
                  fontFamily: FONT.mono,
                  fontSize: '10px',
                  color: C.primary,
                  letterSpacing: '1px',
                  textDecoration: 'none',
                }}
              >
                ABRIR ↗
              </a>
            </div>
          </div>

          {/* iframe — fills remaining height */}
          <div style={{
            flex: 1,
            border: `1px solid ${C.primary}28`,
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
            minHeight: 0,
          }}>
            <iframe
              src={DASHBOARD_URL}
              title="HarvestShield Dashboard"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
            />
          </div>

          {/* Footer note */}
          <div style={{
            fontFamily: FONT.body, fontSize: '12px',
            color: C.dim, marginTop: '8px',
            textAlign: 'center', fontStyle: 'italic',
            flexShrink: 0,
          }}>
            Clicar em "confirmed" → Stellar Explorer — transação pública e permanente
          </div>
        </div>
        <Notes>
          O dashboard aparece diretamente neste slide.
          Percurso: DeviceCard — ReadingCard — clicar em TX confirmed — Stellar Explorer.
          Botão "ABRIR ↗" abre em nova aba para tela cheia.
          Para usar URL de produção: editar DASHBOARD_URL no topo de Presentation.jsx.
        </Notes>
      </Slide>

      {/* ── SLIDE 6: SEGURANÇA ──────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.dark}
        backgroundImage={BG.dots}
        backgroundSize="40px 40px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Arquitetura de segurança</Label>
          <Heading fontSize="h2" style={{ letterSpacing: '3px', marginBottom: '40px' }}>
            Três camadas independentes
          </Heading>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'stretch' }}>
            <Appear>
              <SecurityCard index={1}
                title="ECDSA P-256"
                desc="Par de chaves criptográficas único por dispositivo. Dados de dispositivos não registrados são rejeitados na origem — sem exceções."
              />
            </Appear>
            <Appear>
              <SecurityCard index={2}
                title="PROOF OF WORK"
                desc="Cada envio exige custo computacional mensurável. Impede ataques em massa e garante autenticidade contínua de cada leitura."
              />
            </Appear>
            <Appear>
              <SecurityCard index={3}
                title="BLOCKCHAIN"
                desc="Registro permanente na rede Stellar. Comprometer o servidor não altera o histórico — a imutabilidade está na cadeia pública."
              />
            </Appear>
          </div>
          <Appear>
            <div style={{
              marginTop: '20px',
              background: `${C.primary}08`,
              border: `1px solid ${C.primary}20`,
              borderRadius: '3px',
              padding: '13px 22px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: FONT.body, fontSize: '15px',
                color: `${C.primary}BB`, fontStyle: 'italic',
              }}>
                "O nível de garantia que um contrato de seguro ou uma operação de crédito rural exigem."
              </div>
            </div>
          </Appear>
        </FlexBox>
        <Notes>
          Enfatize: mesmo comprometendo o servidor, o histórico na blockchain não pode ser reescrito.
        </Notes>
      </Slide>

      {/* ── SLIDE 7: MODELO DE NEGÓCIO ──────────────────────────────────────── */}
      <Slide
        backgroundColor={C.dark}
        backgroundImage={BG.grid}
        backgroundSize="60px 60px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Modelo de negócio</Label>
          <Heading fontSize="h2" style={{ letterSpacing: '3px', marginBottom: '40px' }}>
            Três fontes de receita
          </Heading>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'stretch' }}>
            <PricingCard
              tier="Produtor Rural"
              model="SaaS por dispositivo instalado na propriedade"
              price="R$ 150 / mês"
            />
            <PricingCard
              tier="Cooperativa"
              model="SaaS por frota de dispositivos com desconto em volume"
              price="R$ 80 / disp."
            />
            <PricingCard
              tier="Seguradora — Banco"
              model="API de verificação e acesso a dados históricos para automação de sinistros e crédito"
              price="Licença anual"
              highlight
            />
          </div>
          <Appear>
            <div style={{
              marginTop: '20px',
              fontFamily: FONT.body, fontSize: '15px',
              color: C.dim, textAlign: 'center', fontStyle: 'italic',
            }}>
              Para o Bradesco: dados verificados integráveis diretamente aos sistemas de crédito rural e Bradesco Seguros.
            </div>
          </Appear>
        </FlexBox>
        <Notes>
          A terceira coluna é a relevante para essa banca.
          "Automação de análise de sinistros com dados que nenhuma parte pode contestar."
        </Notes>
      </Slide>

      {/* ── SLIDE 8: PHASE 2 ────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.dark}
        backgroundImage={BG.dots}
        backgroundSize="40px 40px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label color={C.primary}>Plano de expansão</Label>
          <Heading fontSize="h2" style={{ letterSpacing: '3px', marginBottom: '40px' }}>
            Software validado.{' '}
            <span style={{ color: C.primary }}>Hardware a seguir.</span>
          </Heading>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <PhaseCol index={1} phase="HOJE" color={C.primary} done
              items={[
                'Firmware C++ completo e testado',
                'Backend em produção — Supabase',
                'Dashboard em tempo real com status blockchain',
                'Autenticação ECDSA + Proof of Work ativa',
              ]}
            />
            <PhaseCol index={2} phase="6 MESES" color={C.accent}
              items={[
                'Sensores físicos instalados em campo',
                'Comunicação LoRaWAN para áreas rurais sem cobertura',
                'Alimentação solar — operação autônoma',
                '50 dispositivos ativos em fazendas piloto',
              ]}
            />
            <PhaseCol index={3} phase="12 MESES" color={C.white}
              items={[
                '500+ dispositivos em operação',
                'API de sinistros integrada a seguradoras',
                'Integração com crédito rural Bradesco',
                'Processo de certificação Inmetro',
              ]}
            />
          </div>
        </FlexBox>
        <Notes>
          "O investimento vai diretamente para hardware e primeiros pilotos em campo.
          O software já está pronto — acabaram de ver funcionando."
        </Notes>
      </Slide>

      {/* ── SLIDE 9: O QUE PEDIMOS ──────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.dark}
        backgroundImage={BG.grid}
        backgroundSize="60px 60px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Proposta ao Bradesco</Label>
          <Heading fontSize="h2" style={{ letterSpacing: '3px', marginBottom: '40px' }}>
            Duas coisas. Claras.
          </Heading>
          <div style={{ display: 'flex', gap: '28px', alignItems: 'stretch' }}>
            <div style={{
              flex: 1,
              background: `${C.primary}08`,
              border: `1px solid ${C.primary}28`,
              borderTop: `2px solid ${C.primary}`,
              borderRadius: '3px',
              padding: '28px 26px',
            }}>
              <div style={{
                fontFamily: FONT.display, fontSize: '28px',
                color: C.primary, letterSpacing: '3px', marginBottom: '6px',
              }}>
                Parceria estratégica
              </div>
              <div style={{
                fontFamily: FONT.body, fontSize: '13px',
                color: C.dim, fontStyle: 'italic', marginBottom: '20px',
              }}>
                Co-desenvolvimento do caso de uso
              </div>
              <Appear>
                <BulletRow>Piloto com 3 a 5 produtores da carteira de crédito rural</BulletRow>
              </Appear>
              <Appear>
                <BulletRow>Acesso ao time de Bradesco Seguros para co-desenhar a integração de API</BulletRow>
              </Appear>
              <Appear>
                <BulletRow>Validação do caso: automação de análise de sinistros agrícolas</BulletRow>
              </Appear>
            </div>

            <div style={{
              flex: 1,
              background: `${C.accent}06`,
              border: `1px solid ${C.accent}22`,
              borderTop: `2px solid ${C.accent}`,
              borderRadius: '3px',
              padding: '28px 26px',
            }}>
              <div style={{
                fontFamily: FONT.display, fontSize: '28px',
                color: C.accent, letterSpacing: '3px', marginBottom: '6px',
              }}>
                Investimento seed
              </div>
              <div style={{
                fontFamily: FONT.body, fontSize: '13px',
                color: C.dim, fontStyle: 'italic', marginBottom: '20px',
              }}>
                Hardware físico — Phase 2
              </div>
              <Appear>
                <BulletRow color={C.accent}>Capital para produção do hardware do Phase 2</BulletRow>
              </Appear>
              <Appear>
                <BulletRow color={C.accent}>Meta: 50 dispositivos físicos instalados em 6 meses</BulletRow>
              </Appear>
              <Appear>
                <BulletRow color={C.accent}>Retorno: Bradesco como primeiro cliente da API de verificação</BulletRow>
              </Appear>
            </div>
          </div>
        </FlexBox>
        <Notes>
          Fale devagar: "três fazendas", "noventa dias".
          "O retorno do investimento é o Bradesco sendo o primeiro cliente."
        </Notes>
      </Slide>

      {/* ── SLIDE 10: CTA ───────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.darker}
        backgroundImage={BG.dots}
        backgroundSize="40px 40px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" alignItems="center">
          <Label style={{ textAlign: 'center' }}>Próximos passos</Label>

          <div style={{
            fontFamily: FONT.display,
            fontSize: '96px',
            color: C.white,
            letterSpacing: '4px',
            lineHeight: 0.88,
            textAlign: 'center',
            marginBottom: '36px',
          }}>
            90 DIAS.<br />
            <span style={{ color: C.primary }}>3 FAZENDAS.</span><br />
            <span className="shimmer-text">BLOCKCHAIN REAL.</span>
          </div>

          <Bar color={C.primary} width="64px" />

          <div style={{
            fontFamily: FONT.body, fontSize: '19px',
            color: C.dim, textAlign: 'center',
            maxWidth: '560px', lineHeight: 1.7,
            marginBottom: '36px',
          }}>
            Não pedimos para apostar em uma ideia.<br />
            O sistema{' '}
            <span style={{ color: C.white, fontWeight: 700 }}>funciona</span>
            {' '}— vocês acabaram de ver.
          </div>

          <div style={{
            background: C.primary,
            color: C.dark,
            padding: '14px 44px',
            borderRadius: '3px',
            fontFamily: FONT.display,
            fontSize: '26px',
            letterSpacing: '5px',
          }}>
            VAMOS COMEÇAR?
          </div>
        </FlexBox>
        <Notes>
          Fale devagar. Pausa após cada linha. Olhe para a banca ao dizer "funciona".
          Finalize com: "Obrigado."
        </Notes>
      </Slide>

    </Deck>
  )
}
