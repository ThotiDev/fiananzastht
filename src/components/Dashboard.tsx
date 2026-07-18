import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Wallet, 
  Car, 
  Sparkles, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  ChevronRight, 
  AlertTriangle 
} from "lucide-react";
import { FinanceData, Transaction, Account, Goal } from "../types";
import { getAICoachReport, CoachResponse } from "../utils/api";

interface DashboardProps {
  data: FinanceData;
  onOpenAddTransaction: (type: 'income' | 'expense') => void;
  onSwitchTab: (tab: string) => void;
}

export default function Dashboard({ data, onOpenAddTransaction, onSwitchTab }: DashboardProps) {
  const [aiReport, setAiReport] = useState<CoachResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Load AI Report on mount
  useEffect(() => {
    fetchCoachReport();
  }, []);

  const fetchCoachReport = async () => {
    setLoadingAi(true);
    try {
      const report = await getAICoachReport();
      setAiReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Calculations for current month (July 2026 based on timestamp)
  const currentMonthStr = "2026-07";
  
  const monthlyTransactions = data.transactions.filter(t => t.date.startsWith(currentMonthStr));
  
  const incomesSum = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expensesSum = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsSum = incomesSum - expensesSum;

  const totalBalance = data.accounts.reduce((sum, a) => sum + a.balance, 0);

  // Main goal (Auto)
  const autoGoal = data.goals.find(g => g.name.toLowerCase().includes('auto')) || data.goals[0];
  const autoPercent = autoGoal 
    ? Math.min(100, Math.round((autoGoal.currentAmount / autoGoal.targetAmount) * 100))
    : 0;
  const autoMissing = autoGoal ? (autoGoal.targetAmount - autoGoal.currentAmount) : 0;

  // Format currency helper
  const formatAr = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Saldo Total Widget */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden bg-gradient-to-br from-brand-panel via-brand-panel-light to-brand-panel rounded-3xl p-6 border border-brand-border shadow-2xl shadow-blue-500/10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="flex justify-between items-center mb-3">
          <span className="text-blue-300 text-sm font-medium tracking-wide uppercase">Dinero Total Disponible</span>
          <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-500/30 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Cuenta Unificada
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-none mb-6">
          {formatAr(totalBalance)}
        </h1>

        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            id="btn-add-income"
            onClick={() => onOpenAddTransaction('income')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-semibold rounded-2xl border border-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Sumar Ingreso</span>
          </button>
          <button
            id="btn-add-expense"
            onClick={() => onOpenAddTransaction('expense')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-semibold rounded-2xl border border-rose-500/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-5 h-5" />
            <span>Restar Gasto</span>
          </button>
        </div>
      </motion.div>

      {/* Mes Actual Summary Row */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-brand-panel border border-brand-border rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <span className="text-slate-400 text-xs font-medium block mb-1">Ingresos de Julio</span>
          <span className="text-emerald-400 text-lg font-bold tracking-tight">{formatAr(incomesSum)}</span>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium mt-1">
            <TrendingUp className="w-3 h-3" /> Este mes
          </div>
        </div>
        <div className="bg-brand-panel border border-brand-border rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <span className="text-slate-400 text-xs font-medium block mb-1">Gastos de Julio</span>
          <span className="text-rose-400 text-lg font-bold tracking-tight">-{formatAr(expensesSum)}</span>
          <div className="flex items-center gap-1 text-[10px] text-rose-500 font-medium mt-1">
            <TrendingDown className="w-3 h-3" /> Controlados
          </div>
        </div>
        <div className="bg-brand-panel border border-brand-border rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <span className="text-slate-400 text-xs font-medium block mb-1">Ahorro Neto</span>
          <span className={`text-lg font-bold tracking-tight ${savingsSum >= 0 ? 'text-blue-400' : 'text-amber-500'}`}>
            {savingsSum >= 0 ? "+" : ""}{formatAr(savingsSum)}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-blue-400 font-medium mt-1">
            <PiggyBank className="w-3 h-3" /> Guardados
          </div>
        </div>
      </div>

      {/* Objetivo Auto Widget */}
      {autoGoal && (
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onSwitchTab('objetivos')}
          className="bg-brand-panel/60 hover:bg-brand-panel border border-brand-border hover:border-brand-border-focus rounded-2xl p-5 cursor-pointer transition-all shadow-lg"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm tracking-wide">Objetivo Principal</h4>
                <p className="text-slate-400 text-xs">Ahorrando para tu Auto</p>
              </div>
            </div>
            <span className="text-blue-400 text-sm font-bold">{autoPercent}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden mb-3 border border-brand-border">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${autoPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
            />
          </div>

          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400">Restan: <b className="text-slate-200">{formatAr(autoMissing)}</b></span>
            <span className="text-slate-400">Meta: <b className="text-blue-300">Febrero 2027</b></span>
          </div>
        </motion.div>
      )}

      {/* AI Smart Assistant Financial Coach Card */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative bg-gradient-to-br from-brand-panel to-brand-bg border border-brand-border-focus rounded-3xl p-5 shadow-lg overflow-hidden shadow-blue-500/5"
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-100">AI Asesor Inteligente</h3>
          </div>
          <button 
            id="btn-refresh-ai"
            onClick={fetchCoachReport}
            disabled={loadingAi}
            className="p-1.5 hover:bg-brand-panel-light rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAi ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingAi ? (
          <div className="py-6 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-xs animate-pulse">Analizando tus movimientos en YPF y cuentas...</p>
          </div>
        ) : aiReport ? (
          <div className="space-y-4">
            {/* Motivation phrase */}
            <blockquote className="text-blue-100 italic text-sm border-l-2 border-blue-500 pl-3 py-2 font-medium bg-blue-500/10 rounded-r-xl pr-2">
              "{aiReport.motivationPhrase}"
            </blockquote>

            {/* Bullets */}
            <div className="space-y-2.5">
              {aiReport.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <span className="text-blue-400 mt-1 font-bold">•</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>

            {/* Auto goal detailed projection */}
            <div className="pt-2 border-t border-brand-border text-xs text-slate-400">
              <span className="font-semibold text-slate-300 block mb-1">Proyección Auto:</span>
              <p className="leading-relaxed bg-brand-panel-light/40 p-2.5 rounded-xl border border-brand-border">{aiReport.autoGoalAnalysis}</p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-slate-400 text-xs mb-2">No pudimos obtener el reporte inteligente.</p>
            <button 
              onClick={fetchCoachReport}
              className="text-xs text-blue-400 font-semibold hover:underline"
            >
              Cargar Reporte
            </button>
          </div>
        )}
      </motion.div>

      {/* Cuentas Summary Panel */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-slate-200 text-sm tracking-wide">Tus Cuentas</h3>
          <button 
            id="lnk-accounts"
            onClick={() => onSwitchTab('cuentas')}
            className="text-xs text-blue-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            Ver cuentas <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {data.accounts.map((acc) => (
            <div 
              key={acc.id}
              className="bg-brand-panel border border-brand-border hover:border-brand-border-focus p-4 rounded-2xl flex justify-between items-center transition-all shadow"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-1.5 h-7 rounded-full" 
                  style={{ backgroundColor: acc.color || '#3b82f6' }}
                />
                <div>
                  <h4 className="text-slate-200 font-semibold text-sm">{acc.name}</h4>
                  <p className="text-[10px] text-slate-400 capitalize">{acc.type === 'digital' ? 'Fintech/Digital' : acc.type === 'bank' ? 'Bancaria' : 'Efectivo'}</p>
                </div>
              </div>
              <span className="text-white font-bold text-sm tracking-tight">{formatAr(acc.balance)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
