import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Minus,
  Sparkles
} from "lucide-react";
import { Transaction } from "../types";

interface CalendarViewProps {
  transactions: Transaction[];
}

export default function CalendarView({ transactions }: CalendarViewProps) {
  // Fix view on July 2026 based on timestamp
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July is month index 6 (0-indexed)

  const [selectedDay, setSelectedDay] = useState<number | null>(14); // Default to selected 14 July

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday, 1 is Monday

  // Format month string YYYY-MM
  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Helper to get daily statistics
  const getDayStats = (day: number) => {
    const dayStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    const dayTransactions = transactions.filter(t => t.date === dayStr);

    const incomes = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = incomes - expenses;

    return {
      transactions: dayTransactions,
      incomes,
      expenses,
      balance,
      hasMovement: dayTransactions.length > 0
    };
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  // Generate blank cells for day offset
  const blankCells = Array(firstDayIndex).fill(null);
  const monthCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Selected Day Details
  const selectedStats = selectedDay ? getDayStats(selectedDay) : null;
  const selectedDateStr = selectedDay ? `${selectedDay} de ${months[currentMonth]} ${currentYear}` : "";

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
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">Calendario de Gastos</h2>
        <p className="text-slate-400 text-xs">Monitoreá balances diarios y recordá tus consumos</p>
      </div>

      {/* Grid Layout (Left: Calendar, Right: Day Details) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Calendar Board */}
        <div className="bg-brand-panel border border-brand-border rounded-3xl p-5 md:col-span-2 space-y-4 shadow-xl">
          <div className="flex justify-between items-center bg-brand-bg/40 p-3 rounded-2xl border border-brand-border/40">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-brand-panel-light text-slate-400 hover:text-white rounded-lg cursor-pointer transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              {months[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-brand-panel-light text-slate-400 hover:text-white rounded-lg cursor-pointer transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday names */}
          <div className="grid grid-cols-7 gap-1 text-center text-slate-500 font-bold text-[10px] uppercase tracking-wider">
            <span>Dom</span>
            <span>Lun</span>
            <span>Mar</span>
            <span>Mie</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sab</span>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {blankCells.map((_, idx) => (
              <div key={`blank-${idx}`} className="aspect-square bg-transparent" />
            ))}

            {monthCells.map((day) => {
              const stats = getDayStats(day);
              const isSelected = selectedDay === day;

              // Color classes based on net balance
              let cellColor = "bg-brand-bg/40 border-brand-border/60 hover:border-brand-border-focus text-slate-300";
              let dotColor = null;

              if (stats.hasMovement) {
                if (stats.balance > 0) {
                  cellColor = "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400";
                  dotColor = "bg-emerald-400";
                } else if (stats.balance < 0) {
                  cellColor = "bg-rose-500/5 border-rose-500/30 hover:border-rose-500/60 text-rose-400";
                  dotColor = "bg-rose-400";
                } else {
                  cellColor = "bg-brand-panel border-brand-border hover:border-brand-border-focus text-slate-300";
                  dotColor = "bg-slate-400";
                }
              }

              if (isSelected) {
                cellColor = "bg-blue-600 border-blue-400 text-white font-black shadow-lg shadow-blue-500/20";
              }

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative p-1 transition-all cursor-pointer ${cellColor}`}
                >
                  <span className="text-xs md:text-sm font-bold">{day}</span>
                  {dotColor && !isSelected && (
                    <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${dotColor}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Color Key Guide */}
          <div className="flex gap-4 justify-center text-[10px] font-semibold text-slate-400 pt-2 border-t border-brand-border">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full" /> Ganaste Dinero</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500/20 border border-rose-500/30 rounded-full" /> Gastaste Dinero</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-brand-bg border border-brand-border rounded-full" /> Sin movimientos</span>
          </div>
        </div>

        {/* Right Side: Selected Day Log drawer */}
        <div className="bg-brand-panel border border-brand-border rounded-3xl p-5 flex flex-col justify-between shadow-xl">
          {selectedStats ? (
            <div className="space-y-4">
              <div className="border-b border-brand-border/80 pb-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Detalles del Día</span>
                <h3 className="text-white font-bold text-sm mt-0.5">{selectedDateStr}</h3>
              </div>

              {/* Incomes & Expenses aggregate card */}
              <div className="grid grid-cols-2 gap-2 bg-brand-bg/40 p-3 rounded-2xl border border-brand-border/40">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ingresos</span>
                  <span className="text-emerald-400 font-bold text-xs">+{formatAr(selectedStats.incomes)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Gastos</span>
                  <span className="text-rose-400 font-bold text-xs">-{formatAr(selectedStats.expenses)}</span>
                </div>
              </div>

              {/* Day Net Balance */}
              <div className="p-3 bg-brand-bg/20 rounded-2xl border border-brand-border flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Balance Diario:</span>
                <span className={`font-bold text-sm tracking-tight ${selectedStats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedStats.balance >= 0 ? "+" : ""}{formatAr(selectedStats.balance)}
                </span>
              </div>

              {/* Movement logs */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Movimientos del Día ({selectedStats.transactions.length})</span>
                {selectedStats.transactions.length === 0 ? (
                  <p className="text-slate-500 text-xs italic py-4 text-center">Tranqui, hoy no se registraron movimientos.</p>
                ) : (
                  selectedStats.transactions.map(tx => (
                    <div 
                      key={tx.id}
                      className="bg-brand-bg/60 p-2.5 rounded-xl border border-brand-border/40 flex justify-between items-center text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-6 rounded-full ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div>
                          <p className="font-semibold text-slate-200 leading-tight">{tx.description}</p>
                          <span className="text-[10px] text-slate-500">{tx.category}</span>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatAr(tx.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
              <CalendarIcon className="w-8 h-8 text-slate-500 animate-bounce" />
              <p className="text-slate-400 text-xs">Seleccioná un día del calendario para auditar los consumos registrados.</p>
            </div>
          )}

          <div className="bg-blue-600/10 border border-blue-500/10 p-3 rounded-2xl flex gap-2 items-center text-[10px] text-blue-300 mt-4">
            <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
            <span>Sincronizado: Los balances cambian de color en tiempo real para alertarte.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
