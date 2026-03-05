import React from 'react'
import {
  Deck, Slide, Heading, Text, Box, FlexBox, Appear, Notes,
} from 'spectacle'

// ─── Dashboard URL ─────────────────────────────────────────────────────────────
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:3004'

// ─── IBM Carbon Design System — Dark G100 ──────────────────────────────────────
const C = {
  // Surfaces
  bg:       '#161616',   // IBM Gray-100
  surface:  '#262626',   // IBM Gray-90
  surface2: '#353535',   // IBM Gray-80 — hover
  border:   '#393939',   // IBM Gray-70

  // IBM Blue — the ONLY accent
  blue:     '#0f62fe',   // IBM Blue-60
  blueHov:  '#0353e9',   // IBM Blue-70
  blueLt:   '#4589ff',   // IBM Blue-50 — secondary/links
  blueDim:  'rgba(15, 98, 254, 0.12)',

  // Text
  text:     '#f4f4f4',   // IBM Gray-10
  dim:      'rgba(244, 244, 244, 0.55)',
  muted:    '#8d8d8d',   // IBM Gray-40

  // Status
  red:      '#fa4d56',   // IBM Red-40
  green:    '#42be65',   // IBM Green-40
  yellow:   '#f1c21b',   // IBM Yellow-30

  // Card
  card:     'rgba(38, 38, 38, 0.95)',
  cardBorder: 'rgba(57, 57, 57, 0.8)',
}

const FONT = {
  display: '"IBM Plex Sans Condensed", "IBM Plex Sans", sans-serif',
  body:    '"IBM Plex Sans", system-ui, sans-serif',
  mono:    '"IBM Plex Mono", monospace',
}

// IBM Carbon — very subtle background patterns
const BG = {
  dots: `radial-gradient(circle, rgba(15,98,254,0.06) 1px, transparent 1px)`,
  grid: `linear-gradient(rgba(57,57,57,0.5) 1px, transparent 1px),
         linear-gradient(90deg, rgba(57,57,57,0.5) 1px, transparent 1px)`,
}

// ─── Spectacle theme ────────────────────────────────────────────────────────────
const theme = {
  colors: {
    primary:   C.text,
    secondary: C.blue,
    tertiary:  C.bg,
  },
  fonts: {
    header:    FONT.display,
    text:      FONT.body,
    monospace: FONT.mono,
  },
  fontSizes: {
    h1: '72px', h2: '48px', h3: '36px', h4: '24px',
    text: '20px', monospace: '16px',
  },
  space: [8, 16, 24, 32, 48, 64],
}

// ─── Micro-components — IBM Carbon visual language ──────────────────────────────

// Eyebrow label above headings
const Label = ({ children, color = C.blue }) => (
  <div style={{
    fontFamily: FONT.mono,
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color,
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  }}>
    <span style={{ opacity: 0.5 }}>—</span>
    {children}
  </div>
)

// IBM Carbon — horizontal rule
const Rule = ({ color = C.blue, width = '48px' }) => (
  <div style={{ height: '2px', width, background: color, margin: '18px 0' }} />
)

// IBM Carbon — tag component
const Tag = ({ children, color = C.blue }) => (
  <div style={{
    display: 'inline-block',
    background: `rgba(15,98,254,0.10)`,
    border: `1px solid rgba(15,98,254,0.25)`,
    color: C.blueLt,
    fontFamily: FONT.mono,
    fontSize: '11px',
    letterSpacing: '1px',
    padding: '3px 10px',
    borderRadius: '2px',
    textTransform: 'uppercase',
  }}>
    {children}
  </div>
)

// IBM Carbon — stat card
const StatCard = ({ value, label, accent = C.blue }) => (
  <div style={{
    flex: 1,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderTop: `2px solid ${accent}`,
    padding: '28px 24px',
  }}>
    <div style={{
      fontFamily: FONT.display,
      fontWeight: 700,
      fontSize: '56px',
      color: accent,
      lineHeight: 1,
      marginBottom: '10px',
      letterSpacing: '-0.5px',
    }}>
      {value}
    </div>
    <div style={{
      fontFamily: FONT.body,
      fontSize: '13px',
      color: C.dim,
      lineHeight: 1.5,
      fontWeight: 400,
    }}>
      {label}
    </div>
  </div>
)

// IBM Carbon — flow node
const FlowNode = ({ label, sub, accent = C.blue, highlighted = false }) => (
  <div style={{
    background: highlighted ? `rgba(15,98,254,0.12)` : C.surface,
    border: `1px solid ${highlighted ? C.blue : C.border}`,
    padding: '16px 14px',
    textAlign: 'center',
    minWidth: '110px',
  }}>
    <div style={{
      fontFamily: FONT.mono,
      fontSize: '11px',
      color: highlighted ? C.blue : C.muted,
      letterSpacing: '1px',
      fontWeight: 500,
      textTransform: 'uppercase',
    }}>
      {label}
    </div>
    {sub && (
      <div style={{
        fontFamily: FONT.body,
        fontSize: '11px',
        color: C.muted,
        marginTop: '4px',
      }}>
        {sub}
      </div>
    )}
  </div>
)

// Arrow connector
const Arrow = () => (
  <div style={{
    color: C.border,
    fontSize: '16px',
    padding: '0 4px',
    display: 'flex',
    alignItems: 'center',
    fontFamily: FONT.mono,
  }}>
    →
  </div>
)

// IBM Carbon — inline notification / issue row
const IssueRow = ({ num, title, detail }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    background: 'rgba(250,77,86,0.06)',
    border: '1px solid rgba(250,77,86,0.15)',
    borderLeft: '3px solid rgba(250,77,86,0.7)',
    padding: '16px 20px',
    marginBottom: '10px',
  }}>
    <div style={{
      fontFamily: FONT.mono,
      fontSize: '11px',
      color: 'rgba(250,77,86,0.45)',
      letterSpacing: '1px',
      minWidth: '28px',
      marginTop: '2px',
    }}>
      {num}
    </div>
    <div>
      <div style={{
        fontFamily: FONT.body,
        fontSize: '17px',
        fontWeight: 600,
        color: C.text,
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

// Bullet row
const BulletRow = ({ children, color = C.blue }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
  }}>
    <div style={{
      color,
      fontFamily: FONT.mono,
      fontSize: '14px',
      minWidth: '12px',
      marginTop: '2px',
    }}>
      ·
    </div>
    <div style={{
      fontFamily: FONT.body,
      fontSize: '15px',
      color: C.text,
      lineHeight: 1.55,
    }}>
      {children}
    </div>
  </div>
)

// IBM Carbon — tile / card for security layers
const SecurityCard = ({ index, title, desc }) => (
  <div style={{
    flex: 1,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderTop: `2px solid ${C.blue}`,
    padding: '24px 20px',
  }}>
    <div style={{
      fontFamily: FONT.mono,
      fontSize: '11px',
      color: C.muted,
      letterSpacing: '1px',
      marginBottom: '12px',
    }}>
      {String(index).padStart(2, '0')}
    </div>
    <div style={{
      fontFamily: FONT.display,
      fontWeight: 700,
      fontSize: '20px',
      color: C.blue,
      letterSpacing: '1px',
      marginBottom: '10px',
    }}>
      {title}
    </div>
    <div style={{
      fontFamily: FONT.body,
      fontSize: '13px',
      color: C.dim,
      lineHeight: 1.65,
    }}>
      {desc}
    </div>
  </div>
)

// IBM Carbon — pricing tile
const PricingCard = ({ tier, model, price, highlight = false }) => (
  <div style={{
    flex: 1,
    background: highlight ? `rgba(15,98,254,0.08)` : C.card,
    border: `1px solid ${highlight ? C.blue : C.border}`,
    borderTop: `2px solid ${highlight ? C.blue : 'transparent'}`,
    padding: '24px 20px',
    position: 'relative',
  }}>
    {highlight && (
      <div style={{
        position: 'absolute', top: '-11px', left: '50%',
        transform: 'translateX(-50%)',
        background: C.blue, color: '#fff',
        fontFamily: FONT.mono, fontSize: '10px',
        fontWeight: 500, letterSpacing: '1px',
        padding: '2px 10px',
        whiteSpace: 'nowrap',
      }}>
        FOCO BRADESCO
      </div>
    )}
    <div style={{
      fontFamily: FONT.mono, fontSize: '10px',
      color: highlight ? C.blue : C.muted,
      letterSpacing: '1px', textTransform: 'uppercase',
      marginBottom: '10px',
    }}>
      {tier}
    </div>
    <div style={{
      fontFamily: FONT.display,
      fontWeight: 700,
      fontSize: '28px',
      color: C.text, lineHeight: 1.1, marginBottom: '10px',
    }}>
      {price}
    </div>
    <div style={{
      fontFamily: FONT.body, fontSize: '13px',
      color: C.dim, lineHeight: 1.55,
    }}>
      {model}
    </div>
  </div>
)

// IBM Carbon — phase column
const PhaseCol = ({ index, phase, items, color, done = false }) => (
  <div style={{
    flex: 1,
    background: done ? `rgba(15,98,254,0.06)` : C.card,
    border: `1px solid ${color}28`,
    borderTop: `2px solid ${color}`,
    padding: '22px 20px',
  }}>
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontFamily: FONT.mono, fontSize: '10px',
        color: C.muted, letterSpacing: '1px',
        marginBottom: '4px',
      }}>
        {String(index).padStart(2, '0')} {done ? '— CONCLUÍDO' : '— PLANEJADO'}
      </div>
      <div style={{
        fontFamily: FONT.display,
        fontWeight: 700,
        fontSize: '22px',
        color, letterSpacing: '1px',
      }}>
        {phase}
      </div>
    </div>
    {items.map((item, i) => (
      <div key={i} style={{
        fontFamily: FONT.body, fontSize: '13px',
        color: C.dim,
        marginBottom: '8px',
        paddingLeft: '10px',
        borderLeft: `1px solid ${color}28`,
        lineHeight: 1.45,
      }}>
        {item}
      </div>
    ))}
  </div>
)

// ─── Footer template + progress bar ────────────────────────────────────────────
const Template = ({ slideNumber, numberOfSlides }) => (
  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
    {/* Progress bar */}
    <div style={{ height: '2px', background: 'rgba(57,57,57,0.6)', width: '100%' }}>
      <div style={{
        height: '100%',
        width: `${(slideNumber / numberOfSlides) * 100}%`,
        background: '#0f62fe',
        transition: 'width 0.3s ease',
      }} />
    </div>

    {/* Footer row */}
    <FlexBox
      justifyContent="space-between"
      alignItems="center"
      style={{ padding: '6px 48px 12px' }}
    >
    <div style={{
      fontFamily: FONT.mono, fontSize: '10px',
      color: 'rgba(244,244,244,0.18)', letterSpacing: '2px',
    }}>
      HARVESTSHIELD
    </div>
    <div style={{
      fontFamily: FONT.mono, fontSize: '10px',
      color: 'rgba(244,244,244,0.18)',
    }}>
      {slideNumber} / {numberOfSlides}
    </div>
  </FlexBox>
  </div>
)

// ─── IBM Carbon — logo mark (3D cube) ──────────────────────────────────────────
const IBMCubeMark = () => (
  <div style={{
    width: '24px', height: '24px',
    background: C.blue,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L1 4.5v7L8 15l7-3.5v-7L8 1zm0 1.5l5.5 2.75L8 8 2.5 5.25 8 2.5zM2 6.35l5.5 2.75v5.5L2 11.85V6.35zm7 8.25v-5.5l5.5-2.75v5.5L9 14.6z" fill="white"/>
    </svg>
  </div>
)

// ─── Presentation ───────────────────────────────────────────────────────────────
export default function Presentation() {
  return (
    <Deck theme={theme} template={Template}>

      {/* ── COVER ─────────────────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.dots}
        backgroundSize="32px 32px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" alignItems="center" style={{ padding: '0 80px' }}>
          <div style={{ flex: 1 }}>
            {/* IBM Carbon product header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
              <IBMCubeMark />
              <div style={{
                fontFamily: FONT.body, fontSize: '13px',
                color: C.dim, fontWeight: 400,
              }}>
                Alcoran Blockchain Solutions · inovaBra Bradesco 2026
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: '96px',
                color: C.text,
                lineHeight: 0.9,
                letterSpacing: '-1px',
              }}>
                HARVEST
              </div>
              <div
                className="shimmer-text"
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 700,
                  fontSize: '96px',
                  lineHeight: 0.9,
                  letterSpacing: '-1px',
                  display: 'block',
                }}
              >
                <span style={{ color: C.green }}>SHIELD</span>
              </div>
            </div>

            <Rule width="48px" />

            <div style={{
              fontFamily: FONT.body,
              fontSize: '18px',
              color: C.dim,
              lineHeight: 1.7,
              maxWidth: '480px',
              marginBottom: '32px',
            }}>
              Piloto técnico de validação climática para{' '}
              <span style={{ color: C.text, fontWeight: 600 }}>automação de seguros paramétricos agrícolas</span>{' '}
              — dados verificados, imutáveis, auditáveis.
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['IoT — ESP32', 'Blockchain Stellar', 'Seguro Paramétrico'].map(t => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>

          {/* Right column — Agenda */}
          <div style={{
            width: '280px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderTop: `2px solid ${C.blue}`,
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${C.border}`,
              fontFamily: FONT.mono, fontSize: '10px',
              color: C.muted, letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              Agenda
            </div>
            {[
              { n: '01', label: 'O problema do banco',        time: '1 min' },
              { n: '02', label: 'Tamanho do mercado',          time: '30s' },
              { n: '03', label: 'Falhas do processo atual',      time: '1 min' },
              { n: '04', label: 'Nossa solução',               time: '1 min' },
              { n: '05', label: 'Demo ao vivo',                time: '1:30' },
              { n: '06', label: 'Arquitetura de segurança',    time: '30s' },
              { n: '07', label: 'Modelo de negócio',           time: '1 min' },
              { n: '08', label: 'Piloto de 90 dias',            time: '30s' },
              { n: '09', label: 'O que pedimos ao Bradesco',   time: '1 min' },
              { n: '10', label: 'Call to action',              time: '30s' },
            ].map(({ n, label, time }) => (
              <div key={n} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px',
                borderBottom: `1px solid ${C.border}`,
              }}>
                <span style={{
                  fontFamily: FONT.mono, fontSize: '10px',
                  color: C.blue, minWidth: '20px',
                  letterSpacing: '0.5px',
                }}>
                  {n}
                </span>
                <span style={{
                  fontFamily: FONT.body, fontSize: '12px',
                  color: C.dim, flex: 1, lineHeight: 1.3,
                }}>
                  {label}
                </span>
                <span style={{
                  fontFamily: FONT.mono, fontSize: '10px',
                  color: C.muted, flexShrink: 0,
                }}>
                  {time}
                </span>
              </div>
            ))}
          </div>
        </FlexBox>
        <Notes>
          Pausa de 3 segundos antes de falar. Não comece com tecnologia — comece com o problema do banco.
        </Notes>
      </Slide>

      {/* ── SLIDE 1: PROBLEMA ─────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.grid}
        backgroundSize="48px 48px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label color={C.red}>O problema do banco</Label>

          <div style={{ marginBottom: '8px' }}>
            <div style={{
              fontFamily: FONT.mono, fontSize: '14px',
              color: C.muted, letterSpacing: '3px', marginBottom: '4px',
            }}>
              R$
            </div>
            <div style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: '132px',
              color: C.red,
              lineHeight: 0.85,
              letterSpacing: '-2px',
            }}>
              16 BI
            </div>
            <div style={{
              fontFamily: FONT.body,
              fontSize: '20px',
              color: C.dim,
              marginTop: '12px',
              fontWeight: 300,
            }}>
              pagos em sinistros agrícolas em 2023
            </div>
          </div>

          <Rule color={C.red} width="40px" />

          <Appear>
            <div style={{
              display: 'flex', gap: '12px', maxWidth: '720px',
            }}>
              <div style={{
                flex: 1,
                background: 'rgba(250,77,86,0.06)',
                border: '1px solid rgba(250,77,86,0.2)',
                borderLeft: '3px solid rgba(250,77,86,0.7)',
                padding: '16px 20px',
              }}>
                <div style={{
                  fontFamily: FONT.mono, fontSize: '10px',
                  color: 'rgba(250,77,86,0.55)', letterSpacing: '1.5px',
                  marginBottom: '6px',
                }}>PROCESSO ATUAL</div>
                <div style={{
                  fontFamily: FONT.display, fontWeight: 700,
                  fontSize: '40px', color: C.red, lineHeight: 1,
                }}>30–90 dias</div>
                <div style={{
                  fontFamily: FONT.body, fontSize: '13px',
                  color: C.dim, marginTop: '4px',
                }}>média para liquidação de sinistro</div>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(250,77,86,0.06)',
                border: '1px solid rgba(250,77,86,0.2)',
                borderLeft: '3px solid rgba(250,77,86,0.7)',
                padding: '16px 20px',
              }}>
                <div style={{
                  fontFamily: FONT.mono, fontSize: '10px',
                  color: 'rgba(250,77,86,0.55)', letterSpacing: '1.5px',
                  marginBottom: '6px',
                }}>CUSTO POR EVENTO</div>
                <div style={{
                  fontFamily: FONT.display, fontWeight: 700,
                  fontSize: '40px', color: C.red, lineHeight: 1,
                }}>R$ 2.500</div>
                <div style={{
                  fontFamily: FONT.body, fontSize: '13px',
                  color: C.dim, marginTop: '4px',
                }}>vistoria, laudo, análise, reconciliação</div>
              </div>
            </div>
          </Appear>
        </FlexBox>
        <Notes>
          PAUSA de 3 segundos após R$ 16 BI. Deixe o número impactar. Então: "Todo esse volume processado manualmente, de forma lenta e subjetiva. Há uma forma melhor."
        </Notes>
      </Slide>

      {/* ── SLIDE 2: MERCADO ──────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.dots}
        backgroundSize="32px 32px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Dimensão do mercado</Label>
          <div style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: '44px',
            color: C.text,
            letterSpacing: '-0.5px',
            marginBottom: '36px',
            lineHeight: 1.15,
          }}>
            O agro cresce.{' '}
            <span style={{ color: C.blue }}>O dado não acompanha.</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
            <Appear>
              <StatCard value="27%" label="do PIB brasileiro é agronegócio" accent={C.blue} />
            </Appear>
            <Appear>
              <StatCard value="+180%" label="crescimento do seguro rural nos últimos 5 anos" accent={C.blueLt} />
            </Appear>
            <Appear>
              <StatCard value="900 km²" label="cobertos por apenas 1 estação meteorológica" accent={C.muted} />
            </Appear>
          </div>
        </FlexBox>
        <Notes>
          Revele um número por vez. Enfatize: mercado cresce, infraestrutura de dados é precária.
        </Notes>
      </Slide>

      {/* ── SLIDE 3: FRAUDE HOJE ──────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.grid}
        backgroundSize="48px 48px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label color={C.red}>Por que o modelo tradicional falha</Label>
          <div style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: '44px',
            color: C.text,
            letterSpacing: '-0.5px',
            marginBottom: '28px',
          }}>
            Três falhas estruturais
          </div>
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

      {/* ── SLIDE 4: SOLUÇÃO ──────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.dots}
        backgroundSize="32px 32px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Nossa solução</Label>
          <div style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: '44px',
            color: C.text,
            letterSpacing: '-0.5px',
            marginBottom: '6px',
          }}>
            Dado coletado.{' '}
            <span style={{ color: C.blue }}>Assinado. Imutável.</span>
          </div>
          <div style={{
            fontFamily: FONT.body, fontSize: '16px', color: C.dim,
            marginBottom: '32px',
          }}>
            Verificável por qualquer auditor, em qualquer momento, sem intermediários.
          </div>

          {/* IBM Carbon — process flow */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: C.surface,
            border: `1px solid ${C.border}`,
            padding: '20px 24px',
            gap: 0,
            marginBottom: '10px',
          }}>
            <FlowNode label="ESP32" sub="Sensor IoT" />
            <Arrow />
            <FlowNode label="ORACLE" sub="ECDSA + PoW" highlighted />
            <Arrow />
            <FlowNode label="DATABASE" sub="PostgreSQL" />
            <Arrow />
            <FlowNode label="STELLAR" sub="Blockchain" />
            <Arrow />
            <div style={{
              background: `rgba(15,98,254,0.12)`,
              border: `1.5px solid ${C.blue}`,
              padding: '16px 14px',
              textAlign: 'center',
              minWidth: '110px',
            }}>
              <div style={{
                fontFamily: FONT.mono, fontSize: '11px',
                color: C.blue, fontWeight: 500, letterSpacing: '1px',
              }}>
                BRADESCO
              </div>
              <div style={{
                fontFamily: FONT.body, fontSize: '11px',
                color: C.muted, marginTop: '4px',
              }}>
                API verificada
              </div>
            </div>
          </div>

          {/* Camada 2 — Validação cruzada */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(38,38,38,0.6)',
            border: `1px solid ${C.border}`,
            borderTop: 'none',
            padding: '10px 24px',
            marginBottom: '10px',
          }}>
            <div style={{
              fontFamily: FONT.mono, fontSize: '10px',
              color: C.muted, letterSpacing: '1.5px', minWidth: '120px',
            }}>
              VALIDAÇÃO CRUZADA
            </div>
            {['INMET', 'CPTEC/INPE', 'NOAA', 'Sentinel / ESA'].map((src, i) => (
              <div key={i} style={{
                fontFamily: FONT.mono, fontSize: '10px',
                color: C.blueLt, border: `1px solid rgba(69,137,255,0.2)`,
                padding: '3px 8px', letterSpacing: '0.5px',
              }}>
                {src}
              </div>
            ))}
            <div style={{
              fontFamily: FONT.body, fontSize: '11px',
              color: C.muted, marginLeft: '8px',
            }}>
              R² {'>'} 0,85
            </div>
          </div>

          <Appear>
            <div style={{
              background: `rgba(15,98,254,0.06)`,
              border: `1px solid rgba(15,98,254,0.18)`,
              padding: '12px 18px',
            }}>
              <div style={{
                fontFamily: FONT.body, fontSize: '14px',
                color: C.blueLt, fontStyle: 'italic',
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

      {/* ── SLIDE 5: DEMO ─────────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.grid}
        backgroundSize="48px 48px"
        backgroundRepeat="repeat"
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 16px 24px',
        }}>
          {/* IBM Carbon — topbar style demo header */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderBottom: 'none',
            padding: '8px 16px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="live-dot" />
              <span style={{
                fontFamily: FONT.mono, fontSize: '11px',
                color: C.red, letterSpacing: '2px', textTransform: 'uppercase',
              }}>
                Demonstração ao vivo
              </span>
            </div>
            <a
              href={DASHBOARD_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                background: C.blue,
                color: '#fff',
                padding: '4px 14px',
                fontFamily: FONT.mono,
                fontSize: '10px',
                letterSpacing: '1px',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              ABRIR ↗
            </a>
          </div>

          <div style={{
            flex: 1,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
            position: 'relative',
            minHeight: 0,
          }}>
            <iframe
              src={DASHBOARD_URL}
              title="HarvestShield Dashboard"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          </div>

          <div style={{
            fontFamily: FONT.mono, fontSize: '11px',
            color: C.muted, marginTop: '8px',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            Clicar em "Stellar OK" → Stellar Explorer — transação pública e permanente
          </div>
        </div>
        <Notes>
          Percurso: KPIs → ReadingFeed → clicar em TX confirmed → Stellar Explorer.
          Botão "ABRIR ↗" abre em nova aba para tela cheia.
        </Notes>
      </Slide>

      {/* ── SLIDE 6: SEGURANÇA ────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.dots}
        backgroundSize="32px 32px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Arquitetura de segurança</Label>
          <div style={{
            fontFamily: FONT.display, fontWeight: 700,
            fontSize: '44px', color: C.text,
            letterSpacing: '-0.5px', marginBottom: '32px',
          }}>
            Três camadas independentes
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
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
              marginTop: '18px',
              background: `rgba(15,98,254,0.06)`,
              border: `1px solid rgba(15,98,254,0.18)`,
              padding: '12px 20px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: FONT.body, fontSize: '14px',
                color: C.blueLt, fontStyle: 'italic',
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

      {/* ── SLIDE 7: MODELO DE NEGÓCIO ────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.grid}
        backgroundSize="48px 48px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Modelo de negócio</Label>
          <div style={{
            fontFamily: FONT.display, fontWeight: 700,
            fontSize: '44px', color: C.text,
            letterSpacing: '-0.5px', marginBottom: '32px',
          }}>
            Três fontes de receita
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
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
              marginTop: '18px',
              display: 'flex', gap: '0',
              border: `1px solid ${C.border}`,
              overflow: 'hidden',
            }}>
              {[
                { label: 'Liquidação do sinistro', before: '30–90 dias', after: '< 72h' },
                { label: 'Custo por evento', before: 'R$ 800–2.500', after: 'R$ 50–150' },
                { label: 'Contestação / disputa', before: '15–30%', after: '< 2%' },
              ].map((row, i) => (
                <div key={i} style={{
                  flex: 1,
                  borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{
                    fontFamily: FONT.mono, fontSize: '10px',
                    color: C.muted, letterSpacing: '1px',
                    padding: '6px 12px',
                    borderBottom: `1px solid ${C.border}`,
                    background: C.surface,
                  }}>
                    {row.label}
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{
                      flex: 1, padding: '8px 12px',
                      borderRight: `1px solid ${C.border}`,
                    }}>
                      <div style={{
                        fontFamily: FONT.mono, fontSize: '9px',
                        color: C.muted, marginBottom: '2px',
                      }}>TRADICIONAL</div>
                      <div style={{
                        fontFamily: FONT.display, fontWeight: 700,
                        fontSize: '16px', color: C.red,
                      }}>{row.before}</div>
                    </div>
                    <div style={{ flex: 1, padding: '8px 12px' }}>
                      <div style={{
                        fontFamily: FONT.mono, fontSize: '9px',
                        color: C.muted, marginBottom: '2px',
                      }}>H-SHIELD</div>
                      <div style={{
                        fontFamily: FONT.display, fontWeight: 700,
                        fontSize: '16px', color: C.green,
                      }}>{row.after}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Appear>
        </FlexBox>
        <Notes>
          A terceira coluna é a relevante para essa banca.
          Mostre a tabela comparativa: "Automação não reduz cobertura — expande acesso a produtores menores."
        </Notes>
      </Slide>

      {/* ── SLIDE 8: PHASE 2 ──────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.dots}
        backgroundSize="32px 32px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Piloto técnico — 90 dias</Label>
          <div style={{
            fontFamily: FONT.display, fontWeight: 700,
            fontSize: '44px', color: C.text,
            letterSpacing: '-0.5px', marginBottom: '32px',
          }}>
            Experimental.{' '}
            <span style={{ color: C.blue }}>Sem risco para o Bradesco.</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
            <PhaseCol index={1} phase="DIAS 1–30" color={C.blue} done={false}
              items={[
                'Instalação de sensores em propriedades selecionadas',
                'Calibração e coleta contínua de umidade e precipitação',
                'Dashboard de monitoramento em tempo real',
                'Uptime de sensores > 95%',
              ]}
            />
            <PhaseCol index={2} phase="DIAS 31–60" color={C.blueLt}
              items={[
                'Workshop técnico com áreas do Bradesco',
                'Definição: cultura, região, janela crítica',
                'Limiar de excesso hídrico parametrizável',
                'Entregável: documento de parâmetros validados',
              ]}
            />
            <PhaseCol index={3} phase="DIAS 61–90" color={C.muted}
              items={[
                'Simulação retroativa com eventos históricos (opcional, NDA)',
                'Teste do modelo com enchentes de 2024 no RS',
                'Relatório de aderência e falsos positivos/negativos',
                'Correlação estatística: R² > 0,85',
              ]}
            />
          </div>
        </FlexBox>
        <Notes>
          Enfatize: escopo totalmente experimental — sem impacto contratual, sem obrigação futura.
          "O Bradesco define a cultura, a região e os parâmetros — a plataforma é neutra."
        </Notes>
      </Slide>

      {/* ── SLIDE 9: O QUE PEDIMOS ────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.grid}
        backgroundSize="48px 48px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" style={{ padding: '0 80px' }}>
          <Label>Proposta ao Bradesco</Label>
          <div style={{
            fontFamily: FONT.display, fontWeight: 700,
            fontSize: '44px', color: C.text,
            letterSpacing: '-0.5px', marginBottom: '32px',
          }}>
            Uma reunião.{' '}
            <span style={{ color: C.blue }}>Um piloto.</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
            {/* Piloto */}
            <div style={{
              flex: 1,
              background: `rgba(15,98,254,0.06)`,
              border: `1px solid rgba(15,98,254,0.2)`,
              borderTop: `2px solid ${C.blue}`,
              padding: '24px 22px',
            }}>
              <div style={{
                fontFamily: FONT.display, fontWeight: 700,
                fontSize: '24px', color: C.blue,
                letterSpacing: '0.5px', marginBottom: '4px',
              }}>
                Piloto técnico conjunto
              </div>
              <div style={{
                fontFamily: FONT.mono, fontSize: '11px',
                color: C.muted, marginBottom: '18px',
              }}>
                90 dias · escopo experimental
              </div>
              <Appear>
                <BulletRow>2–3 propriedades-piloto (regiões de alta exposição hídrica — Sul do RS)</BulletRow>
              </Appear>
              <Appear>
                <BulletRow>Bradesco define: cultura, região, limiar de excesso hídrico</BulletRow>
              </Appear>
              <Appear>
                <BulletRow>Workshop técnico conjunto para co-desenhar os parâmetros</BulletRow>
              </Appear>
            </div>

            {/* Governança */}
            <div style={{
              flex: 1,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderTop: `2px solid ${C.green}`,
              padding: '24px 22px',
            }}>
              <div style={{
                fontFamily: FONT.display, fontWeight: 700,
                fontSize: '24px', color: C.green,
                letterSpacing: '0.5px', marginBottom: '4px',
              }}>
                Sem risco para o banco
              </div>
              <div style={{
                fontFamily: FONT.mono, fontSize: '11px',
                color: C.muted, marginBottom: '18px',
              }}>
                Governança clara desde o início
              </div>
              <Appear>
                <BulletRow color={C.green}>Dados pertencem integralmente ao Bradesco</BulletRow>
              </Appear>
              <Appear>
                <BulletRow color={C.green}>Sem exclusividade e sem obrigação após os 90 dias</BulletRow>
              </Appear>
              <Appear>
                <BulletRow color={C.green}>Resultado: validação técnica para seguro paramétrico automatizado</BulletRow>
              </Appear>
            </div>
          </div>
        </FlexBox>
        <Notes>
          Fale devagar: "dois a três propriedades", "noventa dias".
          "Sem impacto contratual, sem exposição financeira para o Bradesco. Os dados pertencem a vocês."
        </Notes>
      </Slide>

      {/* ── SLIDE 10: CTA ─────────────────────────────────────────────────────── */}
      <Slide
        backgroundColor={C.bg}
        backgroundImage={BG.dots}
        backgroundSize="32px 32px"
        backgroundRepeat="repeat"
      >
        <FlexBox height="100%" flexDirection="column" justifyContent="center" alignItems="center">
          <Label style={{ textAlign: 'center' }}>Próximos passos</Label>

          <div style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: '88px',
            color: C.text,
            letterSpacing: '-1px',
            lineHeight: 0.9,
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            90 DIAS.<br />
            <span style={{ color: C.blue }}>SEM RISCO.</span><br />
            <span className="shimmer-text">DADO REAL.</span>
          </div>

          <Rule color={C.blue} width="48px" />

          <div style={{
            fontFamily: FONT.body, fontSize: '18px',
            color: C.dim, textAlign: 'center',
            maxWidth: '560px', lineHeight: 1.7,
            marginBottom: '36px',
          }}>
            Não pedimos para apostar em uma ideia.<br />
            O sistema{' '}
            <span style={{ color: C.text, fontWeight: 600 }}>funciona</span>
            {' '}— vocês acabaram de ver.<br />
            <span style={{ fontSize: '15px', color: C.muted }}>
              Próximo passo: reunião técnica conjunta para selecionar as propriedades-piloto.
            </span>
          </div>

          <div style={{
            background: C.blue,
            color: '#fff',
            padding: '14px 48px',
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: '22px',
            letterSpacing: '3px',
          }}>
            AGENDAMOS A REUNIÃO?
          </div>
        </FlexBox>
        <Notes>
          Fale devagar. Pausa após cada linha. Olhe para a banca ao dizer "funciona".
          Finalize com: "O próximo passo é simples — uma reunião técnica para selecionar as propriedades. Obrigado."
        </Notes>
      </Slide>

    </Deck>
  )
}
