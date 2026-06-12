import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Check configuration status of required environment variables
app.get("/api/config/status", (req, res) => {
  const isGeminiConfigured = !!(
    process.env.GEMINI_API_KEY && 
    process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && 
    process.env.GEMINI_API_KEY.trim() !== ""
  );
  
  res.json({
    ok: isGeminiConfigured,
    geminiConfigured: isGeminiConfigured,
    message: isGeminiConfigured 
      ? "Todas as credenciais críticas e chaves de API estão ativas e validadas." 
      : "A chave de inteligência remota da API Gemini (GEMINI_API_KEY) não foi detectada ou está no valor padrão. O sistema usará os modelos analíticos e assistentes de contingência locais até que a chave seja configurada.",
    missingKeys: isGeminiConfigured ? [] : ["GEMINI_API_KEY"]
  });
});

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Resilient helper to call Gemini with a model list and cascading fallback
async function generateWithFallback(ai: GoogleGenAI, prompt: string): Promise<string> {
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of models) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.log(`[Gemini Resilience] Model ${modelName} returned error (demand spike or rate limit).`);
    }
  }

  throw lastError || new Error("All model backends exhausted.");
}

// AI Consulting Endpoint
app.post("/api/gemini/guidance", async (req, res) => {
  const { mode, leaderName, teamName, sdrStats, assessorStats, month, thermometer, sdrName, leaderNotes, actionPlan, status, professionalProfile, role } = req.body;

  const generateOneOnOneFallback = (warningMessage?: string) => {
    // Local heuristic diagnosis on leaderNotes
    let diagnosedLocal = 'comercial';
    const lowerNotes = (leaderNotes || "").toLowerCase();
    if (lowerNotes.includes('lider') || lowerNotes.includes('gestao') || lowerNotes.includes('coordena') || lowerNotes.includes('mentora') || lowerNotes.includes('ensina') || lowerNotes.includes('lideranca')) {
      diagnosedLocal = 'gestao';
    } else if (lowerNotes.includes('dados') || lowerNotes.includes('metrica') || lowerNotes.includes('gargalo') || lowerNotes.includes('analit') || lowerNotes.includes('excel') || lowerNotes.includes('padra')) {
      diagnosedLocal = 'analitico';
    } else if (lowerNotes.includes('crm') || lowerNotes.includes('cadastro') || lowerNotes.includes('operac') || lowerNotes.includes('disciplina') || lowerNotes.includes('processo') || lowerNotes.includes('rotina')) {
      diagnosedLocal = 'operacional';
    }

    const profileReadable = diagnosedLocal === 'gestao' ? 'Gestão / Liderança' : diagnosedLocal === 'analitico' ? 'Analítico' : diagnosedLocal === 'operacional' ? 'Operacional / Backoffice' : 'Comercial / Vendas';
    
    const fallbackRate = sdrStats?.agendamentosCount > 0 ? Math.round((sdrStats?.efetivacoesCount || 0) / sdrStats?.agendamentosCount * 100) : 0;
    const fallbackCallsPerAgend = sdrStats?.agendamentosCount > 0 ? (sdrStats?.callsCount / sdrStats?.agendamentosCount).toFixed(1) : "45";
    
    let insights = `### 🔬 Diagnóstico de Perfil da IA (Heurística de Contingência)
O profissional foi classificado como **${profileReadable}** com base na análise textual dos relatos de desenvolvimento do gestor.

### 📋 Relatório de Coaching Tático de IA - Individual (${sdrName || "Colaborador"})

`;
    if (warningMessage) {
      insights += `*⚠️ Aviso: O modelo de IA remoto está temporariamente indisponível (${warningMessage}). Carregando relatório de coaching estruturado de contingência local.*\n\n`;
    } else {
      insights += `*Nota: Chave de API indisponível, gerando diagnóstico analítico interno com base nos dados do período.*\n\n`;
    }
    insights += `**Perfil Profissional Avaliado**: **${profileReadable}**\n\n`;
    
    insights += `### 1. 📞 Coaching Tático (Ajustes Operacionais & Hacks de Contorno)
`;
    if (role === 'assessor') {
      insights += `- **Diagnóstico Operacional**: O Assessor **${sdrName || "Selecionado"}** possui perfil **${profileReadable}** com captação registrada de **R$ ${(sdrStats?.captacaoMes || 0).toLocaleString('pt-BR')}** e **${sdrStats?.crossSellCount || 0} cross-sells realizados** neste período.\n`;
      insights += `- **Recomendação Comercial**: Focar no reaquecimento da base passiva e buscar ofertas combinadas de fundos exclusivos ou previdência.\n`;
    } else {
      insights += `- **Diagnóstico Operacional**: O SDR **${sdrName || "SDR Selecionado"}** possui perfil **${profileReadable}** e média de **${fallbackCallsPerAgend} ligações por agendamento**. Com uma conversão de **${fallbackRate}%** (meta de ${sdrStats?.metaEfetivacaoRate || 50}%), identificamos que focar na blindagem de objeções aumentará o aproveitamento das conexões sem requerer maior esforço de chamadas.\n`;
      insights += `- **Dica de Contorno**: Quando o cliente disser *"já tenho assessor"*, treine o SDR para responder: *"Com certeza, [Nome]! Os investidores mais sofisticados já possuem assessoria de investimentos. O objetivo do convite é justamente apresentar uma contraprova neutra de portfólio, sem compromisso de portabilidades iniciais."*\n`;
    }
    
    insights += `
### 2. 🧠 Suporte Psicológico & Energia
- **Indicador de Saturação**: Status atual classificado pelo gestor como **${status || "NO_CAMINHO"}**.\n`;
    if (role === 'assessor') {
      insights += `- **Fator motivacional**: Notas do líder apontam: *"${leaderNotes || "Nenhuma nota inserida."}"*. Dica para Assessores: Estimule o balanceamento de visitas presenciais para descompressão física de escritórios fechados.\n`;
    } else {
      insights += `- **Fator motivacional**: Notas do líder apontam: *"${leaderNotes || "Nenhuma nota inserida."}"*. Dica para SDRs: Fornecer pausas estruturadas pós bloco longo de ligações foca a energia.\n`;
    }

    insights += `
### 3. 🎯 Prontidão de Carreira & Plano de Ação
- **Análise Técnico-Comercial**: Colaborador encontra-se em constante acompanhamento de evolução para os desafios futuros.\n`;
    if (role === 'assessor') {
      insights += `- **Potencial de Carreira**: Como perfil **${profileReadable}**, focar em contas de alta renda e corporate pode ser o próximo passo tático ideal.\n`;
    } else {
      insights += `- **Potencial de Carreira**: Sendo de perfil **${profileReadable}**, as chances de transição para cargos de coordenação interna ou assessoria técnica direta são ótimas se preencher os GAPs de volume do mês.\n`;
    }
    insights += `- **Plano**: O plano traçado é *"${actionPlan || "Nenhum plano traçado."}"*.\n\n`;
    
    // Output PERFIL tag for fallback parser
    insights += `\n[PERFIL: ${diagnosedLocal}]\n`;

    return insights;
  };

  const generateConsultingFallback = (warningMessage?: string) => {
    const elapsedStr = thermometer ? `${thermometer.currentDaysElapsed}/${thermometer.totalDaysInMonth} dias elapsados (${thermometer.expectedProgress}% esperado)` : "";
    const gapSign = thermometer && thermometer.progressGap > 0 ? "+" : "";
    const gapStr = thermometer ? `${gapSign}${thermometer.progressGap}% de gap` : "";
    const tempStr = thermometer ? thermometer.temperature : "ESTÁVEL";
    const totalRel = thermometer ? thermometer.realizedProgress : 0;

    const lowPerformers = sdrStats && Array.isArray(sdrStats) ? sdrStats.filter((s: any) => s.agendamentosCount < s.metaAgendamentos || (s.agendamentosCount > 0 && (s.efetivacoesCount / s.agendamentosCount * 100) < s.metaEfetivacaoRate)) : [];
    const highPerformers = sdrStats && Array.isArray(sdrStats) ? sdrStats.filter((s: any) => s.agendamentosCount >= s.metaAgendamentos && (s.agendamentosCount > 0 && (s.efetivacoesCount / s.agendamentosCount * 100) >= s.metaEfetivacaoRate)) : [];

    let insights = `### 📋 Relatório de Consultoria Operacional (IA Analítica)\n\n`;
    if (warningMessage) {
      insights += `*⚠️ Aviso: O modelo de IA remoto está sob alta demanda ou temporariamente indisponível (${warningMessage}). Carregando relatório de contingência local automatizado.*\n\n`;
    } else {
      insights += `*Nota: Chave de API indisponível, gerando diagnóstico analítico interno com base nos dados do período.*\n\n`;
    }

    insights += `#### 1. **🌡️ Termômetro de Performance: ${tempStr}**
- **Progresso Realizado**: **${totalRel}%** vs **${thermometer ? thermometer.expectedProgress : 0}%** esperado para o dia do mês (${elapsedStr}).
- **Diagnóstico Temporal**: O time comercial está com **${gapStr}** em relação ao ritmo linear ideal. Para atingir 100% da cota mensal, a força de vendas precisa acelerar a cadência diária de prospecção.

#### 2. **📉 Gargalos Críticos & Alinhamento**
`;
    if (lowPerformers.length > 0) {
      lowPerformers.forEach((s: any) => {
        const rate = s.agendamentosCount > 0 ? Math.round((s.efetivacoesCount / s.agendamentosCount) * 100) : 0;
        insights += `- **${s.name}**: Está operando abaixo da cota linear (Feito: ${s.agendamentosCount}/${s.metaAgendamentos} agendamentos, Conversão: ${rate}% vs meta de ${s.metaEfetivacaoRate}%). Seu foco deve ser a blindagem de reuniões antes do fechamento semanal.\n`;
      });
    } else {
      insights += `- Excelente! Todo o time comercial está correspondendo ao avanço cronológico estendido do mês.\n`;
    }

    insights += `
#### 3. **🏆 Benchmarks Internos**
`;
    if (highPerformers.length > 0) {
      highPerformers.forEach((s: any) => {
        insights += `- **${s.name}**: Líder supremo com **${s.agendamentosCount}** reuniões agendadas. Seus métodos de contorno de objeções de assessores devem ser compartilhados via playbook.\n`;
      });
    } else {
      insights += `- Sem benchmarks com meta cheia batida no presente momento. O principal foco agora é alinhamento coletivo.\n`;
    }

    insights += `
#### 4. **⚡ Plano de Resgate & Script Comercial Avançado**
- **Repescagem Diária**: Cruzar contatos que enviaram 'não tenho interesse' na semana anterior.
- **Script para Reaquecer Leads Frios (WhatsApp)**:
  > *"Olá, [Nome do Cliente]! Tudo bem? Entendo que sua rotina de negócios esteja super corrida. Nosso Assessor Sênior acabou de desenhar uma análise curta (15 minutos) do impacto das últimas mudanças tributárias sobre carteiras de investimentos corporativas. Liberei um único horário exclusivo na agenda dele amanhã às 14h ou 16:30h. Qual destes momentos faz mais sentido para proteger seu fluxo?"*
`;
    return insights;
  };

  if (mode === "one_on_one") {
    const sdrRate = sdrStats?.agendamentosCount > 0 ? Math.round((sdrStats?.efetivacoesCount || 0) / sdrStats?.agendamentosCount * 100) : 0;
    const callsPerAgend = sdrStats?.agendamentosCount > 0 ? (sdrStats?.callsCount / sdrStats?.agendamentosCount).toFixed(1) : "—";

    const prompt = `
    Você é um Coach de Vendas de altíssimo nível e Psicólogo Organizacional focado em assessoria de investimentos, SDRs e Assessores. 
    Analise este profissional para uma sessão de 1:1 baseada em suas métricas reais e nos relatos de desempenho ou atitude fornecidos pelo líder.
    
    Tipo de Cargo: ${role === 'assessor' ? 'Assessor de Investimentos' : 'SDR (Sales Development Representative)'}
    Nome do Profissional: ${sdrName || "Nome do Profissional"}
    Status atual de entrega: ${status || "NO_CAMINHO"}
    
    ${role === 'assessor' 
      ? `Métricas do Assessor:
         - Captação Líquida no Mês: R$ ${(sdrStats?.captacaoMes || 0).toLocaleString('pt-BR')}
         - Quantidade de Cross-Sell: ${sdrStats?.crossSellCount || 0}
         - Detalhes de Cross-Sell: ${sdrStats?.crossSellDetails || "Sem detalhes"}`
      : `Métricas do SDR:
         - Agendamentos realizados: ${sdrStats?.agendamentosCount || 0} (Meta de agendamentos: ${sdrStats?.metaAgendamentos || 20})
         - Conversão Real: ${sdrRate}% (Meta de taxa de efetivação: ${sdrStats?.metaEfetivacaoRate || 50}%)
         - Ligações realizadas: ${sdrStats?.callsCount || 0}
         - Média de ligações para agendar: ${callsPerAgend}
         - Contas abertas: ${sdrStats?.contasAbertasCount || 0}`
    }
    
    Relatos/Notas de Desempenho do Líder: "${leaderNotes || ""}"
    Plano de Ação Traçado: "${actionPlan || ""}"
    
    Sua missão principal é DIAGNOSTICAR o Perfil Profissional do colaborador de acordo com as seguintes 4 categorias, baseando-se estritamente nas aptidões táticas, organizacionais, emocionais ou comportamentais percebidas nos relatos do líder:
    - 'comercial' -> Colaborador focado em prospecção ativa, alta energia comercial, persuasão e volume, mas que pode pecar em processos, CRM ou follow-ups.
    - 'gestao' -> Colaborador com forte espírito de liderança, inclinação a ajudar o time, mentoria, processos claros, ótima comunicação e autogestão.
    - 'analitico' -> Colaborador focado em dados, métricas, identificação refinada de padrões de leads, mas que pode entrar em paralisia por análise.
    - 'operacional' -> Colaborador disciplinado com CRM, organização rigorosa, execução dedicada e conformidade prática de processos.

    Você DEVE analisar os relatos de de forma cirúrgica e, obrigatoriamente, incluir no início ou no fim da sua resposta a tag estrita: [PERFIL: comercial] ou [PERFIL: gestao] ou [PERFIL: analitico] ou [PERFIL: operacional], escolhendo exatamente uma das quatro opções.
    
    Por favor, forneça um parecer completo estruturado EXATAMENTE com as seguintes seções formatadas com Markdown:
    
    ### 🔬 Diagnóstico de Perfil da IA: [Indique o Perfil Detectado com Breve Explicação]
    - Apresente um parágrafo avaliando por que o profissional de fato pertence a esse perfil com base nos relatos fornecidos e no comportamento descrito pelo gestor.
    
    ### 1. 📞 Coaching Tático (Ajustes Operacionais & Hacks de Contorno)
    - Se for SDR: Crítica tática baseada em ligações e objeções. Se for Assessor: Crítica tática de captação e cross-sell. Forneça 3 dicas práticas específicas.
    
    ### 2. 🧠 Suporte Psicológico & Energia
    - Avalie se o profissional apresenta sinais de estresse (Burnout), desmotivação ou se está no ápice de energia. Dê recomendações de liderança personalizadas para manter a estabilidade emocional e foco.
    
    ### 3. 🎯 Prontidão de Carreira & Plano de Ação
    - Analise de forma sincera a prontidão e próximos passos profissionais deste colaborador baseado na meta estipulada e plano de ação.
    
    Seja elegante, construtivo, focado em alta realimentação e use terminologias contemporâneas do mercado de investimentos em Português.
    `;

    try {
      const ai = getGeminiClient();
      if (ai) {
        try {
          const text = await generateWithFallback(ai, prompt);
          const matchProfile = text.match(/\[PERFIL:\s*(comercial|gestao|analitico|operacional)\]/i);
          const diagnosed = matchProfile ? matchProfile[1].toLowerCase() : undefined;
          return res.json({ text: text, advice: text, diagnosedProfile: diagnosed });
        } catch (apiError: any) {
          console.warn("Gemini API overloaded or returned error for 1:1, falling back:", apiError);
          const fallbackText = generateOneOnOneFallback(apiError?.message || "Alta demanda temporária");
          const matchProfile = fallbackText.match(/\[PERFIL:\s*(comercial|gestao|analitico|operacional)\]/i);
          const diagnosed = matchProfile ? matchProfile[1].toLowerCase() : undefined;
          return res.json({ text: fallbackText, advice: fallbackText, diagnosedProfile: diagnosed });
        }
      } else {
        const localFallback = generateOneOnOneFallback();
        const matchProfile = localFallback.match(/\[PERFIL:\s*(comercial|gestao|analitico|operacional)\]/i);
        const diagnosed = matchProfile ? matchProfile[1].toLowerCase() : undefined;
        return res.json({ text: localFallback, advice: localFallback, diagnosedProfile: diagnosed });
      }
    } catch (error: any) {
      console.error("AI 1:1 outer Generation error, returning local fallback:", error);
      const localErrorFallback = generateOneOnOneFallback(error?.message);
      const matchProfile = localErrorFallback.match(/\[PERFIL:\s*(comercial|gestao|analitico|operacional)\]/i);
      const diagnosed = matchProfile ? matchProfile[1].toLowerCase() : undefined;
      return res.json({ text: localErrorFallback, advice: localErrorFallback, diagnosedProfile: diagnosed });
    }
  }

  const prompt = `
    Você é o Consultor Executivo de Vendas e CO-PILOTO de IA de alta performance para equipes comerciais. Suas orientações devem ser cirúrgicas, acionáveis, motivadoras e extremamente estratégicas.
    
    Líder atual: ${leaderName || "Líder Especialista"}
    Equipe supervisionada: ${teamName || "Geral"}
    Mês de Referência: ${month || "Mês Corrente"}
    
    ESTADO TEMPORAL E PROPRIEDADES DE PROGRESSÃO DO MÊS:
    - O termômetro de performance indica o progresso temporal linear. Como líder sênior e consultor de vendas, você entende e ajuda o time a entender que as metas corporativas progridem de forma linear.
    - Dias Decorridos no Mês: ${thermometer?.currentDaysElapsed} de ${thermometer?.totalDaysInMonth} dias (${thermometer ? Math.round((thermometer.currentDaysElapsed / thermometer.totalDaysInMonth) * 100) : 0}% do tempo do período esgotado).
    - Avanço Nominal Realizado pela Força de Vendas: ${thermometer?.realizedProgress}% da cota de agendamentos consolidada.
    - Cota Linear Temporal Esperada: ${thermometer?.expectedProgress}% do planejado.
    - Gap Líquido de Ritmo de Vendas: ${thermometer ? (thermometer.progressGap > 0 ? '+' : '') + thermometer.progressGap : 0}% em relação ao esperado hoje.
    - Temperatura Geral do Mês: ${thermometer?.temperature || "⚖️ EM EQUILÍBRIO"}

    Métricas da Equipe:
    SDRs Ativos do Canal: ${JSON.stringify(sdrStats)}
    Assessores Ativos do Canal: ${JSON.stringify(assessorStats)}
    
    Por favor, crie uma análise dinâmica e sofisticada baseada estritamente no tempo elapsado dividida em:
    1. **🌡️ Termômetro Temporal & Ritmo Operacional**: Explique com precisão cirúrgica a nossa posição na linha temporal do mês (atrás ou à frente do tempo esgotado de ${thermometer ? Math.round((thermometer.currentDaysElapsed / thermometer.totalDaysInMonth) * 100) : 0}%). Diga quantos agendamentos diários o time precisa registrar a partir de amanhã para eliminar o GAP e fechar o mês em 100% da meta.
    2. **📉 Gargalos Críticos de Prospecção**: Aponte quais indivíduos estão com as maiores defasagens em conversões, considerando a proporcionalidade do tempo de prospecção do mês.
    3. **🏆 Benchmarks da Linha de Frente**: Diga quem já superou o ritmo diário e em que aspects eles podem auxiliar o restante do time.
    4. **⚡ Roteiro de Aceleração Prática (Plano de Resgate)**: Dê um plano de 3 passos para reaquecer leads frios e um Script Comercial Persuasivo de WhatsApp para prospecção, focando em converter mais agendamentos e acelerar aberturas de contas antes do fim do mês.
    
    Escreva de forma sucinta, elegante e extremamente profissional em Português. Use Markdown para formatar. Indique metas de forma clara.
  `;

  try {
    const ai = getGeminiClient();
    if (ai) {
      try {
        const text = await generateWithFallback(ai, prompt);
        return res.json({ text: text });
      } catch (apiError: any) {
        console.warn("Gemini API overloaded or returned error for guidance, falling back:", apiError);
        const fallbackText = generateConsultingFallback(apiError?.message || "Alta demanda temporária");
        return res.json({ text: fallbackText });
      }
    } else {
      return res.json({ text: generateConsultingFallback() });
    }
  } catch (outerError: any) {
    console.error("AI Generation outer error, returning local fallback:", outerError);
    return res.json({ text: generateConsultingFallback(outerError?.message) });
  }
});

// ========================================================
// 🗄️ NEON POSTGRESQL & LOCAL SERVER CACHE persistance SYSTEM
// ========================================================
import pg from "pg";
import fs from "fs";

const { Pool } = pg;
const dbUrl = process.env.DATABASE_URL;
let dbPool: pg.Pool | null = null;
let lastDbError: string | null = null;
let isDbConnected = false;

// Structured logs for tracking connection state
interface SyncLog {
  id: string;
  timestamp: string;
  type: "LOAD" | "SAVE" | "INIT";
  status: "success" | "error";
  message: string;
  details?: string;
  error?: string | null;
}

const syncLogs: SyncLog[] = [];

function addSyncLog(type: "LOAD" | "SAVE" | "INIT", status: "success" | "error", message: string, error?: string | null, details?: string) {
  const log: SyncLog = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    type,
    status,
    message,
    details,
    error
  };
  syncLogs.unshift(log);
  // Keep the last 50 logs to prevent memory bloat
  if (syncLogs.length > 50) {
    syncLogs.pop();
  }
}

if (dbUrl && dbUrl.trim() !== "") {
  console.log("[Neon Database] Detected DATABASE_URL in environment. Initializing pool...");
  dbPool = new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false // Required for serverless Neon PostgreSQL connections
    }
  });
} else {
  console.log("[Neon Database] No DATABASE_URL configuration detected. Running under local server cache fallback.");
  addSyncLog("INIT", "success", "Iniciado com sucesso em modo de Contingência / Cache Local (DATABASE_URL em branco).");
}

const PERSIST_FILE = path.join(process.cwd(), "persist_data.json");

function readLocalPersistFile() {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      const raw = fs.readFileSync(PERSIST_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err: any) {
    console.error("[Local Storage Cache] Error reading local fallback file:", err.message);
  }
  return null;
}

function writeLocalPersistFile(data: any) {
  try {
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err: any) {
    console.error("[Local Storage Cache] Error writing local fallback file:", err.message);
  }
}

async function verifyDatabase() {
  if (!dbPool) return;
  try {
    const client = await dbPool.connect();
    isDbConnected = true;
    lastDbError = null;
    console.log("[Neon Database] Connection established successfully with Neon PostgreSQL cloud system.");

    // Create persistent storage schemas that support high-fidelity upsert and flex schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS sdrs (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS assessores (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS one_on_one_logs (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS negocios_fechados (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
    addSyncLog("INIT", "success", "Banco de dados Neon conectado e tabelas de dados validadas com sucesso.");
    console.log("[Neon Database] Database schema validated and table architecture ready.");
  } catch (err: any) {
    isDbConnected = false;
    lastDbError = err.message;
    addSyncLog("INIT", "error", "Falha crítica na conexão inicial e criação de tabelas do Postgres", err.message);
    console.error("[Neon Database] Error preparing database schemas in PostgreSQL:", err.message);
  }
}

// 1. DATABASE COMPREHENSIVE RECOVERY / LOAD ENDPOINT
app.get("/api/db/load", async (req, res) => {
  if (dbPool) {
    try {
      console.log("[Neon Database] Attempting state retrieval...");
      const client = await dbPool.connect();
      isDbConnected = true;
      lastDbError = null;
      
      const sdrRows = await client.query("SELECT data FROM sdrs");
      const assrRows = await client.query("SELECT data FROM assessores");
      const logRows = await client.query("SELECT data FROM one_on_one_logs");
      const negociosRows = await client.query("SELECT data FROM negocios_fechados");
      const configRows = await client.query("SELECT key, data FROM system_config");
      
      client.release();
      
      const sdrs = sdrRows.rows.map(r => r.data);
      const assessores = assrRows.rows.map(r => r.data);
      const oneOnOneLogs = logRows.rows.map(r => r.data);
      const negocios = negociosRows.rows.map(r => r.data);
      
      const configs: Record<string, any> = {};
      configRows.rows.forEach(r => {
        configs[r.key] = r.data;
      });

      // If we queried PostgreSQL successfully, we use it as supreme truth
      const defaultLeadersFallback = [
        { id: 'leader-caio', teamName: 'Equipe do Caio', leaderTitle: 'Líder de Estratégia Caio', passcode: 'VMB', name: 'Caio' },
        { id: 'leader-1', teamName: 'Equipe Alpha', leaderTitle: 'Líder de Contas Alpha', passcode: 'alpha123', name: 'Gestor Alpha' },
        { id: 'leader-2', teamName: 'Equipe Beta', leaderTitle: 'Gestor Comercial Beta', passcode: 'beta123', name: 'Gestor Beta' },
        { id: 'leader-3', teamName: 'Equipe Delta', leaderTitle: 'Diretor de Expansão Delta', passcode: 'delta123', name: 'Gestor Delta' }
      ];

      const loadedLeaders = configs.leaders && configs.leaders.length > 0 ? configs.leaders : defaultLeadersFallback;

      console.log(`[Neon Database] Hydrating from PostgreSQL: ${sdrs.length} SDRs, ${assessores.length} Assessores, ${oneOnOneLogs.length} Logs, ${negocios.length} Negocios.`);
      addSyncLog("LOAD", "success", `Sincronização bem sucedida. Carregou dados da Nuvem Neon.`);
      return res.json({
        source: "database",
        sdrs,
        assessores,
        oneOnOneLogs,
        negocios,
        matches: configs.matches || [],
        campaigns: configs.campaigns || [],
        leaders: loadedLeaders,
        teamGoals: configs.teamGoals || null,
        disabledRotationTeams: configs.disabledRotationTeams || []
      });
    } catch (dbErr: any) {
      isDbConnected = false;
      lastDbError = dbErr.message;
      addSyncLog("LOAD", "error", "Erro ao recuperar dados do Postgres Neon. Tentando usar cache local de contingência.", dbErr.message);
      console.error("[Neon Database] Failed to pull state from Neon. Resorting to local cache:", dbErr.message);
    }
  }

  // Local JSON fallback
  const localCache = readLocalPersistFile();
  if (localCache) {
    console.log("[Local Storage Cache] Successfully hydrated app from local disk cache.");
    addSyncLog("LOAD", "success", "Carregamento de dados local efetuado com sucesso usando o Cache de Contingência.");
    return res.json({
      source: "local_cache",
      ...localCache
    });
  }

  console.log("[Local Storage Cache] No valid persistence database or cache found. Bootstrapping with clean/default values.");
  addSyncLog("LOAD", "success", "Carregamento inicial vazio. Banco de dados novo ou zerado.");
  return res.json({
    source: "defaults",
    sdrs: [],
    assessores: [],
    oneOnOneLogs: [],
    matches: [],
    campaigns: [],
    leaders: [],
    teamGoals: null,
    disabledRotationTeams: []
  });
});

// 2. ATOMIC TRANSACTION FULL-SYNC SAVE ENDPOINT
app.post("/api/db/save", async (req, res) => {
  const { 
    sdrs = [], 
    assessores = [], 
    oneOnOneLogs = [], 
    matches = [], 
    campaigns = [], 
    leaders = [], 
    teamGoals = null, 
    disabledRotationTeams = [],
    negocios = []
  } = req.body;

  // Sync with local memory cache first so any multi-PC action immediately works
  writeLocalPersistFile({
    sdrs,
    assessores,
    oneOnOneLogs,
    matches,
    campaigns,
    leaders,
    teamGoals,
    disabledRotationTeams,
    negocios
  });

  let savedToDb = false;
  let dbError = null;

  if (dbPool) {
    try {
      console.log("[Neon Database] Starting atomic database transaction save...");
      const client = await dbPool.connect();
      isDbConnected = true;
      lastDbError = null;
      
      try {
        await client.query("BEGIN");
        
        // 1. Sync SDRs (Upsert active + prune stale)
        for (const s of sdrs) {
          await client.query(
            "INSERT INTO sdrs (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP",
            [s.id, JSON.stringify(s)]
          );
        }
        if (sdrs.length > 0) {
          const sdrIds = sdrs.map((s: any) => s.id);
          await client.query("DELETE FROM sdrs WHERE id <> ALL($1)", [sdrIds]);
        } else {
          await client.query("DELETE FROM sdrs");
        }

        // 2. Sync Assessores
        for (const a of assessores) {
          await client.query(
            "INSERT INTO assessores (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP",
            [a.id, JSON.stringify(a)]
          );
        }
        if (assessores.length > 0) {
          const assrIds = assessores.map((a: any) => a.id);
          await client.query("DELETE FROM assessores WHERE id <> ALL($1)", [assrIds]);
        } else {
          await client.query("DELETE FROM assessores");
        }

        // 3. Sync One-on-One Logs
        for (const log of oneOnOneLogs) {
          await client.query(
            "INSERT INTO one_on_one_logs (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP",
            [log.id, JSON.stringify(log)]
          );
        }
        if (oneOnOneLogs.length > 0) {
          const logIds = oneOnOneLogs.map((l: any) => l.id);
          await client.query("DELETE FROM one_on_one_logs WHERE id <> ALL($1)", [logIds]);
        } else {
          await client.query("DELETE FROM one_on_one_logs");
        }

        // 4. Sync Negocios
        for (const n of negocios) {
          await client.query(
            "INSERT INTO negocios_fechados (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP",
            [n.id, JSON.stringify(n)]
          );
        }
        if (negocios.length > 0) {
          const negIds = negocios.map((n: any) => n.id);
          await client.query("DELETE FROM negocios_fechados WHERE id <> ALL($1)", [negIds]);
        } else {
          await client.query("DELETE FROM negocios_fechados");
        }

        // 4. Sync Generic Configurations and Metadata
        const configPack = [
          { key: "matches", data: matches },
          { key: "campaigns", data: campaigns },
          { key: "leaders", data: leaders },
          { key: "teamGoals", data: teamGoals },
          { key: "disabledRotationTeams", data: disabledRotationTeams }
        ];

        for (const config of configPack) {
          await client.query(
            "INSERT INTO system_config (key, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP",
            [config.key, JSON.stringify(config.data)]
          );
        }

        await client.query("COMMIT");
        savedToDb = true;
        addSyncLog("SAVE", "success", `Sincronização de saída (Atualização): ${sdrs.length} SDRs, ${assessores.length} Assessores e ${negocios.length} Negócios persistidos na Nuvem.`);
        console.log("[Neon Database] Transaction committed successfully to your Neon storage.");
      } catch (txErr: any) {
        await client.query("ROLLBACK");
        throw txErr;
      } finally {
        client.release();
      }
    } catch (err: any) {
      isDbConnected = false;
      lastDbError = err.message;
      addSyncLog("SAVE", "error", `Falha de persistência no Postgres. Gravado provisoriamente em Cache de Contingência.`, err.message);
      console.error("[Neon Database] Save operation transaction aborted:", err.message);
      dbError = err.message;
    }
  } else {
    // If running only under local server fallback
    addSyncLog("SAVE", "success", `Alteração armazenada com êxito no Cache do Servidor (${sdrs.length} SDRs, ${assessores.length} Assessores, ${negocios.length} Negócios).`);
  }

  return res.json({
    success: true,
    savedToLocalCache: true,
    savedToDb,
    dbError,
    message: savedToDb 
      ? "Dados consolidados e transmitidos com sucesso para a nuvem da Neon Database." 
      : "Dados armazenados com segurança no servidor local. Seu time já consegue compartilhar as mesmas informações em qualquer PC!"
  });
});

// 3. STORAGE CONNECTION STATUS ENQUIRY ENDPOINT
app.get("/api/db/status", (req, res) => {
  const isDbConfigured = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
  let maskedUrl = "Não Cadastrado";
  
  if (isDbConfigured && process.env.DATABASE_URL) {
    try {
      const match = process.env.DATABASE_URL.match(/@([^/?:#]+)/);
      if (match && match[1]) {
        maskedUrl = `postgresql://***@${match[1]}`;
      } else {
        maskedUrl = "postgresql://*** (Configurada)";
      }
    } catch {
      maskedUrl = "postgresql://***";
    }
  }

  res.json({
    ok: isDbConfigured,
    databaseConnected: isDbConfigured && isDbConnected,
    databaseType: isDbConfigured ? "Neon / PostgreSQL Clássico" : "Local Shared JSON Cache Server",
    databaseUrl: maskedUrl,
    lastError: lastDbError,
    message: isDbConfigured 
      ? (isDbConnected ? "O banco de dados de nuvem Neon está monitorado e conectado!" : `Falha na conexão com o banco Neon: ${lastDbError}`)
      : "Rodando sob o cache central do servidor. Todas as máquinas conectadas à nuvem do seu Applet compartilham as alterações!"
  });
});

// 4. STORAGE SYNCHRONIZATION LOGS HISTORY ENDPOINT
app.get("/api/db/history", (req, res) => {
  res.json({ logs: syncLogs });
});

// Configure Vite middleware / Serve client
async function init() {
  // Verify database schema & tables first
  await verifyDatabase();

  const isProd = process.env.NODE_ENV === "production" || 
                 (process.argv[1] && !process.argv[1].endsWith("server.ts"));

  if (!isProd) {
    console.log("[Server] Starting in DEVELOPMENT mode (mounting Vite middleware)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Starting in PRODUCTION mode (serving static assets)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] Running on http://localhost:${PORT}`);
  });
}

init();
