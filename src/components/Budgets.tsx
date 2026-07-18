import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles,
  Info
} from "lucide-react";
import { Budget, Transaction } from "../types";

interface BudgetsProps {
  budgets: Budget[];
  transactions: Transaction[];
  onAddBudget: (b: Omit<Budget, 'id'>) => void;
  onEditBudget: (id: string, limitAmount: number) => void;
  onDeleteBudget: (id: string) => void;
}

const CATEGORIES_EXPENSE = [
  "Comida", "Nafta", "Regalos", "Ropa", "Steam", "Salida", "Auto", "Casa", "Otros"
];

export default function Budgets({
  budgets,
  transactions,
  onAddBudget,
  onEditBudget,
  onDeleteBudget
}: BudgetsProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Budget form state
  const [category, setCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  // Edit states
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editLimitAmount, setEditLimitAmount] = useState("");

  const currentMonthStr = "2026-07";

  // Calculate actual expenditure for each budget's category in the current month
  const getSpentAmountForCategory = (cat: string) => {
    return transactions
      .filter(t => t.type === 'expense' && t.category === cat && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleSubmitAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !limitAmount || isNaN(Number(limitAmount))) {
      alert("Completá todos los campos.");
      return;
    }

    // Check if category budget already exists
    const exists = budgets.some(b => b.category === category);
    if (exists) {
      alert("Ya existe un presupuesto para esa categoría. Editá el existente.");
      return;
    }

    onAddBudget({
      category,
      limitAmount: Number(limitAmount)
    });

    setCategory("");
    setLimitAmount("");
    setShowAddModal(false);
  };

  const handleStartEdit = (b: Budget) => {
    setEditingBudgetId(b.id);
    setEditLimitAmount(b.limitAmount.toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLimitAmount || isNaN(Number(editLimitAmount)) || !editingBudgetId) return;
    onEditBudget(editingBudgetId, Number(editLimitAmount));
    setEditingBudgetId(null);
  };

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
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Presupuestos Mensuales</h2>
          <p className="text-slate-400 text-xs">Fijá límites de gastos para el mes de Julio</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all shadow-[0_0_15px_rgba(59,130,246,0.05)]"
        >
          <Plus className="w-4.5 h-4.5" /> Fijar Límite
        </button>
      </div>

      {/* Grid of Budgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.length === 0 ? (
          <div className="bg-brand-panel border border-brand-border p-8 text-center rounded-3xl col-span-2 shadow-lg">
            <p className="text-slate-500 text-sm">No definiste ningún presupuesto de gastos todavía.</p>
            <p className="text-slate-500 text-xs mt-1">Definí límites en categorías como "Comida" o "Steam" para tener alertas visuales.</p>
          </div>
        ) : (
          budgets.map(b => {
            const spent = getSpentAmountForCategory(b.category);
            const percent = Math.round((spent / b.limitAmount) * 100);
            
            // Determine alert type: <80% = green, 80-100% = yellow (advertencia), >100% = red (excedido)
            let colorClass = "bg-emerald-500";
            let textClass = "text-emerald-400";
            let bgGlow = "shadow-emerald-500/5";
            let statusLabel = "Dentro del límite";

            if (percent >= 80 && percent <= 100) {
              colorClass = "bg-amber-500";
              textClass = "text-amber-400";
              bgGlow = "shadow-amber-500/5";
              statusLabel = "⚠️ Cerca del límite";
            } else if (percent > 100) {
              colorClass = "bg-rose-500";
              textClass = "text-rose-400";
              bgGlow = "shadow-rose-500/5";
              statusLabel = "🔴 Excedido";
            }

            return (
              <motion.div
                layout
                key={b.id}
                className={`bg-brand-panel border border-brand-border hover:border-brand-border-focus rounded-3xl p-5 space-y-4 shadow-lg transition-all duration-300 ${bgGlow}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
                      {b.category}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Límite mensual: {formatAr(b.limitAmount)}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      percent > 100 ? 'bg-rose-500/10 text-rose-400' : percent >= 80 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {statusLabel}
                    </span>

                    <button
                      onClick={() => handleStartEdit(b)}
                      className="p-1.5 hover:bg-brand-panel-light text-slate-400 hover:text-white rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteBudget(b.id)}
                      className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Gastado: {formatAr(spent)} ({percent}%)</span>
                    <span className="text-slate-400">Disponible: {formatAr(Math.max(0, b.limitAmount - spent))}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-brand-border shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percent)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${colorClass}`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD BUDGET */}
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
                <h3 className="font-bold text-white text-sm">Fijar Presupuesto</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-brand-panel-light text-slate-400 hover:text-white rounded-lg transition-colors">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAddBudget} className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                    required
                  >
                    <option value="">Seleccionar Categoría</option>
                    {CATEGORIES_EXPENSE.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Límite Mensual Máximo ($)</label>
                  <input
                    type="number"
                    placeholder="Ej: 100000"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white font-bold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                >
                  Fijar Límite
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT BUDGET */}
      <AnimatePresence>
        {editingBudgetId && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4 shadow-xl"
            >
              <h3 className="font-bold text-white text-sm">Editar Presupuesto</h3>
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nuevo Límite Máximo ($)</label>
                  <input
                    type="number"
                    value={editLimitAmount}
                    onChange={(e) => setEditLimitAmount(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white font-bold"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingBudgetId(null)}
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
