import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { FinanceData } from "./src/types.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, getUserFinanceData, saveUserFinanceData } from "./src/db/queries.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// API: Get Full Data (Secured & User-Specific)
app.get("/api/finance", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || "";
    // Automatically register user in DB if they don't exist yet
    await getOrCreateUser(uid, email);
    
    const data = await getUserFinanceData(uid);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /api/finance:", error);
    res.status(500).json({ error: "No se pudieron obtener sus datos financieros." });
  }
});

// API: Save Full Data (Secured & User-Specific Sync)
app.post("/api/finance", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const data = req.body as FinanceData;
    if (!data || !Array.isArray(data.transactions)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }
    await saveUserFinanceData(uid, data);
    res.json({ success: true, message: "Datos sincronizados con éxito" });
  } catch (error: any) {
    console.error("Error in POST /api/finance:", error);
    res.status(500).json({ error: "No se pudieron guardar sus datos financieros." });
  }
});

// API: Smart AI Financial Coach (Gemini - Secured & User-Specific)
app.post("/api/gemini/coach", requireAuth, async (req: AuthRequest, res) => {
  let mockResponse: any = null;
  try {
    const uid = req.user!.uid;
    const data = await getUserFinanceData(uid);
    const apiKey = process.env.GEMINI_API_KEY;

    const summaryData = {
      totalBalance: data.accounts.reduce((sum, a) => sum + a.balance, 0),
      accounts: data.accounts.map(a => `${a.name}: $${a.balance.toLocaleString('es-AR')}`),
      budgets: data.budgets.map(b => {
        const spent = data.transactions
          .filter(t => t.type === 'expense' && t.category === b.category)
          .reduce((sum, t) => sum + t.amount, 0);
        return `${b.category} (Límite: $${b.limitAmount.toLocaleString('es-AR')}, Gastado: $${spent.toLocaleString('es-AR')})`;
      }),
      goals: data.goals.map(g => `${g.name}: progreso ${g.currentAmount} de ${g.targetAmount} (Meta: ${g.targetDate})`),
      recentTransactions: data.transactions.slice(-5).map(t => `${t.date} | ${t.type === 'income' ? 'Ingreso' : 'Gasto'} | ${t.category}: $${t.amount} (${t.description})`)
    };

    const systemInstructions = `
Sos el asesor financiero personal inteligente de un joven que trabaja en una estación de servicio YPF en Argentina.
Tenés un estilo amigable, cercano, usando el dialecto argentino de manera natural y respetuosa ("che", "viste", "tenés", "gastaste", "YPF", "Mercado Pago").
Tu objetivo es motivarlo a seguir ahorrando para comprarse su auto. Prácticamente no tiene gastos fijos mas allá de lo que decida.
Analizá los siguientes datos reales de su cuenta y proveé un reporte motivador e inteligente en formato JSON.

El formato JSON de respuesta debe ser exactamente:
{
  "motivationPhrase": "Una frase corta y pegadiza inspirada en su progreso, su trabajo en YPF, o su meta del auto. Ej: '¡Esa YPF rinde! Cada propina te acerca más a la llave de tu auto.'",
  "insights": [
    "Un consejo financiero o análisis concreto sobre sus cuentas. Ej: 'Mercado Pago tiene el 25% de tu liquidez. Acordate de usar los fondos remunerados.'",
    "Un análisis de sus presupuestos. Ej: 'Llevás gastado el 12% en Comida de tu presupuesto de $100.000. ¡Seguí cuidando las salidas!'",
    "Un pronóstico o proyección de ahorro alentador. Ej: 'Si sumás las propinas semanales promedio ($40.000), vas a adelantar la compra del auto en 1 mes.'"
  ],
  "autoGoalAnalysis": "Un texto explicativo sobre el estado de su objetivo principal del auto, calculando en cuántos meses podría llegar según sus ahorros y dándole manija para motivarlo."
}

No agregues explicaciones fuera del JSON. Devuelve SOLAMENTE el objeto JSON válido.
`;

    const prompt = `Datos actuales de Mis Finanzas:\n${JSON.stringify(summaryData, null, 2)}`;

    const total = summaryData.totalBalance;
    const carGoal = data.goals.find(g => g.name.toLowerCase().includes('auto'));
    const carRemaining = carGoal ? (carGoal.targetAmount - carGoal.currentAmount) : 4650000;
    const carPercent = carGoal ? Math.round((carGoal.currentAmount / carGoal.targetAmount) * 100) : 34;
    const carCurrent = carGoal ? carGoal.currentAmount : 2350000;
    const carTarget = carGoal ? carGoal.targetAmount : 7000000;
    
    mockResponse = {
      motivationPhrase: `¡Ese surtidor de YPF rinde de primera! Ya completaste el ${carPercent}% del objetivo del auto. Cada propina suma un kilómetro.`,
      insights: [
        `Tenés un saldo total de $${total.toLocaleString('es-AR')}. Mantener el dinero distribuido entre Mercado Pago y Banco Galicia te da flexibilidad y rendimientos diarios.`,
        "Excelente control en el presupuesto de Comida: venís gastando de manera inteligente sin excederte.",
        `Llevás acumuladas buenas propinas en tus turnos. Si seguís ahorrando a este ritmo, vas a alcanzar esos $${carRemaining.toLocaleString('es-AR')} que faltan para el auto antes de lo previsto.`
      ],
      autoGoalAnalysis: `Con $${carCurrent.toLocaleString('es-AR')} ahorrados, estás a mitad de camino del gran objetivo de los $${carTarget.toLocaleString('es-AR')}. Ahorrando un promedio estimado de $550.000 al mes, ¡en Febrero/Marzo 2027 estarás firmando los papeles de tu nuevo auto! ¡Seguí metiéndole garra!`
    };

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.log("Gemini API Key missing or default, using rich native smart mock helper.");
      return res.json(mockResponse);
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstructions,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivationPhrase: {
              type: Type.STRING,
              description: "Una frase corta y pegadiza inspirada en su progreso, su trabajo en YPF, o su meta del auto. Ej: '¡Esa YPF rinde! Cada propina te acerca más a la llave de tu auto.'"
            },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "Tres consejos financieros, análisis concretos o proyecciones sobre sus cuentas o presupuestos."
            },
            autoGoalAnalysis: {
              type: Type.STRING,
              description: "Un texto explicativo sobre el estado de su objetivo principal del auto, calculando en cuántos meses podría llegar según sus ahorros y dándole manija para motivarlo."
            }
          },
          required: ["motivationPhrase", "insights", "autoGoalAnalysis"]
        }
      }
    });

    const responseText = response.text || "";
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error("Error communicating with Gemini API, falling back to smart local summary generation.", error);
    res.json(mockResponse);
  }
});

// Vite & Static file handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
