import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  BarChart4, 
  PieChart, 
  TrendingUp, 
  FileSpreadsheet, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Calendar,
  Sparkles,
  Info
} from "lucide-react";
import { Transaction, Budget } from "../types";

interface StatsProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export default function Stats({ transactions, budgets }: StatsProps) {
  const [activeChart, setActiveChart] = useState<'categories' | 'comparison'>('categories');

  const currentMonthStr = "2026-07";

  // Calculations for dynamic stats
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonthStr));
  
  const incomesSum = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expensesSum = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsSum = incomesSum - expensesSum;
  const savingsRate = incomesSum > 0 ? Math.max(0, Math.round((savingsSum / incomesSum) * 100)) : 0;

  // Expenditures grouped by category
  const expensesByCategory: { [key: string]: number } = {};
  monthlyTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1]);

  const maxCategoryValue = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  // Average daily expense in July 2026 (assuming 14 days elapsed so far based on mock timestamp)
  const daysElapsed = 14;
  const avgDailyExpense = Math.round(expensesSum / daysElapsed);

  // Top category
  const topCategoryName = sortedCategories.length > 0 ? sortedCategories[0][0] : "Ninguno";
  const topCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

  // EXPORT TO EXCEL (CSV) helper
  const handleExportCSV = () => {
    // Generate CSV content
    const headers = "ID,Tipo,Monto,Categoria,Subcategoria,Cuenta,Fecha,Hora,Descripcion,Ubicacion\r\n";
    const rows = transactions.map(t => {
      return `"${t.id}","${t.type}",${t.amount},"${t.category}","${t.subcategory || ''}","${t.account}","${t.date}","${t.time || ''}","${t.description.replace(/"/g, '""')}","${t.location || ''}"`;
    }).join("\r\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mis_finanzas_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT TO PDF (Print) helper
  const handlePrintPDF = () => {
    window.print();
  };

  const formatAr = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Color mappings for category bars
  const categoryColors: { [key: string]: string } = {
    Comida: "bg-orange-500",
    Nafta: "bg-blue-500",
    Regalos: "bg-pink-500",
    Ropa: "bg-purple-500",
    Steam: "bg-indigo-500",
    Salida: "bg-cyan-500",
    Auto: "bg-sky-500",
    Casa: "bg-yellow-500",
    Otros: "bg-slate-500"
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Estadísticas y Reportes</h2>
          <p className="text-slate-400 text-xs">Análisis visual de tus gastos e ingresos del mes</p>
        </div>

        <div className="flex gap-2">
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
          </button>
          <button
            id="btn-export-pdf"
            onClick={handlePrintPDF}
            className="p-2.5 bg-brand-panel-light hover:bg-[#1e2d54] text-slate-300 border border-brand-border rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all"
          >
            <FileText className="w-4 h-4" /> Imprimir Reporte
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-panel border border-brand-border p-5 rounded-3xl space-y-2 shadow-md">
          <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wide">Promedio Gasto Diario</span>
          <p className="text-xl font-bold text-slate-100">{formatAr(avgDailyExpense)}</p>
          <span className="text-[10px] text-slate-500 block">Calculado sobre 14 días activos</span>
        </div>

        <div className="bg-brand-panel border border-brand-border p-5 rounded-3xl space-y-2 shadow-md">
          <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wide">Mayor Rubro de Gasto</span>
          <p className="text-xl font-bold text-rose-400 truncate">{topCategoryName}</p>
          <span className="text-[10px] text-slate-500 block">Consumido total: {formatAr(topCategoryAmount)}</span>
        </div>

        <div className="bg-brand-panel border border-brand-border p-5 rounded-3xl space-y-2 shadow-md">
          <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wide">Tasa de Ahorro</span>
          <p className="text-xl font-bold text-blue-400">{savingsRate}%</p>
          <span className="text-[10px] text-slate-500 block">De tus ingresos retenidos</span>
        </div>

        <div className="bg-brand-panel border border-brand-border p-5 rounded-3xl space-y-2 shadow-md">
          <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wide">Ahorro Neto Mensual</span>
          <p className={`text-xl font-bold ${savingsSum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {savingsSum >= 0 ? "+" : ""}{formatAr(savingsSum)}
          </p>
          <span className="text-[10px] text-slate-500 block">Diferencia neta total</span>
        </div>
      </div>

      {/* Charts Panel */}
      <div className="bg-brand-panel border border-brand-border rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex justify-between items-center border-b border-brand-border pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveChart('categories')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeChart === 'categories' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-brand-bg border-brand-border text-slate-400'
              }`}
            >
              Distribución de Gastos
            </button>
            <button
              onClick={() => setActiveChart('comparison')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeChart === 'comparison' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-brand-bg border-brand-border text-slate-400'
              }`}
            >
              Balance Mensual
            </button>
          </div>

          <span className="text-slate-400 text-xs font-bold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Julio 2026
          </span>
        </div>

        {/* CHART CONTENT */}
        {activeChart === 'categories' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1">
                <PieChart className="w-4 h-4 text-blue-400" /> Gastos por Categoría
              </h3>
              <span className="text-[11px] text-slate-500">Monto total gastado: {formatAr(expensesSum)}</span>
            </div>

            {sortedCategories.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Registrá algún gasto para generar el desglose por categorías.</p>
            ) : (
              <div className="space-y-3.5">
                {sortedCategories.map(([cat, val]) => {
                  const percent = Math.round((val / expensesSum) * 100);
                  const barColor = categoryColors[cat] || "bg-slate-500";

                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-200">{cat}</span>
                        <span className="text-slate-400">{formatAr(val)} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-brand-bg h-2.5 rounded-full overflow-hidden border border-brand-border/40">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={`h-full rounded-full ${barColor}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* COMPARISON CHART: Incomes vs Expenses vs Savings */
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-1">
              <BarChart4 className="w-4 h-4 text-blue-400" /> Comparativa de Saldos
            </h3>

            <div className="grid grid-cols-3 gap-4 items-end h-48 bg-brand-bg/40 p-5 rounded-2xl border border-brand-border/40">
              
              {/* Incomes bar */}
              <div className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-[10px] text-slate-400 font-bold">{formatAr(incomesSum)}</div>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: incomesSum > 0 ? '70%' : '5%' }}
                  className="w-full max-w-[40px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg shadow-lg shadow-emerald-500/10"
                />
                <span className="text-slate-300 font-bold text-[10px] uppercase">Ingresos</span>
              </div>

              {/* Expenses bar */}
              <div className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-[10px] text-slate-400 font-bold">{formatAr(expensesSum)}</div>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: incomesSum > 0 ? `${Math.round((expensesSum / incomesSum) * 70)}%` : '5%' }}
                  className="w-full max-w-[40px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-lg shadow-lg shadow-rose-500/10"
                />
                <span className="text-slate-300 font-bold text-[10px] uppercase">Gastos</span>
              </div>

              {/* Savings bar */}
              <div className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-[10px] text-slate-400 font-bold">{formatAr(savingsSum)}</div>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: incomesSum > 0 ? `${Math.round((Math.max(0, savingsSum) / incomesSum) * 70)}%` : '5%' }}
                  className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg shadow-lg shadow-blue-500/10"
                />
                <span className="text-slate-300 font-bold text-[10px] uppercase">Ahorro</span>
              </div>

            </div>

            <div className="text-xs text-slate-400 bg-brand-bg/20 p-3 rounded-xl border border-brand-border/40 flex gap-2 items-center">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Llevás ahorrado un <b className="text-emerald-400 font-bold">{savingsRate}%</b> de tus ingresos de este mes. ¡Ahorrar más de un 30% mensual se considera un excelente ritmo!</span>
            </div>
          </div>
        )}
      </div>

      {/* Backups Information */}
      <div className="bg-brand-panel border border-brand-border p-4 rounded-3xl flex gap-3 items-center shadow-md">
        <Info className="w-5 h-5 text-blue-400 shrink-0" />
        <div className="text-xs text-slate-400 leading-normal">
          <b>Resguardo automático:</b> Toda la base de datos se guarda en la nube automáticamente en tiempo real. Al exportar a Excel, descargás un backup unificado que podés abrir en Microsoft Excel o Google Sheets en cualquier momento.
        </div>
      </div>
    </div>
  );
}
