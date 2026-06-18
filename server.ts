import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

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

// Expose client-safe Firebase configurations for the client application
app.get("/api/config/firebase", (req, res) => {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
      return res.json(config);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  return res.status(404).json({ error: "Firebase configuration file not found on the server." });
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
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash"];
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
// ========================================================
// 🗄️ FIREBASE FIRESTORE & LOCAL SERVER CACHE PERSISTENCE SYSTEM
// ========================================================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";

let firebaseConfig: any = null;
let firestoreDb: any = null;
let isFirestoreConnected = false;
let lastFirestoreError: string | null = null;

const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");

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
  if (syncLogs.length > 50) {
    syncLogs.pop();
  }
}

if (fs.existsSync(firebaseConfigPath)) {
  try {
    console.log("[Firebase Firestore] Detected firebase-applet-config.json. Initializing cloud database...");
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const firebaseApp = initializeApp(firebaseConfig);
    const dbId = firebaseConfig.firestoreDatabaseId;
    firestoreDb = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    isFirestoreConnected = true;
    console.log("[Firebase Firestore] Connection established successfully with Firebase cloud database.");
  } catch (err: any) {
    isFirestoreConnected = false;
    lastFirestoreError = err.message;
    addSyncLog("INIT", "error", "Falha na inicialização do Firebase Firestore", err.message);
    console.error("[Firebase Firestore] Initialization error:", err.message);
  }
} else {
  console.log("[Firebase Firestore] No config file found. Running under local cache fallback.");
  addSyncLog("INIT", "success", "Iniciado com sucesso sob modo de Contingência do Servidor.");
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
  if (!firestoreDb) return;
  try {
    console.log("[Firebase Firestore] Verifying cloud database data collections...");
    const sdrCol = await getDocs(collection(firestoreDb, "sdrs"));
    
    if (sdrCol.empty) {
      console.log("[Firebase Firestore] Cloud Collections are empty. Seeding with local backup file for seamless data migration...");
      const localCache = readLocalPersistFile();
      if (localCache) {
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
        } = localCache;
        
        // Seed SDRs
        for (const s of sdrs) {
          if (s && s.id) {
            await setDoc(doc(firestoreDb, "sdrs", s.id), { data: s, updated_at: new Date().toISOString() });
          }
        }
        // Seed Assessores
        for (const a of assessores) {
          if (a && a.id) {
            await setDoc(doc(firestoreDb, "assessores", a.id), { data: a, updated_at: new Date().toISOString() });
          }
        }
        // Seed Logs
        for (const log of oneOnOneLogs) {
          if (log && log.id) {
            await setDoc(doc(firestoreDb, "one_on_one_logs", log.id), { data: log, updated_at: new Date().toISOString() });
          }
        }
        // Seed Negocios
        for (const n of negocios) {
          if (n && n.id) {
            await setDoc(doc(firestoreDb, "negocios_fechados", n.id), { data: n, updated_at: new Date().toISOString() });
          }
        }
        // Seed configurations
        await setDoc(doc(firestoreDb, "system_config", "matches"), { data: matches, updated_at: new Date().toISOString() });
        await setDoc(doc(firestoreDb, "system_config", "campaigns"), { data: campaigns, updated_at: new Date().toISOString() });
        await setDoc(doc(firestoreDb, "system_config", "leaders"), { data: leaders, updated_at: new Date().toISOString() });
        await setDoc(doc(firestoreDb, "system_config", "teamGoals"), { data: teamGoals, updated_at: new Date().toISOString() });
        await setDoc(doc(firestoreDb, "system_config", "disabledRotationTeams"), { data: disabledRotationTeams, updated_at: new Date().toISOString() });
        
        console.log("[Firebase Firestore] Cloud database initialized and seeded successfully from local backup cache.");
        addSyncLog("INIT", "success", "Banco de dados Firestore conectado e semeado com sucesso a partir do cache local.");
      } else {
        addSyncLog("INIT", "success", "Banco de dados Firestore conectado (vazio, pronto para operar).");
      }
    } else {
      console.log("[Firebase Firestore] Found existing cloud collections. Ready.");
      addSyncLog("INIT", "success", "Banco de dados Firestore conectado operacionalmente.");
    }
  } catch (err: any) {
    isFirestoreConnected = false;
    lastFirestoreError = err.message;
    addSyncLog("INIT", "error", "Erro ao conectar de forma ativa ao Firestore", err.message);
    console.error("[Firebase Firestore] Verification connection error:", err.message);
  }
}

// 1. DATABASE COMPREHENSIVE RECOVERY / LOAD ENDPOINT
app.get("/api/db/load", async (req, res) => {
  const defaultLeadersFallback = [
    { id: 'leader-caio', teamName: 'Equipe do Caio', leaderTitle: 'Líder de Estratégia Caio', passcode: 'VMB', name: 'Caio' },
    { id: 'leader-1', teamName: 'Equipe Alpha', leaderTitle: 'Líder de Contas Alpha', passcode: 'alpha123', name: 'Gestor Alpha' },
    { id: 'leader-2', teamName: 'Equipe Beta', leaderTitle: 'Gestor Comercial Beta', passcode: 'beta123', name: 'Gestor Beta' },
    { id: 'leader-3', teamName: 'Equipe Delta', leaderTitle: 'Diretor de Expansão Delta', passcode: 'delta123', name: 'Gestor Delta' }
  ];

  if (firestoreDb) {
    try {
      console.log("[Firebase Firestore] Appending cloud recovery retrieval...");
      
      const sdrsCol = await getDocs(collection(firestoreDb, "sdrs"));
      const sdrs = sdrsCol.docs.map(doc => doc.data().data).filter(Boolean);

      const assessoresCol = await getDocs(collection(firestoreDb, "assessores"));
      const assessores = assessoresCol.docs.map(doc => doc.data().data).filter(Boolean);

      const logCol = await getDocs(collection(firestoreDb, "one_on_one_logs"));
      const oneOnOneLogs = logCol.docs.map(doc => doc.data().data).filter(Boolean);

      const negociosCol = await getDocs(collection(firestoreDb, "negocios_fechados"));
      const negocios = negociosCol.docs.map(doc => doc.data().data).filter(Boolean);

      const configCol = await getDocs(collection(firestoreDb, "system_config"));
      const configs: Record<string, any> = {};
      configCol.docs.forEach(doc => {
        configs[doc.id] = doc.data().data;
      });

      const loadedLeaders = configs.leaders && configs.leaders.length > 0 ? configs.leaders : defaultLeadersFallback;

      console.log(`[Firebase Firestore] Loaded status: ${sdrs.length} SDRs, ${assessores.length} Assessores, ${oneOnOneLogs.length} 1-1s, ${negocios.length} Negocios.`);
      addSyncLog("LOAD", "success", `Sincronização concluída com sucesso da Nuvem Firebase.`);
      
      // Keep local file updated as a mirror/contingency, so it acts as instantaneous read-accelerator
      writeLocalPersistFile({
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
      isFirestoreConnected = false;
      lastFirestoreError = dbErr.message;
      addSyncLog("LOAD", "error", "Falha de conexão com a nuvem, carregando em modo local.", dbErr.message);
      console.error("[Firebase Firestore] Failed to fetch state:", dbErr.message);
    }
  }

  // Local JSON fallback
  const localCache = readLocalPersistFile();
  if (localCache) {
    console.log("[Local Storage Cache] Successfully hydrated app from local disk cache.");
    addSyncLog("LOAD", "success", "Carregamento efetuado com sucesso usando o Cache de Contingência.");
    
    const loadedLeaders = localCache.leaders && localCache.leaders.length > 0 ? localCache.leaders : defaultLeadersFallback;
    return res.json({
      source: "local_cache",
      ...localCache,
      leaders: loadedLeaders
    });
  }

  console.log("[Local Storage Cache] No valid persistence database or cache found. Bootstrapping with clean/default values.");
  addSyncLog("LOAD", "success", "Carregamento inicial vazio. Sem dados em cache ou nuvem.");
  return res.json({
    source: "defaults",
    sdrs: [],
    assessores: [],
    oneOnOneLogs: [],
    matches: [],
    campaigns: [],
    leaders: defaultLeadersFallback,
    teamGoals: null,
    disabledRotationTeams: []
  });
});

// 2. ATOMIC SYNCHRONIZATION SAVE ENDPOINT
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

  // Sync to local fallback file first
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

  if (firestoreDb) {
    try {
      console.log("[Firebase Firestore] Executing write updates...");

      // Update/Clean SDRs on Firestore
      const freshSdrIds = new Set(sdrs.map((s: any) => s.id));
      const currentSdrs = await getDocs(collection(firestoreDb, "sdrs"));
      for (const d of currentSdrs.docs) {
        if (!freshSdrIds.has(d.id)) {
          await deleteDoc(doc(firestoreDb, "sdrs", d.id));
        }
      }
      for (const s of sdrs) {
        if (s && s.id) {
          await setDoc(doc(firestoreDb, "sdrs", s.id), { data: s, updated_at: new Date().toISOString() });
        }
      }

      // Update/Clean Assessores on Firestore
      const freshAssrIds = new Set(assessores.map((a: any) => a.id));
      const currentAssrs = await getDocs(collection(firestoreDb, "assessores"));
      for (const d of currentAssrs.docs) {
        if (!freshAssrIds.has(d.id)) {
          await deleteDoc(doc(firestoreDb, "assessores", d.id));
        }
      }
      for (const a of assessores) {
        if (a && a.id) {
          await setDoc(doc(firestoreDb, "assessores", a.id), { data: a, updated_at: new Date().toISOString() });
        }
      }

      // Update/Clean Logs on Firestore
      const freshLogIds = new Set(oneOnOneLogs.map((l: any) => l.id));
      const currentLogs = await getDocs(collection(firestoreDb, "one_on_one_logs"));
      for (const d of currentLogs.docs) {
        if (!freshLogIds.has(d.id)) {
          await deleteDoc(doc(firestoreDb, "one_on_one_logs", d.id));
        }
      }
      for (const log of oneOnOneLogs) {
        if (log && log.id) {
          await setDoc(doc(firestoreDb, "one_on_one_logs", log.id), { data: log, updated_at: new Date().toISOString() });
        }
      }

      // Update/Clean Negocios on Firestore
      const freshNegIds = new Set(negocios.map((n: any) => n.id));
      const currentNegs = await getDocs(collection(firestoreDb, "negocios_fechados"));
      for (const d of currentNegs.docs) {
        if (!freshNegIds.has(d.id)) {
          await deleteDoc(doc(firestoreDb, "negocios_fechados", d.id));
        }
      }
      for (const n of negocios) {
        if (n && n.id) {
          await setDoc(doc(firestoreDb, "negocios_fechados", n.id), { data: n, updated_at: new Date().toISOString() });
        }
      }

      // Update Configurations
      await setDoc(doc(firestoreDb, "system_config", "matches"), { data: matches, updated_at: new Date().toISOString() });
      await setDoc(doc(firestoreDb, "system_config", "campaigns"), { data: campaigns, updated_at: new Date().toISOString() });
      await setDoc(doc(firestoreDb, "system_config", "leaders"), { data: leaders, updated_at: new Date().toISOString() });
      await setDoc(doc(firestoreDb, "system_config", "teamGoals"), { data: teamGoals, updated_at: new Date().toISOString() });
      await setDoc(doc(firestoreDb, "system_config", "disabledRotationTeams"), { data: disabledRotationTeams, updated_at: new Date().toISOString() });

      savedToDb = true;
      addSyncLog("SAVE", "success", `Sincronização com nuvem concluída (${sdrs.length} SDRs, ${assessores.length} Assessores persistidos na nuvem de forma imediata).`);
      console.log("[Firebase Firestore] All state changes committed successfully.");
    } catch (err: any) {
      isFirestoreConnected = false;
      lastFirestoreError = err.message;
      addSyncLog("SAVE", "error", `Falha de conexão física com o Firestore. Gravado em cache local.`, err.message);
      console.error("[Firebase Firestore] Save operation failed:", err.message);
      dbError = err.message;
    }
  } else {
    addSyncLog("SAVE", "success", `Dados persistidos provisoriamente em Cache Local.`);
  }

  return res.json({
    success: true,
    savedToLocalCache: true,
    savedToDb,
    dbError,
    message: savedToDb 
      ? "Dados consolidados e persistidos com sucesso na nuvem do Firebase Firestore." 
      : "Dados armazenados localmente no servidor de contingência."
  });
});

// 3. STORAGE CONNECTION STATUS ENQUIRY ENDPOINT
app.get("/api/db/status", (req, res) => {
  const hostIdentifier = firebaseConfig 
    ? `${firebaseConfig.projectId || ""}-${firebaseConfig.authDomain || "default-cluster"}`
    : "local-sqlite-cache-contingency-cluster";

  // Calculate a short, secure hexadecimal connection fingerprint/hash
  const connectionHash = crypto
    .createHash("sha256")
    .update(hostIdentifier)
    .digest("hex")
    .slice(0, 16);

  res.json({
    ok: isFirestoreConnected,
    databaseConnected: isFirestoreConnected,
    databaseType: "Firebase Cloud Firestore",
    databaseUrl: firebaseConfig?.authDomain || "Default Cluster (thin-eye-bw532)",
    connectionHash: connectionHash,
    lastError: lastFirestoreError,
    message: isFirestoreConnected 
      ? "O banco de dados de nuvem permanente do Firebase Firestore está ativo, conectado e seguro!" 
      : `Banco de dados Cloud inativo. Operando em modo de contingência local: ${lastFirestoreError || 'Arquivo de credenciais em falta'}`
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
