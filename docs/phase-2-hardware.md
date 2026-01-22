# HarvestShield - Phase 2: Hardware e Comunicação de Campo

## Visão Geral

Este documento detalha os requisitos de hardware para a segunda fase do HarvestShield, focando em **pequenas propriedades rurais de 1 a 20 hectares**. Inclui comparativo de sensores, tecnologias wireless, recomendações por cultura, e análise detalhada de custos.

**Escopo:** 4-5 sensores básicos por dispositivo, comunicação LoRaWAN, foco em custo-benefício para pequenos produtores.

> **Nota:** Valores ajustados para realidade Brasil (impostos, frete, câmbio) com base em cotações de Jan/2026.

---

## 1. Sensores Agrícolas: Comparativo Completo

### 1.1 Sensores Básicos (Essenciais)

| # | Sensor | O que Mede | Tipo de Dado | Bytes | Preço (USD) | Precisão | Vida Útil Real |
|---|--------|------------|--------------|-------|-------------|----------|----------------|
| 1 | **Temperatura do Ar** | Temperatura ambiente (°C) | Int16 | 2 | $8 - $20 | ±0.3°C | 5+ anos |
| 2 | **Umidade do Ar** | Umidade relativa (%) | Int16 | 2 | $8 - $20 | ±2% RH | 5+ anos |
| 3 | **Umidade do Solo** | Teor volumétrico de água (%) | Int16 | 2 | $25 - $60 | ±3% | **2-3 anos** |
| 4 | **Temperatura do Solo** | Temperatura subsuperfície (°C) | Int16 | 2 | $15 - $35 | ±0.5°C | 3-5 anos |
| 5 | **Luminosidade (Lux)** | Intensidade luminosa (0-120k lux) | Int16 | 2 | $8 - $15 | ±10% | 5+ anos |

**Total básico: 10 bytes/leitura | $64 - $150 por kit**

> **Nota sobre Int16:** Valores com 2 casas decimais são multiplicados por 100 e armazenados como inteiro (ex: 25.73°C → 2573). Reduz payload pela metade.

### 1.2 Sensores Avançados (Opcionais)

| # | Sensor | O que Mede | Tipo de Dado | Bytes | Preço (USD) | Precisão | Vida Útil Real |
|---|--------|------------|--------------|-------|-------------|----------|----------------|
| 6 | **NPK (3-em-1)** | Nitrogênio, Fósforo, Potássio (mg/kg) | 3x Int16 | 6 | $80 - $250 | ±5% | **2-3 anos** |
| 7 | **pH do Solo** | Acidez/alcalinidade (0-14) | Int16 | 2 | $50 - $180 | ±0.1 pH | **1-2 anos** |
| 8 | **Condutividade (EC)** | Salinidade do solo (μS/cm) | Int16 | 2 | $50 - $180 | ±5% | 3-5 anos |
| 9 | **Pluviômetro** | Precipitação acumulada (mm) | Int16 | 2 | $30 - $100 | ±5% | 5+ anos |
| 10 | **Sensor de Vento** | Velocidade (m/s) + Direção (°) | 2x Int16 | 4 | $70 - $180 | ±3% | 3-5 anos |
| 11 | **Molhamento Foliar** | Presença de água nas folhas | Bool | 1 | $50 - $120 | ±5% | 3-5 anos |
| 12 | **Radiação PAR** | Radiação fotossintética (μmol/m²/s) | Int16 | 2 | $180 - $450 | ±5% | 5+ anos |

> **Atenção:** Sensores de solo (NPK, pH, umidade) degradam mais rápido em solos ácidos ou muito úmidos. Requerem calibração semestral.

### 1.3 Comparativo: Básico vs Avançado

| Critério | Kit Básico (5 sensores) | Kit Avançado (+NPK/pH/EC) |
|----------|-------------------------|---------------------------|
| **Custo** | $64 - $150 | $244 - $760 |
| **Bytes/leitura** | 10 bytes | 20 bytes |
| **Manutenção** | Anual | **Semestral (calibração)** |
| **Complexidade** | Simples | Moderada |
| **Aplicação** | Monitoramento geral, irrigação | Fertilização precisa, análise de solo |
| **ROI** | Rápido (1-2 safras) | Médio prazo (2-3 safras) |

**Recomendação para 1-20 ha:** Kit básico com 5 sensores é suficiente para maioria das culturas. Sensores NPK/pH são recomendados apenas para culturas de alto valor ou problemas específicos de solo.

---

## 2. Tecnologias de Comunicação Wireless

### 2.1 Comparativo Geral

| Tecnologia | Alcance Rural | Taxa Dados | Consumo | Custo Infra | Custo/Mês | Melhor Para |
|------------|---------------|------------|---------|-------------|-----------|-------------|
| **LoRaWAN** | 10-15 km | 0.3-50 kbps | Muito baixo | Gateway próprio | $0 | **Fazendas** |
| **Sigfox** | 10-50 km | 100 bps | Muito baixo | Rede operadora | $1-3/device | Áreas cobertas |
| **NB-IoT** | 1-10 km | 200 kbps | Médio | Rede celular | $6-60/device | Cobertura 4G |
| **WiFi** | 50-100 m | 100+ Mbps | Alto | Roteador | $0 | Estufas, galpões |
| **Zigbee Mesh** | 10-100 m/nó | 250 kbps | Baixo | Coordenador | $0 | Áreas densas |
| **Satélite IoT** | Global | Baixa | Médio | Antena | $30-100/device | Sem infraestrutura |

### 2.2 Análise Detalhada por Tecnologia

#### LoRaWAN (Recomendado)

| Característica | Valor |
|----------------|-------|
| Frequência | 915 MHz (Brasil - AU915) / 868 MHz (EU) |
| Alcance linha de vista | 15-20 km |
| Alcance com vegetação | 5-10 km |
| Payload máximo | 242 bytes |
| Vida bateria (6Ah, sem solar) | **3-4 meses** |
| Vida bateria (com solar 5W) | **Indefinida** |
| Licença de espectro | Não (ISM band) |
| Bidirecional | Sim |

**Vantagens:**
- Custo zero de conectividade (rede privada)
- Excelente alcance para agricultura
- Penetração razoável em vegetação
- Dispositivos acessíveis ($40-60 módulo)

**Desvantagens:**
- Requer gateway próprio ($300-800)
- Latência não garantida (best effort)
- Duty cycle limitado (1% na EU, mais flexível no Brasil)

#### Sigfox

| Característica | Valor |
|----------------|-------|
| Frequência | 902 MHz (Brasil) |
| Alcance rural | 10-50 km |
| Payload uplink | 12 bytes máx |
| Mensagens/dia | 140 uplink, 4 downlink |
| Custo | $1-3/device/mês |

**Vantagens:**
- Alcance extremo
- Nenhuma infraestrutura local

**Desvantagens:**
- Payload muito limitado (12 bytes) - **incompatível com assinatura ECDSA**
- Cobertura limitada no Brasil rural
- Comunicação quase unidirecional

#### NB-IoT / LTE-M

| Característica | NB-IoT | LTE-M |
|----------------|--------|-------|
| Frequência | Bandas LTE | Bandas LTE |
| Taxa dados | 200 kbps | 1 Mbps |
| Latência | 1-10 seg | 10-15 ms |
| Custo/mês (Brasil M2M) | $15-40 | $15-40 |

**Vantagens:**
- Usa infraestrutura celular existente
- Maior taxa de dados

**Desvantagens:**
- Depende de cobertura celular (ruim em áreas rurais remotas)
- Custo mensal por dispositivo
- Consumo maior que LoRa

### 2.3 Matriz de Decisão: Wireless

**Escala: 1 (ruim) a 5 (excelente)**

| Critério (Peso) | LoRaWAN | Sigfox | NB-IoT | WiFi |
|-----------------|---------|--------|--------|------|
| Alcance (25%) | 5 | 5 | 3 | 1 |
| Custo operacional (25%) | 5 | 3 | 2 | 5 |
| Consumo energia (20%) | 5 | 5 | 3 | 1 |
| Facilidade implantação (15%) | 4 | 5 | 5 | 3 |
| Capacidade dados (15%) | 4 | 1 | 4 | 5 |
| **Pontuação Final** | **4.6** | **3.8** | **3.2** | **2.8** |

**Conclusão:** LoRaWAN é a melhor opção para agricultura de 1-20 hectares, combinando custo zero de operação, excelente alcance e baixo consumo de energia.

---

## 3. Culturas e Sensores: Recomendações

### 3.1 Matriz de Match: Cultura x Sensores

**Escala: 1 (opcional) a 5 (crítico)**

| Cultura | Temp Ar | Umid Ar | Umid Solo | Temp Solo | Lux | NPK | pH | EC |
|---------|:-------:|:-------:|:---------:|:---------:|:---:|:---:|:--:|:--:|
| **Hortaliças** | 3 | 3 | 5 | 3 | 3 | 2 | 3 | 2 |
| **Café** | 4 | 5 | 5 | 3 | 4 | 2 | 3 | 1 |
| **Milho** | 3 | 2 | 5 | 4 | 2 | 4 | 2 | 1 |
| **Soja** | 3 | 2 | 4 | 3 | 2 | 2 | 3 | 1 |
| **Frutíferas** | 4 | 4 | 5 | 3 | 3 | 3 | 4 | 2 |
| **Cana** | 3 | 2 | 5 | 4 | 2 | 3 | 2 | 2 |
| **Pastagem** | 2 | 2 | 4 | 2 | 2 | 3 | 2 | 1 |

**Legenda:** 5 = Crítico | 4 = Muito importante | 3 = Importante | 2 = Útil | 1 = Opcional

### 3.2 Justificativas por Cultura

#### Hortaliças (alface, tomate, pepino)
| Sensor Prioritário | Justificativa |
|--------------------|---------------|
| **Umidade do Solo** | Irrigação precisa é crítica - hortaliças têm raízes superficiais e são sensíveis a estresse hídrico |
| **Temperatura do Ar** | Afeta diretamente o desenvolvimento; calor excessivo causa floração precoce em alface |
| **Umidade do Ar** | Alta umidade favorece doenças fúngicas; controle em estufas |
| **Luminosidade** | Importante para estufas com sombreamento controlado |

**Kit recomendado:** Básico (5 sensores) | Frequência: 15 min

#### Café
| Sensor Prioritário | Justificativa |
|--------------------|---------------|
| **Umidade do Ar** | Café é sensível a variações de umidade; afeta qualidade dos grãos |
| **Umidade do Solo** | Estresse hídrico controlado melhora concentração de açúcares no grão |
| **Temperatura do Ar** | Geadas destroem a produção; monitoramento é crítico em áreas de risco |
| **Luminosidade** | Café arábica prefere sombreamento parcial; excesso de sol queima folhas |

**Kit recomendado:** Básico + Molhamento foliar (prevenção de ferrugem) | Frequência: 15 min

#### Milho
| Sensor Prioritário | Justificativa |
|--------------------|---------------|
| **Umidade do Solo** | Fase de pendoamento é crítica - déficit hídrico reduz 50%+ da produção |
| **Temperatura do Solo** | Germinação requer solo > 10°C; afeta desenvolvimento radicular |
| **NPK** (se disponível) | Milho é exigente em nitrogênio; fertilização precisa aumenta produtividade |

**Kit recomendado:** Básico | Frequência: 30 min

#### Soja
| Sensor Prioritário | Justificativa |
|--------------------|---------------|
| **Umidade do Solo** | Enchimento de grãos é sensível a déficit hídrico |
| **Temperatura do Ar** | Floração afetada por temperaturas extremas |
| **pH** (se disponível) | Soja é sensível a alumínio tóxico em solos ácidos (pH < 5.5) |

**Kit recomendado:** Básico | Frequência: 30 min

#### Frutíferas (citros, uva, manga)
| Sensor Prioritário | Justificativa |
|--------------------|---------------|
| **Umidade do Solo** | Estresse hídrico controlado melhora qualidade dos frutos |
| **Umidade do Ar** | Alta umidade favorece podridões e doenças fúngicas |
| **Temperatura do Ar** | Frio é necessário para quebra de dormência em uvas e maçãs |
| **pH do Solo** | Citros são sensíveis a pH; ideal entre 6.0-7.0 |

**Kit recomendado:** Básico + pH | Frequência: 15 min

#### Cana-de-açúcar
| Sensor Prioritário | Justificativa |
|--------------------|---------------|
| **Umidade do Solo** | Irrigação por gotejamento requer monitoramento preciso |
| **Temperatura do Solo** | Afeta brotação da soqueira |
| **EC** (se disponível) | Cana tolera salinidade, mas excesso reduz produção |

**Kit recomendado:** Básico | Frequência: 30 min

#### Pastagem
| Sensor Prioritário | Justificativa |
|--------------------|---------------|
| **Umidade do Solo** | Determina capacidade de suporte e manejo de pastejo |
| **Temperatura do Ar** | Afeta crescimento - gramíneas tropicais param abaixo de 15°C |

**Kit recomendado:** Básico (mínimo) | Frequência: 60 min

---

## 4. Matriz de Decisão: Configuração por Tamanho

### 4.1 Fatores de Cobertura

| Fator | Impacto na Densidade |
|-------|---------------------|
| Terreno plano, cultura uniforme | 1 device / 2-4 ha |
| Terreno ondulado | 1 device / 1-2 ha |
| Múltiplas culturas | 1 device por zona distinta |
| Irrigação por pivô | 1 device no centro + 1-2 nas bordas |
| Alto valor por hectare (frutíferas) | 1 device / 0.5-1 ha |

### 4.2 Configuração Recomendada por Hectare

**Premissas:**
- Kit básico: 5 sensores (Temp Ar, Umid Ar, Umid Solo, Temp Solo, Lux)
- Comunicação: LoRaWAN
- Frequência de leitura: 15 minutos
- Terreno: levemente ondulado, vegetação média

| Tamanho | Devices | Cobertura | Justificativa |
|---------|---------|-----------|---------------|
| **1 ha** | 1-2 | 0.5-1 ha/device | Área pequena precisa de granularidade; 1 device cobre toda área, 2 para maior precisão |
| **4 ha** | 2-3 | 1.3-2 ha/device | Distribuição mínima para variabilidade |
| **5 ha** | 2-3 | 1.5-2.5 ha/device | Distribuição para captar variabilidade espacial |
| **10 ha** | 4-5 | 2-2.5 ha/device | Boa cobertura sem redundância excessiva |
| **15 ha** | 5-7 | 2-3 ha/device | Equilíbrio custo x cobertura |
| **20 ha** | 7-10 | 2-3 ha/device | Economia de escala começa a aparecer |

### 4.3 Justificativa da Densidade para 1 Hectare

**Por que 1-2 dispositivos para 1 hectare?**

1. **Variabilidade espacial:** Mesmo em 1 ha, pode haver diferenças significativas de:
   - Topografia (parte alta vs baixa acumula mais água)
   - Sombreamento (árvores, construções)
   - Tipo de solo (manchas de argila vs areia)

2. **Custo-benefício:**
   - 1 dispositivo ($200-250): Monitoramento básico, suficiente para culturas extensivas
   - 2 dispositivos ($400-500): Recomendado para hortaliças ou frutíferas de alto valor

3. **Redundância:** 2 dispositivos garantem continuidade se um falhar

4. **Alcance LoRa:** Mesmo 1 gateway cobre facilmente 1-20 ha com folga (alcance 5-15 km)

---

## 5. Volume de Dados: Cálculos Detalhados

### 5.1 Payload Otimizado por Leitura

| Componente | Bytes | Observação |
|------------|-------|------------|
| Device ID | 4 | UUID parcial |
| Timestamp | 4 | Unix timestamp |
| Temperatura Ar | 2 | Int16 (×100) |
| Umidade Ar | 2 | Int16 (×100) |
| Umidade Solo | 2 | Int16 (×100) |
| Temperatura Solo | 2 | Int16 (×100) |
| Luminosidade | 2 | Int16 |
| PoW Nonce | 4 | Prova de trabalho |
| ECDSA Signature (r) | 32 | Curva P-256, apenas r (recovery possível) |
| **Total Otimizado** | **54 bytes** | |

> **Otimização aplicada:**
> - Sensores como Int16 (2 bytes) em vez de Float (4 bytes)
> - Assinatura ECDSA truncada (32 bytes + recovery bit em vez de 64 bytes)
> - Hash PoW não enviado (verificador recalcula)

### 5.2 Volume por Tamanho de Propriedade

**Premissas:**
- Leitura a cada 15 min = 96 leituras/dia
- Payload: 54 bytes/leitura (otimizado)
- Overhead protocolar (LoRaWAN headers, ACKs): +30%
- Dados no banco expandem ~3x (JSON + índices)

| Hectares | Devices | Leituras/Dia | KB/Dia (wire) | MB/Mês (DB) | GB/Ano (DB) |
|----------|---------|--------------|---------------|-------------|-------------|
| **1 ha** | 2 | 192 | 13 KB | 1.2 MB | 14 MB |
| **4 ha** | 3 | 288 | 20 KB | 1.8 MB | 22 MB |
| **5 ha** | 3 | 288 | 20 KB | 1.8 MB | 22 MB |
| **10 ha** | 5 | 480 | 34 KB | 3.0 MB | 36 MB |
| **15 ha** | 6 | 576 | 40 KB | 3.6 MB | 44 MB |
| **20 ha** | 8 | 768 | 54 KB | 4.9 MB | 58 MB |

### 5.3 Volume por Frequência de Leitura

Para **10 hectares (5 devices)**:

| Frequência | Leituras/Dia | MB/Mês (DB) | Uso de Bateria | Recomendação |
|------------|--------------|-------------|----------------|--------------|
| 5 min | 1.440 | 9.0 MB | Alto | Irrigação de precisão |
| 10 min | 720 | 4.5 MB | Médio | Hortaliças |
| **15 min** | 480 | 3.0 MB | **Baixo** | **Uso geral** |
| 30 min | 240 | 1.5 MB | Muito baixo | Culturas extensivas |
| 60 min | 120 | 0.75 MB | Mínimo | Pastagem |

---

## 6. Custo Final: Análise Completa (Valores Brasil)

### 6.1 Custo de Produção por Dispositivo

| Componente | Preço (USD) | Fornecedor Típico | Notas |
|------------|-------------|-------------------|-------|
| ESP32 + LoRa (Heltec V3) | $40 - $55 | AliExpress + frete | Inclui impostos Brasil |
| Sensor Temp/Umid Ar (SHT31) | $12 - $18 | - | I2C, mais preciso que DHT22 |
| Sensor Umidade Solo (capacitivo) | $20 - $35 | - | Evitar resistivo (corrosão) |
| Sensor Temp Solo (DS18B20 IP68) | $10 - $18 | - | Encapsulado à prova d'água |
| Sensor Luminosidade (BH1750) | $6 - $10 | - | I2C, fácil integração |
| Bateria LiPo 6000mAh | $25 - $40 | - | Com proteção BMS |
| Painel Solar 5W | $20 - $35 | - | Policristalino, com suporte |
| Gabinete IP67 | $25 - $40 | - | ABS resistente a UV |
| Antena externa 915MHz | $8 - $15 | - | 3dBi mínimo, cabo 1m |
| PCB + conectores + cabos | $15 - $25 | - | Produção em lote (10+ un.) |
| Montagem + testes | $20 - $30 | - | Mão de obra técnica |
| **TOTAL por Device** | **$201 - $321** | | **Média: $240** |

### 6.2 Custo de Infraestrutura (Gateway)

| Item | Preço (USD) | Vida Útil | Notas |
|------|-------------|-----------|-------|
| Gateway LoRaWAN básico (Dragino LPS8N) | $250 - $350 | 5+ anos | Indoor, precisa de abrigo |
| Gateway LoRaWAN outdoor (RAK7268) | $400 - $550 | 5+ anos | IP67, mais robusto |
| Gateway LoRaWAN solar (RAK7289) | $600 - $900 | 5+ anos | Para áreas sem energia |
| Poste/suporte (3-6m) | $50 - $120 | 10+ anos | Galvanizado |
| Instalação + configuração | $100 - $200 | - | Mão de obra técnica |
| **TOTAL Gateway (típico)** | **$400 - $870** | | **Média: $550** |

### 6.3 Custo de Software e Cloud (Mensal)

| Serviço | Free Tier | Limite | Custo Pro | Notas |
|---------|-----------|--------|-----------|-------|
| **Supabase (DB + Edge)** | $0 | 500 MB DB, 2GB transfer | $25/mês | Free cobre até ~30 devices/6 meses |
| **Stellar Blockchain** | $0 (testnet) | Ilimitado | ~$0.01/1000 TX | Mainnet: ~$1-2/mês para 20 devices |
| **4G Backhaul (Brasil M2M)** | - | - | $35 - $50/mês | Planos IoT das operadoras |

### 6.4 Custo de Manutenção Anual

| Item | Custo/Device/Ano | Frequência | Notas |
|------|------------------|------------|-------|
| Calibração sensor solo | $10 | Semestral | Comparação com medição manual |
| Substituição sensor solo | $25 | A cada 2-3 anos | Degradação natural |
| Limpeza painel solar | $5 | Trimestral | Poeira reduz eficiência |
| Bateria reserva | $15 | A cada 2-3 anos | LiPo degrada |
| **TOTAL/device/ano** | **$20 - $35** | | **Média: $25** |

---

## 7. Cenários de Custo Detalhados

### 7.1 Cenário Individual por Tamanho (1 Cliente)

**Premissas:**
- 1 gateway por cliente (necessário para independência)
- Devices: densidade conforme tamanho
- 4G backhaul: $40/mês
- Manutenção: $25/device/ano

| Métrica | 1 ha | 4 ha | 5 ha | 10 ha | 15 ha | 20 ha |
|---------|------|------|------|-------|-------|-------|
| **Devices** | 2 | 3 | 3 | 5 | 6 | 8 |
| Custo devices | $480 | $720 | $720 | $1.200 | $1.440 | $1.920 |
| Gateway | $550 | $550 | $550 | $550 | $550 | $550 |
| Instalação | $150 | $200 | $200 | $300 | $350 | $400 |
| **CAPEX Total** | **$1.180** | **$1.470** | **$1.470** | **$2.050** | **$2.340** | **$2.870** |
| | | | | | | |
| Supabase/mês | $0 | $0 | $0 | $0 | $0 | $0 |
| Stellar/mês | $0.10 | $0.15 | $0.15 | $0.25 | $0.30 | $0.40 |
| 4G/mês | $40 | $40 | $40 | $40 | $40 | $40 |
| Manutenção/mês | $4 | $6 | $6 | $10 | $13 | $17 |
| **OPEX/mês** | **$44** | **$46** | **$46** | **$50** | **$53** | **$57** |
| | | | | | | |
| **OPEX/ano** | $528 | $552 | $552 | $600 | $636 | $684 |
| **Custo Ano 1** | **$1.708** | **$2.022** | **$2.022** | **$2.650** | **$2.976** | **$3.554** |
| **Custo/ha/mês (Ano 1)** | **$142** | **$42** | **$34** | **$22** | **$17** | **$15** |
| **Custo/ha/mês (Ano 2+)** | **$44** | **$12** | **$9** | **$5** | **$4** | **$3** |

---

### 7.2 Cenário Provedor: 3 Clientes Espalhados pelo Brasil

**Modelo de negócio:** HarvestShield operado por você como provedor de serviço para 3 clientes em diferentes regiões do Brasil.

**Clientes:**
- Cliente 1: 4 ha (ex: Minas Gerais)
- Cliente 2: 10 ha (ex: Goiás)
- Cliente 3: 15 ha (ex: Paraná)
- **Total sob gestão:** 29 ha

**Premissas:**
- Clientes em estados diferentes → cada um precisa de gateway próprio + chip 4G próprio
- Supabase compartilhado (multi-tenant) → 1 instância para todos
- Você (provedor) arca com todos os custos de infraestrutura

#### Investimento Total do Provedor (CAPEX)

| Item | Cliente 1 (4 ha) | Cliente 2 (10 ha) | Cliente 3 (15 ha) | **TOTAL** |
|------|------------------|-------------------|-------------------|-----------|
| Devices | 3 × $240 = $720 | 5 × $240 = $1.200 | 6 × $240 = $1.440 | **$3.360** |
| Gateway | $550 | $550 | $550 | **$1.650** |
| Instalação | $200 | $300 | $350 | **$850** |
| **Subtotal CAPEX** | **$1.470** | **$2.050** | **$2.340** | **$5.860** |

#### Custo Operacional Mensal do Provedor (OPEX)

| Item | Cliente 1 | Cliente 2 | Cliente 3 | **TOTAL/mês** |
|------|-----------|-----------|-----------|---------------|
| 4G Backhaul | $40 | $40 | $40 | **$120** |
| Manutenção devices | 3 × $2 = $6 | 5 × $2 = $10 | 6 × $2 = $12 | **$28** |
| Stellar (por cliente) | $0.15 | $0.25 | $0.30 | **$0.70** |
| Supabase (rateado) | - | - | - | **$0** (free tier) |
| **Subtotal OPEX/mês** | **$46** | **$50** | **$52** | **$148** |

#### Custo Acumulado do Provedor

| Métrica | Valor |
|---------|-------|
| **CAPEX Total (investimento inicial)** | **$5.860** |
| **OPEX/mês (custo recorrente)** | **$148** |
| **OPEX/ano** | **$1.776** |
| **Custo Total Ano 1** | **$7.636** |
| **Custo Total Ano 2** | **$1.776** (só OPEX) |
| **Custo Total Ano 3** | **$1.776** (só OPEX) |

#### Custo por Hectare (Visão do Provedor)

| Período | Custo Total | Hectares | Custo/ha/mês |
|---------|-------------|----------|--------------|
| **Ano 1** | $7.636 | 29 ha | **$21.95/ha/mês** |
| **Ano 2+** | $1.776/ano | 29 ha | **$5.10/ha/mês** |

#### Sugestão de Precificação (para ter lucro)

Para cobrir custos e ter margem:

| Estratégia | Preço Sugerido/ha/mês | Margem no Ano 1 | Margem Ano 2+ |
|------------|----------------------|-----------------|---------------|
| **Preço mínimo (break-even)** | $22/ha/mês | 0% | ~77% |
| **Preço com margem 30%** | $29/ha/mês | 30% | ~83% |
| **Preço premium** | $35/ha/mês | 60% | ~85% |

**Receita mensal com 3 clientes (29 ha) a $29/ha/mês:**
- Receita: 29 × $29 = **$841/mês**
- Custos: $148/mês (OPEX) + $488/mês (CAPEX amortizado em 12 meses)
- Lucro Ano 1: $841 - $636 = **$205/mês**
- Lucro Ano 2+: $841 - $148 = **$693/mês**

#### Resumo Financeiro do Provedor

| Métrica | 3 Clientes (29 ha) |
|---------|-------------------|
| **Investimento inicial (CAPEX)** | $5.860 |
| **Custo mensal (OPEX)** | $148 |
| **Custo/ha/mês (Ano 1)** | $21.95 |
| **Custo/ha/mês (Ano 2+)** | $5.10 |
| **Preço sugerido** | $25-35/ha/mês |
| **Payback** | 8-12 meses |

---

## 8. Plano de Manutenção

### 8.1 Cronograma de Manutenção

| Tarefa | Frequência | Responsável | Custo Estimado |
|--------|------------|-------------|----------------|
| Limpeza painel solar | Trimestral | Cliente | $0 (DIY) |
| Verificação visual dispositivos | Mensal | Cliente | $0 |
| Calibração sensor umidade solo | Semestral | Técnico | $10/device |
| Download e backup de dados | Mensal | Automático | $0 |
| Atualização de firmware | Conforme necessidade | Remoto (OTA) | $0 |
| Substituição bateria | A cada 2-3 anos | Técnico | $30/device |
| Substituição sensor solo | A cada 2-3 anos | Técnico | $35/device |

### 8.2 SLA de Uptime

| Métrica | Meta | Aceitável |
|---------|------|-----------|
| Disponibilidade do device | 99% | 95% |
| Perda de leituras | < 1% | < 5% |
| Latência gateway → cloud | < 30 seg | < 2 min |
| Tempo de recuperação (falha device) | 48h | 7 dias |

### 8.3 Contingências

| Problema | Solução | Tempo de Resposta |
|----------|---------|-------------------|
| Device offline | Verificação remota → visita técnica | 24-48h |
| Gateway offline | Reinício remoto → visita técnica | 4-24h |
| 4G sem sinal | Verificar operadora, considerar satélite | 24h |
| Sensor descalibrado | Comparação com medição manual, recalibração | 7 dias |
| Bateria baixa (alerta < 20%) | Visita para troca/verificação solar | 7 dias |

---

## 9. Resumo Executivo

### Configuração Recomendada (1-20 ha)

| Item | Especificação |
|------|---------------|
| **Sensores** | 5 básicos (Temp Ar, Umid Ar, Umid Solo, Temp Solo, Lux) |
| **Comunicação** | LoRaWAN (915 MHz Brasil - AU915) |
| **Frequência leitura** | 15 minutos |
| **Densidade** | 2-3 devices/ha (pequeno) a 0.4-0.5 device/ha (grande) |
| **Gateway** | 1 unidade por cliente (cobre até 10+ km em área rural) |
| **Alimentação** | Solar 5W + bateria 6Ah (autonomia contínua) |
| **Payload** | 54 bytes otimizado (Int16 + ECDSA truncada) |

### Investimento por Cenário (Cliente Individual)

| Cenário | CAPEX | OPEX/mês | Ano 1 | Custo/ha/mês (Ano 1) | Custo/ha/mês (Ano 2+) |
|---------|-------|----------|-------|---------------------|----------------------|
| 1 ha | $1.180 | $44 | $1.708 | $142 | $44 |
| 5 ha | $1.470 | $46 | $2.022 | $34 | $9 |
| 10 ha | $2.050 | $50 | $2.650 | $22 | $5 |
| 20 ha | $2.870 | $57 | $3.554 | $15 | $3 |

### Cenário Provedor (3 Clientes Espalhados - 29 ha)

| Métrica | Valor |
|---------|-------|
| **CAPEX Total** | $5.860 |
| **OPEX/mês** | $148 |
| **Custo/ha/mês (Ano 1)** | $21.95 |
| **Custo/ha/mês (Ano 2+)** | $5.10 |
| **Preço sugerido ao cliente** | $25-35/ha/mês |

### ROI Estimado (para o cliente final)

| Economia Potencial | % Redução | Valor/ha/ano* |
|--------------------|-----------|---------------|
| Irrigação (água + energia) | 15-25% | $50-150 |
| Defensivos (aplicação precisa) | 10-20% | $30-80 |
| Fertilizantes (dose certa) | 10-15% | $40-100 |
| Perdas por pragas/doenças | 5-10% | $20-60 |
| **TOTAL ECONOMIA** | | **$140-390/ha/ano** |

*Valores variam conforme cultura e região.

**Payback estimado:** 1-2 safras para propriedades > 5 ha.

---

## 10. Referências

### Sensores
- [CHOOVIO - Smart Agriculture Sensors](https://www.choovio.com/smart-agriculture-7-iot-sensors-for-crop-monitoring/)
- [TEKTELIC KIWI Agriculture Sensor](https://tektelic.com/products/sensors/kiwi-iot-agriculture-sensor/)
- [ATO.com - Soil Sensors](https://www.ato.com/soil-moisture-and-temperature-sensor)

### Comunicação LPWAN
- [TEKTELIC - LoRaWAN vs NB-IoT vs Sigfox](https://tektelic.com/expertise/lorawan-vs-nb-iot-sigfox-and-lte-comparison/)
- [DFRobot - LPWAN Comparison 2025](https://www.dfrobot.com/blog-17238.html)
- [LoRa Alliance - Regional Parameters](https://lora-alliance.org/resource_hub/rp2-1-0-3-lorawan-regional-parameters/)

### Gateways
- [RAKwireless - WisGate Edge](https://store.rakwireless.com/)
- [Dragino - LoRaWAN Gateways](https://www.dragino.com/)

### Agricultura de Precisão
- [Seeed Studio - LPWAN in Smart Agriculture](https://www.seeedstudio.com/blog/2021/05/05/iot-in-smart-agriculture-lpwan-technologies-applications/)
- [EMBRAPA - Agricultura de Precisão](https://www.embrapa.br/agricultura-de-precisao)

---

_Documento atualizado em 2026-01-22 | HarvestShield Phase 2 v2.2_
_Revisado com valores realistas Brasil, escala numérica e cenário multi-cliente distribuído_
