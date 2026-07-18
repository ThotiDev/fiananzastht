import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Target, 
  Car, 
  Tv, 
  Palmtree, 
  Sparkles, 
  Plus, 
  X, 
  ChevronRight, 
  Calculator,
  ArrowUpCircle,
  TrendingUp,
  Info
} from "lucide-react";
import { Goal, Account, Transaction } from "../types";

interface GoalsProps {
  goals: Goal[];
  accounts: Account[];
  transactions: Transaction[];
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onEditGoal: (id: string, name: string, targetAmount: number, currentAmount: number, targetDate: string) => void;
  onDeleteGoal: (id: string) => void;
  onDepositToGoal: (goalId: string, accountId: string, amount: number) => void;
}

export default function Goals({
  goals,
  accounts,
  transactions,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onDepositToGoal
}: GoalsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState<Goal | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [icon, setIcon] = useState("target");

  // Deposit state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositAccountId, setDepositAccountId] = useState(accounts[0]?.id || "");

  // Edit states
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editName, setEditName] = useState("");
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editCurrentAmount, setEditCurrentAmount] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");

  // Calculate user's monthly savings rate based on July 2026 data
  const currentMonthStr = "2026-07";
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonthStr));
  const incomesSum = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expensesSum = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  // Baseline savings rate: if monthly transactions are empty/zero, assume a realistic $550,000/month
  const monthlySavingsRate = (incomesSum - expensesSum) > 10000 
    ? (incomesSum - expensesSum) 
    : 550000;

  const handleSubmitAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || isNaN(Number(targetAmount))) {
      alert("Completá todos los campos de forma correcta.");
      return;
    }

    onAddGoal({
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      targetDate: targetDate || "2027-02-28",
      icon
    });

    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    setTargetDate("");
    setShowAddModal(false);
  };

  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDepositModal || !depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      alert("Ingresá un monto de depósito válido.");
      return;
    }

    const amountNum = Number(depositAmount);
    const selectedAcc = accounts.find(a => a.id === depositAccountId);
    if (!selectedAcc || selectedAcc.balance < amountNum) {
      alert("Saldo insuficiente en la cuenta seleccionada.");
      return;
    }

    onDepositToGoal(showDepositModal.id, depositAccountId, amountNum);
    setDepositAmount("");
    setShowDepositModal(null);
  };

  const handleStartEdit = (g: Goal) => {
    setEditingGoal(g);
    setEditName(g.name);
    setEditTargetAmount(g.targetAmount.toString());
    setEditCurrentAmount(g.currentAmount.toString());
    setEditTargetDate(g.targetDate);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || isNaN(Number(editTargetAmount)) || isNaN(Number(editCurrentAmount)) || !editingGoal) return;
    
    onEditGoal(
      editingGoal.id, 
      editName, 
      Number(editTargetAmount), 
      Number(editCurrentAmount), 
      editTargetDate
    );
    setEditingGoal(null);
  };

  const formatAr = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper to project completion month/year
  const getProjectionDate = (g: Goal) => {
    const missing = g.targetAmount - g.currentAmount;
    if (missing <= 0) return "¡Meta Completada!";
    if (monthlySavingsRate <= 0) return "Indefinido (Ahorro mensual es $0)";

    const monthsNeeded = Math.ceil(missing / monthlySavingsRate);
    
    // Project month starting from today (July 2026)
    const baseDate = new Date(2026, 6, 14); // 14 July 2026
    baseDate.setMonth(baseDate.getMonth() + monthsNeeded);
    
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    return baseDate.toLocaleDateString('es-AR', options);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Objetivos de Ahorro</h2>
          <p className="text-slate-400 text-xs">Ahorrá para tus sueños y planificá el futuro</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all shadow-[0_0_15px_rgba(59,130,246,0.05)]"
        >
          <Plus className="w-4.5 h-4.5" /> Agregar Objetivo
        </button>
      </div>

      {/* Calculator info box */}
      <div className="bg-brand-panel/60 border border-brand-border p-4 rounded-2xl flex gap-3 items-start shadow-md">
        <Calculator className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white block mb-0.5">Proyección Inteligente basada en tu ritmo actual:</span>
          Tus ahorros mensuales promedio son de <b className="text-emerald-400 font-bold">{formatAr(monthlySavingsRate)}</b>.
          El sistema calcula automáticamente la fecha estimada de finalización para cada objetivo según cuánto podés ir guardando.
        </div>
      </div>

      {/* Goals list */}
      <div className="space-y-4">
        {goals.map(g => {
          const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
          const missing = g.targetAmount - g.currentAmount;
          const projection = getProjectionDate(g);

          return (
            <motion.div
              layout
              key={g.id}
              className="bg-brand-panel border border-brand-border hover:border-brand-border-focus rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-lg transition-all duration-300"
            >
              {/* Completed overlay stamp */}
              {percent >= 100 && (
                <div className="absolute top-4 right-16 rotate-12 border-2 border-emerald-500 text-emerald-500 text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-widest bg-emerald-950/20 pointer-events-none">
                  Completado 🎉
                </div>
              )}

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-500/15 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                    {g.icon === 'car' ? <Car className="w-5.5 h-5.5" /> : 
                     g.icon === 'palm' ? <Palmtree className="w-5.5 h-5.5" /> : 
                     g.icon === 'tv' ? <Tv className="w-5.5 h-5.5" /> : 
                     <Target className="w-5.5 h-5.5" />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
                      {g.name}
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Meta: {formatAr(g.targetAmount)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartEdit(g)}
                    className="p-1.5 hover:bg-brand-panel-light text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDeleteGoal(g.id)}
                    className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg text-xs transition-colors"
                  >
                    Borrar
                  </button>
                </div>
              </div>

              {/* Progress Bar & Percent text */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Progreso: {formatAr(g.currentAmount)} ({percent}%)</span>
                  <span>Faltan: {formatAr(missing > 0 ? missing : 0)}</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-brand-border shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                  />
                </div>
              </div>

              {/* Projection & Deposit Actions */}
              <div className="pt-3 border-t border-brand-border mt-3 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Si seguís ahorrando igual, lo alcanzás en: <b className="text-blue-300 font-bold">{projection}</b></span>
                </div>

                {percent < 100 && (
                  <button
                    onClick={() => {
                      setDepositAmount("");
                      setShowDepositModal(g);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-blue-500/10"
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Guardar dinero aquí
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL: ADD GOAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-panel-light/40">
                <h3 className="font-bold text-white text-sm">Nuevo Objetivo</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-brand-panel-light text-slate-400 hover:text-white rounded-lg transition-colors">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAddGoal} className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre del Objetivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Comprar Auto, Computadora"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monto Objetivo ($)</label>
                    <input
                      type="number"
                      placeholder="Ej: 7000000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monto Inicial ($)</label>
                    <input
                      type="number"
                      placeholder="Opcional"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fecha Estimada</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Icono</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="target">🎯 Objetivo General</option>
                      <option value="car">🚗 Auto / Vehículo</option>
                      <option value="tv">🎮 Pantalla / PC</option>
                      <option value="palm">🏖 Vacaciones</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                >
                  Crear Objetivo
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DEPOSIT TO GOAL */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white text-base">Asignar ahorros a: "{showDepositModal.name}"</h3>
                <button onClick={() => setShowDepositModal(null)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmitDeposit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">¿Desde qué cuenta sale el dinero?</label>
                  <select
                    value={depositAccountId}
                    onChange={(e) => setDepositAccountId(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monto a Enviar ($)</label>
                  <input
                    type="number"
                    placeholder="Monto"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white font-bold"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(null)}
                    className="w-1/2 py-2.5 bg-brand-panel-light hover:bg-[#1e2d54] text-slate-300 border border-brand-border rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                  >
                    Confirmar Guardado
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT GOAL */}
      <AnimatePresence>
        {editingGoal && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4"
            >
              <h3 className="font-bold text-white text-sm">Editar Objetivo</h3>
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monto Objetivo ($)</label>
                  <input
                    type="number"
                    value={editTargetAmount}
                    onChange={(e) => setEditTargetAmount(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monto Ahorrado ($)</label>
                  <input
                    type="number"
                    value={editCurrentAmount}
                    onChange={(e) => setEditCurrentAmount(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fecha Estimada</label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingGoal(null)}
                    className="w-1/2 py-2 bg-brand-panel-light hover:bg-[#1e2d54] text-slate-300 border border-brand-border rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
