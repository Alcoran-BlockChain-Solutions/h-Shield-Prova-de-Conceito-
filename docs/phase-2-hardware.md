# HarvestShield - Phase 2: Hardware e Comunicação de Campo

## Visão Geral

Este documento detalha os requisitos de hardware para a segunda fase do HarvestShield, focando em **pequenas propriedades rurais de 1 a 20 hectares**. Inclui comparativo de sensores, tecnologias wireless, recomendações por cultura, e análise detalhada de custos.

**Escopo:** 4-5 sensores básicos por dispositivo, comunicação LoRaWAN, foco em custo-benefício para pequenos produtores.

---

## 1. Sensores Agrícolas: Comparativo Completo

### 1.1 Sensores Básicos (Essenciais)

| # | Sensor | O que Mede | Tipo de Dado | Bytes | Preço (USD) | Precisão | Vida Útil |
|---|--------|------------|--------------|-------|-------------|----------|-----------|
| 1 | **Temperatura do Ar** | Temperatura ambiente (°C) | Float | 4 | $5 - $15 | ±0.3°C | 5+ anos |
| 2 | **Umidade do Ar** | Umidade relativa (%) | Float | 4 | $5 - $15 | ±2% RH | 5+ anos |
| 3 | **Umidade do Solo** | Teor volumétrico de água (%) | Float | 4 | $10 - $50 | ±3% | 3-5 anos |
| 4 | **Temperatura do Solo** | Temperatura subsuperfície (°C) | Float | 4 | $10 - $30 | ±0.5°C | 5+ anos |
| 5 | **Luminosidade (Lux)** | Intensidade luminosa (0-120k lux) | Int | 4 | $5 - $20 | ±10% | 5+ anos |

**Total básico: 20 bytes/leitura | $35 - $130 por kit**

### 1.2 Sensores Avançados (Opcionais)

| # | Sensor | O que Mede | Tipo de Dado | Bytes | Preço (USD) | Precisão | Vida Útil |
|---|--------|------------|--------------|-------|-------------|----------|-----------|
| 6 | **NPK (3-em-1)** | Nitrogênio, Fósforo, Potássio (mg/kg) | 3x Int | 6 | $50 - $200 | ±5% | 2-3 anos |
| 7 | **pH do Solo** | Acidez/alcalinidade (0-14) | Float | 4 | $30 - $150 | ±0.1 pH | 2-3 anos |
| 8 | **Condutividade (EC)** | Salinidade do solo (μS/cm) | Float | 4 | $30 - $150 | ±5% | 3-5 anos |
| 9 | **Pluviômetro** | Precipitação acumulada (mm) | Float | 4 | $20 - $80 | ±5% | 5+ anos |
| 10 | **Sensor de Vento** | Velocidade (m/s) + Direção (°) | 2x Float | 8 | $50 - $150 | ±3% | 3-5 anos |
| 11 | **Molhamento Foliar** | Presença de água nas folhas | Bool | 1 | $40 - $100 | ±5% | 3-5 anos |
| 12 | **Radiação PAR** | Radiação fotossintética (μmol/m²/s) | Float | 4 | $150 - $400 | ±5% | 5+ anos |

### 1.3 Comparativo: Básico vs Avançado

| Critério | Kit Básico (5 sensores) | Kit Avançado (+NPK/pH/EC) |
|----------|-------------------------|---------------------------|
| **Custo** | $35 - $130 | $145 - $630 |
| **Bytes/leitura** | 20 bytes | 34 bytes |
| **Manutenção** | Baixa (anual) | Média (calibração semestral) |
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
| Frequência | 915 MHz (Brasil) / 868 MHz (EU) |
| Alcance linha de vista | 15-20 km |
| Alcance com vegetação | 5-10 km |
| Payload máximo | 242 bytes |
| Vida bateria (AA) | 5-10 anos |
| Licença de espectro | Não (ISM band) |
| Bidirecional | Sim |

**Vantagens:**
- Custo zero de conectividade (rede privada)
- Excelente alcance para agricultura
- Penetração razoável em vegetação
- Dispositivos baratos ($15-30)

**Desvantagens:**
- Requer gateway próprio ($200-800)
- Latência não garantida (best effort)

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
- Payload muito limitado (12 bytes)
- Cobertura limitada no Brasil
- Comunicação quase unidirecional

#### NB-IoT / LTE-M

| Característica | NB-IoT | LTE-M |
|----------------|--------|-------|
| Frequência | Bandas LTE | Bandas LTE |
| Taxa dados | 200 kbps | 1 Mbps |
| Latência | 1-10 seg | 10-15 ms |
| Custo/mês | $6-20 | $5-15 |

**Vantagens:**
- Usa infraestrutura celular existente
- Maior taxa de dados

**Desvantagens:**
- Depende de cobertura celular
- Custo mensal por dispositivo
- Consumo maior que LoRa

### 2.3 Matriz de Decisão: Wireless

| Critério (Peso) | LoRaWAN | Sigfox | NB-IoT | WiFi |
|-----------------|---------|--------|--------|------|
| Alcance (25%) | ★★★★★ | ★★★★★ | ★★★☆☆ | ★☆☆☆☆ |
| Custo operacional (25%) | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | ★★★★★ |
| Consumo energia (20%) | ★★★★★ | ★★★★★ | ★★★☆☆ | ★☆☆☆☆ |
| Facilidade implantação (15%) | ★★★★☆ | ★★★★★ | ★★★★★ | ★★★☆☆ |
| Capacidade dados (15%) | ★★★★☆ | ★☆☆☆☆ | ★★★★☆ | ★★★★★ |
| **Pontuação Final** | **4.6** | **3.8** | **3.2** | **2.8** |

**Conclusão:** LoRaWAN é a melhor opção para agricultura de 1-20 hectares, combinando custo zero de operação, excelente alcance e baixo consumo de energia.

---

## 3. Culturas e Sensores: Recomendações

### 3.1 Matriz de Match: Cultura x Sensores

| Cultura | Temp Ar | Umid Ar | Umid Solo | Temp Solo | Lux | NPK | pH | EC |
|---------|:-------:|:-------:|:---------:|:---------:|:---:|:---:|:--:|:--:|
| **Hortaliças** | ★★★ | ★★★ | ★★★★★ | ★★★ | ★★★ | ★★ | ★★★ | ★★ |
| **Café** | ★★★★ | ★★★★★ | ★★★★★ | ★★★ | ★★★★ | ★★ | ★★★ | ★ |
| **Milho** | ★★★ | ★★ | ★★★★★ | ★★★★ | ★★ | ★★★★ | ★★ | ★ |
| **Soja** | ★★★ | ★★ | ★★★★ | ★★★ | ★★ | ★★ | ★★★ | ★ |
| **Frutíferas** | ★★★★ | ★★★★ | ★★★★★ | ★★★ | ★★★ | ★★★ | ★★★★ | ★★ |
| **Cana** | ★★★ | ★★ | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★ | ★★ |
| **Pastagem** | ★★ | ★★ | ★★★★ | ★★ | ★★ | ★★★ | ★★ | ★ |

★★★★★ = Crítico | ★★★★ = Muito importante | ★★★ = Importante | ★★ = Útil | ★ = Opcional

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
| **5 ha** | 2-3 | 1.5-2.5 ha/device | Distribuição para captar variabilidade espacial |
| **10 ha** | 3-5 | 2-3 ha/device | Boa cobertura sem redundância excessiva |
| **20 ha** | 5-10 | 2-4 ha/device | Economia de escala começa a aparecer |

### 4.3 Justificativa da Densidade para 1 Hectare

**Por que 1-2 dispositivos para 1 hectare?**

1. **Variabilidade espacial:** Mesmo em 1 ha, pode haver diferenças significativas de:
   - Topografia (parte alta vs baixa acumula mais água)
   - Sombreamento (árvores, construções)
   - Tipo de solo (manchas de argila vs areia)

2. **Custo-benefício:**
   - 1 dispositivo ($150-200): Monitoramento básico, suficiente para culturas extensivas
   - 2 dispositivos ($300-400): Recomendado para hortaliças ou frutíferas de alto valor

3. **Redundância:** 2 dispositivos garantem continuidade se um falhar

4. **Alcance LoRa:** Mesmo 1 gateway barato cobre facilmente 1-20 ha com folga

---

## 5. Volume de Dados: Cálculos Detalhados

### 5.1 Payload por Leitura

| Componente | Bytes |
|------------|-------|
| Device ID | 4 |
| Timestamp | 4 |
| Temperatura Ar | 4 |
| Umidade Ar | 4 |
| Umidade Solo | 4 |
| Temperatura Solo | 4 |
| Luminosidade | 4 |
| PoW Nonce | 4 |
| PoW Hash | 32 |
| ECDSA Signature | 64 |
| **Total** | **128 bytes** |

*Nota: Payload otimizado pode reduzir para ~80 bytes removendo hash completo*

### 5.2 Volume por Tamanho de Propriedade

**Premissas:**
- Leitura a cada 15 min = 96 leituras/dia
- Payload: 128 bytes/leitura
- Densidade: 2 devices/ha (média)
- Overhead protocolar (headers, ACKs): +20%

| Hectares | Devices | Leituras/Dia | KB/Dia | MB/Mês | GB/Ano |
|----------|---------|--------------|--------|--------|--------|
| **1 ha** | 2 | 192 | 29 KB | 0.87 MB | 10.5 MB |
| **5 ha** | 5 | 480 | 74 KB | 2.2 MB | 26 MB |
| **10 ha** | 8 | 768 | 118 KB | 3.5 MB | 42 MB |
| **20 ha** | 15 | 1.440 | 221 KB | 6.6 MB | 79 MB |
| **20+ ha** | 20+ | 1.920+ | 295 KB+ | 8.8 MB+ | 106 MB+ |

### 5.3 Volume por Frequência de Leitura

Para **10 hectares (8 devices)**:

| Frequência | Leituras/Dia | MB/Mês | Uso de Bateria | Recomendação |
|------------|--------------|--------|----------------|--------------|
| 5 min | 2.304 | 10.5 MB | Alto | Irrigação de precisão |
| 10 min | 1.152 | 5.3 MB | Médio | Hortaliças |
| **15 min** | 768 | 3.5 MB | **Baixo** | **Uso geral** |
| 30 min | 384 | 1.8 MB | Muito baixo | Culturas extensivas |
| 60 min | 192 | 0.9 MB | Mínimo | Pastagem |

---

## 6. Custo Final: Análise Completa

### 6.1 Custo de Produção por Dispositivo

| Componente | Preço Unitário (USD) | Notas |
|------------|---------------------|-------|
| ESP32 + LoRa (Heltec/TTGO) | $18 - $25 | Módulo integrado |
| Sensor Temp/Umid Ar (DHT22/SHT31) | $5 - $12 | SHT31 mais preciso |
| Sensor Umidade Solo (capacitivo) | $8 - $20 | Evitar resistivo (corrosão) |
| Sensor Temp Solo (DS18B20) | $3 - $8 | Encapsulado IP68 |
| Sensor Luminosidade (BH1750) | $3 - $6 | I2C, fácil integração |
| Bateria LiPo 6000mAh | $15 - $25 | Duração 6-12 meses |
| Painel Solar 5W | $12 - $20 | Autonomia contínua |
| Gabinete IP65 | $8 - $15 | Proteção intempéries |
| Antena externa 868/915MHz | $5 - $10 | Melhora alcance |
| PCB + conectores + cabos | $5 - $10 | Produção em lote |
| **TOTAL por Device** | **$82 - $151** | Média: **$115** |

### 6.2 Custo de Infraestrutura (Gateway)

| Item | Preço (USD) | Vida Útil | Notas |
|------|-------------|-----------|-------|
| Gateway LoRaWAN básico (Dragino) | $150 - $250 | 5+ anos | 1 gateway para até 20 ha |
| Gateway LoRaWAN solar (RAK) | $400 - $700 | 5+ anos | Para áreas sem energia |
| Poste/suporte (3m) | $30 - $80 | 10+ anos | Opcional |
| Instalação | $50 - $150 | - | Mão de obra local |
| **TOTAL Gateway** | **$230 - $1.180** | | Média: **$400** |

### 6.3 Custo de Software e Cloud (Mensal)

| Serviço | Free Tier | Limite | Custo Pro |
|---------|-----------|--------|-----------|
| **Supabase (DB + Edge)** | $0 | 500 MB DB, 2GB transfer | $25/mês |
| **Stellar Blockchain** | $0 (testnet) | Ilimitado | ~$0.01/1000 TX |
| **Backhaul 4G (chip)** | - | - | $10 - $30/mês |

### 6.4 Custo Mensal de Operação

| Item | 1 ha | 5 ha | 10 ha | 20 ha |
|------|------|------|-------|-------|
| Supabase | $0* | $0* | $0* | $0* |
| Stellar (mainnet) | $0.06 | $0.15 | $0.24 | $0.45 |
| 4G Gateway | $15 | $15 | $15 | $15 |
| Manutenção (estimado) | $2 | $5 | $8 | $15 |
| **TOTAL/mês** | **$17** | **$20** | **$23** | **$30** |

*Free tier suficiente para 1-20 ha

### 6.5 Custo Total: CAPEX + OPEX (Primeiro Ano)

| Métrica | 1 ha | 5 ha | 10 ha | 20 ha |
|---------|------|------|-------|-------|
| **Devices** | 2 | 5 | 8 | 15 |
| Custo devices | $230 | $575 | $920 | $1.725 |
| Gateway | $400 | $400 | $400 | $400 |
| **CAPEX Total** | **$630** | **$975** | **$1.320** | **$2.125** |
| OPEX (12 meses) | $204 | $240 | $276 | $360 |
| **Custo Ano 1** | **$834** | **$1.215** | **$1.596** | **$2.485** |
| **Custo/ha/mês** | **$69.50** | **$20.25** | **$13.30** | **$10.35** |

### 6.6 Economia de Escala

| Hectares | Custo/ha/mês (Ano 1) | Custo/ha/mês (Ano 2+) |
|----------|---------------------|----------------------|
| 1 ha | $69.50 | $17.00 |
| 5 ha | $20.25 | $4.00 |
| 10 ha | $13.30 | $2.30 |
| 20 ha | $10.35 | $1.50 |

**Conclusão:** A partir de 5 hectares, o custo por hectare cai significativamente devido ao rateio do gateway. No segundo ano em diante, apenas OPEX é considerado.

---

## 7. Resumo Executivo

### Configuração Recomendada (1-20 ha)

| Item | Especificação |
|------|---------------|
| **Sensores** | 5 básicos (Temp Ar, Umid Ar, Umid Solo, Temp Solo, Lux) |
| **Comunicação** | LoRaWAN (915 MHz Brasil) |
| **Frequência leitura** | 15 minutos |
| **Densidade** | 1-2 devices/ha (menor) a 0.5 device/ha (maior) |
| **Gateway** | 1 unidade (cobre até 10+ km) |
| **Alimentação** | Solar + bateria (autonomia infinita) |

### Investimento Típico

| Tamanho | Investimento Inicial | Custo Mensal | Payback* |
|---------|---------------------|--------------|----------|
| 1-5 ha | $600 - $1.000 | $17 - $20 | 1-2 safras |
| 5-10 ha | $1.000 - $1.500 | $20 - $25 | 1 safra |
| 10-20 ha | $1.500 - $2.500 | $25 - $35 | 1 safra |

*Payback estimado considerando economia de 10-15% em irrigação e insumos

---

## 8. Referências

### Sensores
- [CHOOVIO - Smart Agriculture Sensors](https://www.choovio.com/smart-agriculture-7-iot-sensors-for-crop-monitoring/)
- [TEKTELIC KIWI Agriculture Sensor](https://tektelic.com/products/sensors/kiwi-iot-agriculture-sensor/)
- [ATO.com - Soil Sensors](https://www.ato.com/soil-moisture-and-temperature-sensor)

### Comunicação LPWAN
- [TEKTELIC - LoRaWAN vs NB-IoT vs Sigfox](https://tektelic.com/expertise/lorawan-vs-nb-iot-sigfox-and-lte-comparison/)
- [DFRobot - LPWAN Comparison 2025](https://www.dfrobot.com/blog-17238.html)

### Gateways
- [RAKwireless - WisGate Edge](https://store.rakwireless.com/)
- [Dragino - LoRaWAN Gateways](https://www.dragino.com/)

### Agricultura de Precisão
- [Seeed Studio - LPWAN in Smart Agriculture](https://www.seeedstudio.com/blog/2021/05/05/iot-in-smart-agriculture-lpwan-technologies-applications/)

---

_Documento atualizado em 2026-01-22 | HarvestShield Phase 2 v2.0_
