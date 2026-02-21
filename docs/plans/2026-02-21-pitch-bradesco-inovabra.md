# Pitch HarvestShield — inovaBra Bradesco

**Formato:** Apresentação ao vivo, 5–10 minutos
**Objetivo:** Parceria estratégica (crédito rural + seguro agrícola) + investimento seed para Phase 2
**Data:** 2026-02-21

---

## Estrutura Geral

| # | Slide | Tempo |
|---|-------|-------|
| 1 | O problema do banco | 1 min |
| 2 | Tamanho do mercado | 30s |
| 3 | Como a fraude acontece hoje | 1 min |
| 4 | Nossa solução | 1 min |
| 5 | Demo ao vivo | 1.5 min |
| 6 | Arquitetura de segurança | 30s |
| 7 | Modelo de negócio | 1 min |
| 8 | Phase 2: hardware físico | 30s |
| 9 | O que pedimos ao Bradesco | 1 min |
| 10 | Call to action | 30s |

---

## Roteiro Completo

### Slide 1 — O problema do banco
**Visual:** foto de campo + número grande

**Texto no slide:**
> "R$ 16 bilhões pagos em sinistros agrícolas em 2023. Quantos foram baseados em dados que podem ter sido manipulados?"

**Roteiro falado:**
Todo ano o setor bancário e segurador paga bilhões em sinistros de seguro rural. O problema não é o volume — é a confiança nos dados. Hoje, um produtor reporta seca, geada ou excesso de chuva. A seguradora manda um perito. O perito vai à fazenda dias depois. Não há dado contínuo, verificável e imutável do que realmente aconteceu no campo. Isso gera fraude, gera custo operacional alto, e gera inadimplência no crédito rural porque o risco não foi precificado com informação real.

---

### Slide 2 — Tamanho do mercado
**Visual:** 3 números grandes

**Texto no slide:**
- Agro = **27% do PIB brasileiro**
- Seguro rural cresceu **+180% em 5 anos**
- Déficit de estações meteorológicas: **1 para cada 900km²**

**Roteiro falado:**
O agronegócio é o maior setor da economia brasileira. O seguro rural cresce acelerando. E ainda assim, a densidade de monitoramento climático é absurdamente baixa. O dado existe, mas não chega a quem precisa — e quando chega, não é confiável.

---

### Slide 3 — Como a fraude acontece hoje
**Visual:** diagrama simples: produtor → perito → seguradora, com "gap de confiança" destacado

**Roteiro falado:**
O processo atual tem três problemas estruturais. Primeiro: os dados são coletados depois do evento, não durante. Segundo: não há cadeia de custódia — qualquer dado pode ser alterado no caminho. Terceiro: a perícia é cara, lenta e subjetiva. O Bradesco Seguros e o crédito rural do banco vivem com esse risco todos os dias.

---

### Slide 4 — Nossa solução
**Visual:** diagrama simples ESP32 → Supabase → Stellar → Bradesco

**Texto no slide:**
> "Dado coletado. Assinado. Imutável. Verificável por qualquer auditor."

**Roteiro falado:**
HarvestShield é um sistema de monitoramento agrícola onde cada leitura de sensor é criptograficamente assinada pelo dispositivo que a gerou e registrada em blockchain. Isso significa que nenhum dado pode ser alterado retroativamente — nem pelo produtor, nem pelo operador, nem por nós. A seguradora, o banco ou qualquer auditor pode verificar a autenticidade de qualquer leitura em segundos, apontando para uma transação pública na blockchain Stellar.

---

### Slide 5 — Demo ao vivo
**Visual:** dashboard aberto no notebook

**Roteiro falado:**
Deixa eu mostrar funcionando. Aqui está o dashboard em tempo real — cada card é uma leitura de um dispositivo ESP32. Temperatura, umidade do ar, umidade do solo, luminosidade. Cada leitura tem um status: pendente, confirmado ou falha. Vou clicar aqui em "confirmed" — esse link abre direto no Stellar Explorer, a blockchain pública. Você pode ver a transação, o hash dos dados, o timestamp. Isso não pode ser alterado. Nunca. Por ninguém.

---

### Slide 6 — Arquitetura de segurança
**Visual:** 3 camadas empilhadas

| Camada | O que faz |
|--------|-----------|
| **ECDSA P-256** | Cada dispositivo tem chave criptográfica única — dado falso de dispositivo não registrado é rejeitado |
| **Proof of Work** | Dificulta ataques em massa — cada envio exige custo computacional |
| **Blockchain Stellar** | Registro imutável e público — auditável por qualquer parte |

**Roteiro falado:**
Três camadas de segurança independentes. Mesmo que alguém invada o servidor, não consegue retroativamente alterar o que está na blockchain. É exatamente o nível de garantia que um contrato de seguro ou uma operação de crédito precisa.

---

### Slide 7 — Modelo de negócio
**Visual:** tabela de planos

| Segmento | Modelo | Ticket |
|----------|--------|--------|
| Pequeno produtor | SaaS por dispositivo | R$ 150/mês |
| Cooperativa | SaaS por frota de dispositivos | R$ 80/dispositivo/mês |
| Seguradora / Banco | API de verificação + dados históricos | Licença anual |

**Roteiro falado:**
Três fontes de receita. O produtor paga pelo monitoramento — ele ganha acesso a dados que reduzem o custo do seu seguro e facilitam acesso a crédito. A cooperativa paga pelo volume. E a seguradora ou banco paga pela API — acesso programático a dados verificados para automatizar subscrição de apólices e análise de sinistros. Para o Bradesco, essa terceira linha é a mais interessante: dados confiáveis que entram direto nos sistemas de crédito e seguro.

---

### Slide 8 — Phase 2: hardware físico
**Visual:** foto de sensor em campo + mapa de fazenda com pontos de cobertura

**Texto no slide:**
> "MVP validado em software. Phase 2: sensores físicos no campo, comunicação LoRaWAN, energia solar."

**Roteiro falado:**
O MVP que acabei de mostrar roda em simulação — o firmware C++ está pronto e validado. O próximo passo é hardware físico: sensores reais instalados nas fazendas, com comunicação LoRaWAN para áreas sem cobertura de celular e energia solar para operação autônoma. O investimento da aceleração vai direto para esse hardware e para os primeiros pilotos em campo.

---

### Slide 9 — O que pedimos ao Bradesco
**Visual:** dois blocos lado a lado

**Parceria**
- Piloto com 3 a 5 produtores da carteira de crédito rural do Bradesco
- Acesso ao time de Bradesco Seguros para co-desenhar integração de API
- Validação do caso de uso: automação de sinistros

**Investimento**
- Seed para produção do hardware do Phase 2
- Meta: 50 dispositivos físicos instalados em 6 meses
- Retorno esperado: contrato de API com o próprio Bradesco

**Roteiro falado:**
Pedimos duas coisas. Primeiro: acesso a produtores da carteira do banco para um piloto real — sem isso, ficamos em simulação para sempre. Segundo: capital seed para produzir o hardware do Phase 2. O retorno natural desse investimento é o próprio Bradesco sendo o primeiro cliente da API de verificação de dados — reduzindo custo operacional de sinistros e tendo diferencial competitivo em crédito rural baseado em dados verificáveis.

---

### Slide 10 — Call to action
**Visual:** minimalista — logo + contato + QR code do repositório/demo

**Texto no slide:**
> "Próximo passo: piloto com 3 fazendas da sua carteira. Dados reais. Blockchain real. Resultado em 90 dias."

**Roteiro falado:**
Não estamos pedindo pra vocês apostarem numa ideia. O sistema funciona — acabaram de ver. Estamos pedindo 90 dias, 3 fazendas da carteira do Bradesco, e a chance de provar que dados verificáveis em blockchain mudam a equação do risco agrícola para o banco. Obrigado.

---

## Dicas de apresentação

- **Slide 5 (demo):** ensaie a abertura do dashboard e o clique no Stellar Explorer antes da apresentação. Ter um vídeo de backup caso a internet falhe.
- **Slide 1:** pausa de 3 segundos depois da pergunta retórica antes de continuar falando.
- **Slide 9:** diga os números devagar — "três fazendas", "noventa dias". São os únicos números que a banca vai lembrar.
- **Perguntas difíceis esperadas:**
  - *"Por que Stellar e não outra blockchain?"* → custo de transação próximo de zero, finalidade em 5 segundos, usado por instituições financeiras globais.
  - *"Sem tração, como sabemos que produtores vão pagar?"* → o piloto com a carteira do Bradesco é exatamente para validar isso com custo zero para vocês.
  - *"Quanto você precisa?"* → tenha o número do Phase 2 hardware em mente (ver `docs/phase-2-hardware.md`).

---

_Gerado em: 2026-02-21_
