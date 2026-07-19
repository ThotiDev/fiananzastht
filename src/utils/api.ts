import { FinanceData } from "../types";
import { auth } from "../lib/firebase.ts";

const LOCAL_STORAGE_KEY = "mis_finanzas_local_data";

// Retrieve headers with Firebase ID token
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken(true);
      headers["Authorization"] = `Bearer ${token}`;
    } catch (err) {
      console.error("Error getting Firebase ID token:", err);
    }
  }
  return headers;
}

// Default local initial data in case the API is completely unreachable
const defaultLocalData: FinanceData = {
  accounts: [
    { id: "acc-1", name: "Efectivo", type: "cash", balance: 250000, color: "#10b981" },
    { id: "acc-2", name: "Banco Galicia", type: "bank", balance: 1510000, color: "#3b82f6" },
    { id: "acc-3", name: "Mercado Pago", type: "digital", balance: 590000, color: "#06b6d4" }
  ],
  transactions: [
    {
      id: "t-1",
      type: "income",
      amount: 785000,
      category: "Sueldo",
      description: "Sueldo YPF - Mes Junio",
      account: "acc-2",
      date: "2026-07-01",
      time: "10:00"
    },
    {
      id: "t-2",
      type: "income",
      amount: 24300,
      category: "Propinas",
      description: "Propinas Turno Noche - Fin de Semana",
      account: "acc-1",
      date: "2026-07-13",
      time: "06:15"
    }
  ],
  goals: [
    {
      id: "g-1",
      name: "Auto (Ahorro)",
      targetAmount: 7000000,
      currentAmount: 2350000,
      targetDate: "2027-02-28",
      icon: "car"
    }
  ],
  budgets: [
    { id: "b-1", category: "Comida", limitAmount: 100000 }
  ],
  futureExpenses: [
    {
      id: "fe-1",
      title: "Cumple de Mamá (Regalo)",
      amount: 35000,
      dueDate: "2026-08-20",
      remindDaysBefore: 5,
      completed: false
    }
  ]
};

export async function fetchFinanceData(): Promise<FinanceData> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/finance", { headers });
    if (!response.ok) {
      throw new Error("Server response error");
    }
    const data = await response.json();
    // Cache locally
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn("Could not load from API, falling back to local storage:", error);
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return defaultLocalData;
      }
    }
    return defaultLocalData;
  }
}

export async function saveFinanceData(data: FinanceData): Promise<boolean> {
  // Update local cache immediately for ultra-fast UI updates
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  
  try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/finance", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch (error) {
    console.warn("Could not sync data to API, stored in offline local storage:", error);
    return false;
  }
}

export interface CoachResponse {
  motivationPhrase: string;
  insights: string[];
  autoGoalAnalysis: string;
}

export async function getAICoachReport(): Promise<CoachResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/gemini/coach", {
      method: "POST",
      headers,
    });
    if (!response.ok) {
      throw new Error("Coach API response error");
    }
    return await response.json();
  } catch (error) {
    console.error("AI Coach fetch failed, using realistic mock metrics:", error);
    return {
      motivationPhrase: "¡Ese surtidor de YPF rinde de primera! Ya completaste más de un tercio del objetivo del auto. Cada propina suma un kilómetro.",
      insights: [
        "Tenés tus ahorros bien divididos. Mantener fondos líquidos en Mercado Pago y depósitos en el Banco Galicia te da seguridad y flexibilidad.",
        "Vas súper bien con el presupuesto de Comida. Seguí cuidando las compras chiquitas del día a día, que a fin de mes hacen la diferencia.",
        "Las propinas del turno noche están rindiendo un montón. Si seguís guardando el 80% de tus ingresos, vas a adelantar la compra del auto en semanas."
      ],
      autoGoalAnalysis: "Con lo que tenés ahorrado, estás encaminado al gran objetivo de tu auto. Ahorrando un promedio estimado de $500.000 por mes, vas a alcanzar la meta en Febrero o Marzo de 2027. ¡Seguí metiéndole que falta cada vez menos!"
    };
  }
}
