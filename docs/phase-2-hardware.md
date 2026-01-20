# HarvestShield - Phase 2: Hardware e Comunicação de Campo

## Visão Geral

Este documento detalha os requisitos de hardware para a segunda fase do HarvestShield, onde dispositivos físicos serão implantados em lavouras reais. Inclui pesquisa sobre sensores agrícolas, tecnologias de comunicação wireless de longo alcance, topologia de rede e análise de custos.

---

## 1. Sensores Agrícolas

### 1.1 Catálogo de Sensores Recomendados

| # | Sensor | O que mede | Tipo de Dado | Bytes/Leitura | Faixa de Preço (USD) | Aplicação Principal |
|---|--------|------------|--------------|---------------|----------------------|---------------------|
| 1 | **Temperatura do Ar** | Temperatura ambiente | Float (2 decimais) | 4 bytes | $5 - $30 | Todas as culturas |
| 2 | **Umidade do Ar** | Umidade relativa % | Float (2 decimais) | 4 bytes | $5 - $30 | Todas as culturas |
| 3 | **Umidade do Solo** | Teor volumétrico de água | Float (2 decimais) | 4 bytes | $10 - $150 | Irrigação inteligente |
| 4 | **Temperatura do Solo** | Temperatura subsuperfície | Float (2 decimais) | 4 bytes | $15 - $80 | Germinação, raízes |
| 5 | **Sensor NPK** | Nitrogênio, Fósforo, Potássio | 3x Int (mg/kg) | 6 bytes | $50 - $300 | Fertilização precisa |
| 6 | **pH do Solo** | Acidez/alcalinidade | Float (1 decimal) | 4 bytes | $30 - $200 | Correção de solo |
| 7 | **Condutividade Elétrica (EC)** | Salinidade do solo | Float (μS/cm) | 4 bytes | $30 - $200 | Qualidade do solo |
| 8 | **Luminosidade (Lux)** | Intensidade luminosa | Int (0-120k) | 4 bytes | $10 - $50 | Fotoperíodo, sombreamento |
| 9 | **Pluviômetro** | Precipitação (mm) | Float | 4 bytes | $20 - $100 | Irrigação, drenagem |
| 10 | **Sensor de Vento** | Velocidade (m/s) + Direção | 2x Float | 8 bytes | $50 - $200 | Aplicação de defensivos |

### 1.2 Sensores Especializados (Opcionais)

| Sensor | O que mede | Preço (USD) | Uso |
|--------|------------|-------------|-----|
| **Molhamento Foliar** | Presença de água nas folhas | $40 - $150 | Prevenção de doenças fúngicas |
| **CO2** | Concentração de CO2 no ar | $100 - $400 | Estufas, fotossíntese |
| **Radiação Solar (PAR)** | Radiação fotossinteticamente ativa | $150 - $500 | Produtividade vegetal |
| **Tensão do Solo** | Esforço para extrair água | $80 - $250 | Irrigação precisa |
| **Sensor de Nível** | Nível de água em reservatórios | $30 - $100 | Gestão de irrigação |

### 1.3 Kits Multi-Sensor (7-in-1)

Sensores integrados que medem múltiplos parâmetros em um único dispositivo:

| Modelo | Parâmetros | Preço (USD) | Vantagem |
|--------|------------|-------------|----------|
| **Soil 7-in-1** | Umidade, Temp, EC, pH, N, P, K | $100 - $300 | Instalação única |
| **Weather Station** | Temp, Umidade, Vento, Chuva, UV | $200 - $800 | Dados meteorológicos completos |

### 1.4 Custo de Transmissão por Sensor

Considerando payload LoRaWAN típico:

| Configuração | Bytes/Payload | Frequência | Bytes/Dia | Custo LoRaWAN/Mês* |
|--------------|---------------|------------|-----------|-------------------|
| Básico (Temp + Umidade Ar/Solo + Lux) | 20 bytes | 15 min | 1.920 bytes | ~$0.10 |
| Intermediário (+ NPK + pH + EC) | 40 bytes | 15 min | 3.840 bytes | ~$0.15 |
| Completo (+ Chuva + Vento) | 56 bytes | 15 min | 5.376 bytes | ~$0.20 |

*Custo estimado para rede LoRaWAN privada (amortização do gateway)

---

## 2. Tecnologias de Comunicação Wireless

### 2.1 Comparativo LPWAN

| Característica | LoRaWAN | Sigfox | NB-IoT |
|----------------|---------|--------|--------|
| **Alcance Rural** | 10-15 km | 10-50 km | Depende de cobertura celular |
| **Alcance Urbano** | 2-5 km | 3-10 km | 1-10 km |
| **Consumo de Energia** | Baixo | Muito Baixo | Médio |
| **Vida da Bateria** | 5-10 anos | 10-15 anos | 5-10 anos |
| **Payload Máximo** | 242 bytes | 12 bytes (uplink) | 1.600 bytes |
| **Taxa de Dados** | 0.3-50 kbps | 100 bps | 200 kbps |
| **Custo por Device/Ano** | $0 (privado) ou $1-5 | $1-3 | $6-60 |
| **Infraestrutura** | Gateway próprio | Rede operadora | Rede operadora |
| **Bidirecional** | Sim | Limitado | Sim |
| **Licença de Espectro** | Não (ISM band) | Não | Sim (operadora) |

### 2.2 Recomendação: LoRaWAN

**Por que LoRaWAN para agricultura?**

1. **Custo Total de Propriedade (TCO) mais baixo** - Rede privada sem taxas mensais
2. **Alcance ideal para fazendas** - 10-15 km em área rural, suficiente para maioria das propriedades
3. **Baixo consumo de energia** - Dispositivos operam por anos com bateria
4. **Payload flexível** - Até 242 bytes permite enviar todos os dados dos sensores
5. **Comunicação bidirecional** - Permite controlar irrigação e outros atuadores
6. **Independência de operadora** - Funciona em áreas sem cobertura celular

### 2.3 Gateways LoRaWAN para Agricultura

| Modelo | Fabricante | Canais | Conectividade | Alimentação | Preço (USD) |
|--------|------------|--------|---------------|-------------|-------------|
| **KONA Photon** | TEKTELIC | 8 | 4G/LTE | Solar integrado | $800 - $1.200 |
| **WisGate Edge Pro Solar** | RAK | 8/16 | Ethernet/WiFi/4G | Solar + Bateria | $500 - $900 |
| **DLOS8N** | Dragino | 8 | Ethernet/4G | 12V (6W) | $200 - $350 |
| **Kona Enterprise** | TEKTELIC | 8/16 | Ethernet/4G | PoE/DC | $600 - $1.000 |
| **SenArch Solar** | SenArch | 8 | 4G | Solar | $700 - $1.100 |

### 2.4 Especificações Técnicas dos Gateways

| Parâmetro | Valor Típico |
|-----------|--------------|
| Sensibilidade | -140 dBm |
| Potência TX | +27 dBm (500mW) |
| Capacidade | 1.000 - 10.000 dispositivos |
| Consumo | 2-6W |
| Temperatura operação | -40°C a +60°C |
| Proteção | IP67 (outdoor) |
| Backhaul | Ethernet, WiFi, 4G/LTE |

---

## 3. Topologia de Rede

### 3.1 Arquitetura Star-of-Stars (LoRaWAN)

```
                                    ┌─────────────────┐
                                    │     INTERNET    │
                                    │   (Supabase)    │
                                    └────────┬────────┘
                                             │
                                             │ 4G/LTE ou Ethernet
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
           ┌────────▼────────┐      ┌────────▼────────┐      ┌────────▼────────┐
           │   GATEWAY 1     │      │   GATEWAY 2     │      │   GATEWAY 3     │
           │  (Sede/Central) │      │  (Campo Norte)  │      │  (Campo Sul)    │
           │   Solar/Rede    │      │     Solar       │      │     Solar       │
           └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
                    │                        │                        │
        ┌───────────┼───────────┐            │            ┌───────────┼───────────┐
        │           │           │            │            │           │           │
    ┌───▼───┐   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
    │Node 1 │   │Node 2 │   │Node 3 │   │Node 4 │   │Node 5 │   │Node 6 │   │Node 7 │
    │Sensor │   │Sensor │   │Sensor │   │Sensor │   │Sensor │   │Sensor │   │Sensor │
    └───────┘   └───────┘   └───────┘   └───────┘   └───────┘   └───────┘   └───────┘
```

### 3.2 Necessidade de Repetidores

**LoRaWAN NÃO usa repetidores tradicionais.** A topologia é estrela simples, onde cada nó se comunica diretamente com um ou mais gateways.

**Quando adicionar mais gateways:**

| Cenário | Solução |
|---------|---------|
| Propriedade > 15 km de extensão | Adicionar gateway(s) intermediário(s) |
| Terreno com obstáculos (morros, mata) | Gateway em ponto elevado ou adicional |
| Alta densidade de sensores (>500/gateway) | Distribuir carga entre gateways |
| Redundância crítica | Sobreposição de cobertura |

**Fatores que afetam o alcance:**

| Fator | Impacto | Mitigação |
|-------|---------|-----------|
| Vegetação densa | -20 a -40 dB | Antena mais alta, mais gateways |
| Topografia | Bloqueio por morros | Gateway em local elevado |
| Umidade do ar | -5 a -10 dB | Margem no link budget |
| Altura da antena | +6 dB por duplicação | Antena em torre ou poste |

### 3.3 Relay Nodes (LoRa 2.4 GHz)

Para casos extremos, existem **relay nodes** que podem estender a cobertura:

- Custo: $50-150 por relay
- Adiciona latência (~100ms)
- Requer alimentação (solar/bateria)
- Recomendado apenas quando gateway adicional não é viável

### 3.4 Cobertura Estimada por Gateway

| Tipo de Terreno | Raio de Cobertura | Área Coberta |
|-----------------|-------------------|--------------|
| Plano, sem obstáculos | 12-15 km | ~700 km² |
| Ondulado, pastagem | 8-10 km | ~300 km² |
| Com vegetação média | 5-8 km | ~150 km² |
| Floresta/mata densa | 2-5 km | ~30 km² |

---

## 4. Análise de Custos

### 4.1 Custo do Dispositivo de Campo (Node)

| Componente | Preço Unitário (USD) | Observação |
|------------|---------------------|------------|
| Microcontrolador (ESP32 + LoRa) | $15 - $30 | Ex: Heltec, TTGO, RAK |
| Sensores básicos (Temp/Umid/Solo/Lux) | $50 - $100 | Kit 4-5 sensores |
| Sensores avançados (+NPK/pH/EC) | $150 - $300 | Adicional |
| Bateria LiPo (10Ah) | $20 - $40 | Duração 6-12 meses |
| Painel solar (5-10W) | $15 - $30 | Autonomia infinita |
| Gabinete IP67 | $10 - $30 | Proteção intempéries |
| Antena externa | $5 - $15 | Melhora alcance |
| **TOTAL (Básico)** | **$115 - $245** | Sem NPK/pH |
| **TOTAL (Avançado)** | **$265 - $545** | Com NPK/pH/EC |

### 4.2 Custo de Infraestrutura (Gateway)

| Item | Custo (USD) | Quantidade Típica |
|------|-------------|-------------------|
| Gateway Solar (TEKTELIC/RAK) | $500 - $1.200 | 1 por 300-700 km² |
| Torre/Poste (3-6m) | $100 - $500 | 1 por gateway |
| Instalação | $200 - $500 | Mão de obra |
| **TOTAL por Gateway** | **$800 - $2.200** | |

### 4.3 Custo Operacional Mensal

| Item | Custo/Mês (USD) | Observação |
|------|-----------------|------------|
| Supabase (Free tier) | $0 | Até 500MB, 2GB transfer |
| Supabase (Pro) | $25 | 8GB DB, 50GB transfer |
| Stellar (Testnet) | $0 | Ilimitado |
| Stellar (Mainnet) | ~$0.0001/TX | ~$3/mês para 1000 leituras/dia |
| Manutenção dispositivos | ~$5/device/ano | Bateria, limpeza |

### 4.4 Custo por Hectare

#### Cenário 1: Pequena Propriedade (100 ha)

| Item | Quantidade | Custo Total (USD) |
|------|------------|-------------------|
| Gateway | 1 | $1.000 |
| Nodes básicos | 10 (1/10ha) | $1.500 |
| Instalação | - | $500 |
| **TOTAL CAPEX** | | **$3.000** |
| **Custo/hectare** | | **$30/ha** |

#### Cenário 2: Média Propriedade (500 ha)

| Item | Quantidade | Custo Total (USD) |
|------|------------|-------------------|
| Gateways | 2 | $2.000 |
| Nodes básicos | 25 (1/20ha) | $3.750 |
| Instalação | - | $1.000 |
| **TOTAL CAPEX** | | **$6.750** |
| **Custo/hectare** | | **$13.50/ha** |

#### Cenário 3: Grande Propriedade (2.000 ha)

| Item | Quantidade | Custo Total (USD) |
|------|------------|-------------------|
| Gateways | 3 | $3.000 |
| Nodes básicos | 50 (1/40ha) | $7.500 |
| Nodes avançados (+NPK) | 10 | $4.000 |
| Instalação | - | $2.000 |
| **TOTAL CAPEX** | | **$16.500** |
| **Custo/hectare** | | **$8.25/ha** |

---

## 5. Recomendações por Cultura

### 5.1 Café

| Parâmetro | Recomendação |
|-----------|--------------|
| **Sensores prioritários** | Umidade do solo, Temperatura do ar, Umidade do ar, Luminosidade |
| **Sensores secundários** | pH do solo, Molhamento foliar (prevenção de ferrugem) |
| **Densidade de nodes** | 1 node a cada 5-10 ha (variabilidade alta em terreno montanhoso) |
| **Frequência de leitura** | 15-30 minutos |
| **Gateway** | Solar (áreas remotas de montanha) |
| **Custo estimado/ha** | $20-40/ha |

**Justificativa:** Café é sensível a variações microclimáticas. Em regiões montanhosas como Minas Gerais, a variabilidade de altitude cria microclimas distintos que exigem maior densidade de sensores.

### 5.2 Milho

| Parâmetro | Recomendação |
|-----------|--------------|
| **Sensores prioritários** | Umidade do solo, Temperatura do solo, NPK |
| **Sensores secundários** | Pluviômetro, Radiação solar (PAR) |
| **Densidade de nodes** | 1 node a cada 20-40 ha (terreno geralmente plano) |
| **Frequência de leitura** | 30-60 minutos |
| **Gateway** | Pode ser alimentado por rede elétrica se disponível |
| **Custo estimado/ha** | $8-15/ha |

**Justificativa:** Milho em áreas planas do cerrado tem menos variabilidade espacial. O foco deve ser em umidade do solo para irrigação e NPK para fertirrigação.

### 5.3 Soja

| Parâmetro | Recomendação |
|-----------|--------------|
| **Sensores prioritários** | Umidade do solo, Temperatura, Pluviômetro |
| **Sensores secundários** | pH do solo, EC |
| **Densidade de nodes** | 1 node a cada 30-50 ha |
| **Frequência de leitura** | 30-60 minutos |
| **Custo estimado/ha** | $6-12/ha |

### 5.4 Cana-de-açúcar

| Parâmetro | Recomendação |
|-----------|--------------|
| **Sensores prioritários** | Umidade do solo (múltiplas profundidades), Temperatura |
| **Sensores secundários** | NPK, EC (salinidade) |
| **Densidade de nodes** | 1 node a cada 25-40 ha |
| **Frequência de leitura** | 30-60 minutos |
| **Custo estimado/ha** | $8-15/ha |

### 5.5 Fruticultura (Citros, Uva)

| Parâmetro | Recomendação |
|-----------|--------------|
| **Sensores prioritários** | Umidade do solo, Temperatura, Umidade do ar |
| **Sensores secundários** | Tensão do solo, pH, EC, Molhamento foliar |
| **Densidade de nodes** | 1 node a cada 2-5 ha (alto valor por hectare) |
| **Frequência de leitura** | 10-15 minutos |
| **Custo estimado/ha** | $40-80/ha |

---

## 6. Volume de Dados e Custos de Software

### 6.1 Estimativa de Volume de Dados

| Configuração | Leituras/Dia | Bytes/Leitura | MB/Mês/Device | Devices/100ha | MB/Mês Total |
|--------------|--------------|---------------|---------------|---------------|--------------|
| Básico (15 min) | 96 | 50 bytes | 0.14 MB | 10 | 1.4 MB |
| Médio (10 min) | 144 | 80 bytes | 0.35 MB | 10 | 3.5 MB |
| Intensivo (5 min) | 288 | 100 bytes | 0.86 MB | 10 | 8.6 MB |

### 6.2 Custos Supabase

| Plano | Limite DB | Limite Transfer | Preço/Mês | Devices Suportados* |
|-------|-----------|-----------------|-----------|---------------------|
| Free | 500 MB | 2 GB | $0 | ~50 devices |
| Pro | 8 GB | 50 GB | $25 | ~500 devices |
| Team | 16 GB | 100 GB | $599 | ~2.000 devices |

*Estimativa para 1 ano de histórico com leituras a cada 15 min

### 6.3 Custos Edge Function

| Métrica | Free Tier | Pro | Custo Adicional |
|---------|-----------|-----|-----------------|
| Invocações | 500K/mês | 2M/mês | $2/milhão |
| Tempo execução | 500K seg | 2M seg | - |

Para 100 devices enviando a cada 15 min:
- Invocações/mês: 100 × 96 × 30 = **288.000** (dentro do free tier)

### 6.4 Custos Stellar Mainnet

| Métrica | Valor | Custo |
|---------|-------|-------|
| Base fee | 100 stroops | ~$0.0000029 |
| Leituras/dia (100 devices) | 9.600 | ~$0.03/dia |
| **Custo mensal blockchain** | | **~$0.90/mês** |

### 6.5 Resumo de Custos Operacionais (100 ha, 10 devices)

| Item | Custo/Mês (USD) |
|------|-----------------|
| Supabase Free | $0 |
| Stellar Mainnet | $0.90 |
| Conectividade 4G gateway | $10-30 |
| **TOTAL** | **$11-31/mês** |

---

## 7. Roadmap de Implementação Phase 2

### 7.1 Etapa 1: Prototipagem (1-2 meses)

- [ ] Montar 3-5 protótipos de nodes com sensores básicos
- [ ] Adquirir 1 gateway LoRaWAN
- [ ] Adaptar firmware ESP32 para LoRa (substituir WiFi)
- [ ] Testar alcance e confiabilidade em campo

### 7.2 Etapa 2: Piloto (2-3 meses)

- [ ] Implantar em área de 10-50 ha
- [ ] Validar durabilidade dos dispositivos
- [ ] Ajustar frequência de leituras
- [ ] Calibrar sensores com medições de referência

### 7.3 Etapa 3: Escala (3-6 meses)

- [ ] Produção em lote dos nodes
- [ ] Instalação de gateways adicionais conforme necessidade
- [ ] Integração com dashboard para visualização em tempo real
- [ ] Documentação de instalação e manutenção

---

## 8. Referências

### Sensores
- [CHOOVIO - Smart Agriculture Sensors](https://www.choovio.com/smart-agriculture-7-iot-sensors-for-crop-monitoring/)
- [TEKTELIC KIWI Agriculture Sensor](https://tektelic.com/products/sensors/kiwi-iot-agriculture-sensor/)
- [NiuBoL - Agricultural Sensors](https://www.niubol.com/Agricultural-sensor/)
- [ATO.com - Soil Sensors](https://www.ato.com/soil-moisture-and-temperature-sensor)

### Comunicação LPWAN
- [TEKTELIC - LoRaWAN vs NB-IoT vs Sigfox](https://tektelic.com/expertise/lorawan-vs-nb-iot-sigfox-and-lte-comparison/)
- [DFRobot - LPWAN Comparison 2025](https://www.dfrobot.com/blog-17238.html)
- [Nexentron - LPWAN Technology Comparison](https://www.nexentron.com/blog/lora-vs-sigfox-vs-nb-iot-lpwan-comparison)

### Gateways
- [RAKwireless - WisGate Edge Pro Solar](https://store.rakwireless.com/products/wisgate-edge-pro-battery-plus-solar-panel-kit)
- [TEKTELIC - KONA Photon Gateway](https://tektelic.com/products/gateways/kona-photon/)
- [Best LoRaWAN Gateways](https://tektelic.com/expertise/best-lorawan-gateways/)

### Agricultura de Precisão
- [Coffee Precision Agriculture Brazil](https://farmonaut.com/south-america/revolutionizing-brazils-coffee-farms-precision-agriculture-and-sustainable-practices-for-climate-resilient-production)
- [Smart Sensor Technologies in Agriculture](https://onlinelibrary.wiley.com/doi/full/10.1155/js/2460098)
- [Seeed Studio - LPWAN in Smart Agriculture](https://www.seeedstudio.com/blog/2021/05/05/iot-in-smart-agriculture-lpwan-technologies-applications/)

---

_Documento gerado em 2026-01-20 | HarvestShield Phase 2 v1.0_
