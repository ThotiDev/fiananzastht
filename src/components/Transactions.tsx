import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Trash2, 
  Edit3, 
  Calendar, 
  Plus, 
  X, 
  Upload, 
  MapPin, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Copy
} from "lucide-react";
import { Transaction, Account, FutureExpense } from "../types";

interface TransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  futureExpenses: FutureExpense[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onEditTransaction: (id: string, tx: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddFutureExpense: (fe: Omit<FutureExpense, 'id'>) => void;
  onToggleFutureExpense: (id: string) => void;
  onDeleteFutureExpense: (id: string) => void;
  onConvertFutureToReal: (fe: FutureExpense, accountId: string) => void;
  openAddModal: 'none' | 'income' | 'expense';
  setOpenAddModal: (val: 'none' | 'income' | 'expense') => void;
}

const CATEGORIES_EXPENSE = [
  "Comida", "Nafta", "Regalos", "Ropa", "Steam", "Salida", "Auto", "Casa", "Otros"
];

const CATEGORIES_INCOME = [
  "Sueldo", "Propinas", "Regalos", "Venta", "Otros"
];

export default function Transactions({
  transactions,
  accounts,
  futureExpenses,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onAddFutureExpense,
  onToggleFutureExpense,
  onDeleteFutureExpense,
  onConvertFutureToReal,
  openAddModal,
  setOpenAddModal
}: TransactionsProps) {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState("all");

  // Editing state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Delete Confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteFutureId, setConfirmDeleteFutureId] = useState<string | null>(null);

  // Add Transaction Form States
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [subcategory, setSubcategory] = useState("");
  const [location, setLocation] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Future expense form state
  const [showAddFuture, setShowAddFuture] = useState(false);
  const [futureTitle, setFutureTitle] = useState("");
  const [futureAmount, setFutureAmount] = useState("");
  const [futureDueDate, setFutureDueDate] = useState("");
  const [futureRemindDays, setFutureRemindDays] = useState("5");
  const [futureConversionItem, setFutureConversionItem] = useState<FutureExpense | null>(null);
  const [conversionAccountId, setConversionAccountId] = useState(accounts[0]?.id || "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sort transactions by date and time descending
  const sortedTransactions = [...transactions].sort((a, b) => {
    const datetimeA = `${a.date}T${a.time || '00:00'}`;
    const datetimeB = `${b.date}T${b.time || '00:00'}`;
    return datetimeB.localeCompare(datetimeA);
  });

  // Filter transactions
  const filteredTransactions = sortedTransactions.filter(t => {
    const matchesSearch = 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.subcategory && t.subcategory.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Handle Drag-and-Drop for Receipt
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Generate simulated URL path or reader
    const reader = new FileReader();
    reader.onloadend = () => {
      // Set to base64 preview
      setReceiptUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Reset form states
  const resetForm = () => {
    setAmount("");
    setCategory("");
    setDescription("");
    setAccountId(accounts[0]?.id || "");
    setDate(new Date().toISOString().split('T')[0]);
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setSubcategory("");
    setLocation("");
    setReceiptUrl("");
    setEditingTransaction(null);
  };

  // Submit dynamic transaction
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !category) {
      alert("Por favor, ingresá un monto válido y seleccioná una categoría.");
      return;
    }

    const txPayload = {
      type: openAddModal === 'income' ? 'income' as const : 'expense' as const,
      amount: Number(amount),
      category,
      description: description || category,
      account: accountId,
      date,
      time,
      subcategory,
      location,
      receiptUrl
    };

    if (editingTransaction) {
      onEditTransaction(editingTransaction.id, txPayload);
    } else {
      onAddTransaction(txPayload);
    }

    setOpenAddModal('none');
    resetForm();
  };

  // Submit future expense
  const handleSubmitFutureExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!futureTitle || !futureAmount || isNaN(Number(futureAmount))) {
      alert("Completá título y monto válidos.");
      return;
    }

    onAddFutureExpense({
      title: futureTitle,
      amount: Number(futureAmount),
      dueDate: futureDueDate || new Date().toISOString().split('T')[0],
      remindDaysBefore: Number(futureRemindDays),
      completed: false
    });

    setFutureTitle("");
    setFutureAmount("");
    setFutureDueDate("");
    setShowAddFuture(false);
  };

  const handleStartEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setAmount(tx.amount.toString());
    setCategory(tx.category);
    setDescription(tx.description);
    setAccountId(tx.account);
    setDate(tx.date);
    setTime(tx.time || "");
    setSubcategory(tx.subcategory || "");
    setLocation(tx.location || "");
    setReceiptUrl(tx.receiptUrl || "");
    setOpenAddModal(tx.type === 'income' ? 'income' : 'expense');
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
      {/* Title & Add Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Movimientos</h2>
          <p className="text-slate-400 text-xs">Administrá y buscá tus gastos/ingresos</p>
        </div>

        <div className="flex gap-2">
          <button
            id="btn-trigger-income-modal"
            onClick={() => { resetForm(); setOpenAddModal('income'); }}
            className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)]"
          >
            <Plus className="w-4 h-4" /> Ingreso
          </button>
          <button
            id="btn-trigger-expense-modal"
            onClick={() => { resetForm(); setOpenAddModal('expense'); }}
            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all shadow-[0_0_15px_rgba(244,63,94,0.05)]"
          >
            <Plus className="w-4 h-4" /> Gasto
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-panel border border-brand-border rounded-2xl p-4 space-y-3 shadow-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            id="tx-search"
            type="text"
            placeholder="Buscar por descripción, categoría, etc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 transition-all"
          />
        </div>

        <div className="flex gap-2 flex-wrap text-xs font-semibold">
          {/* Type selectors */}
          <button 
            onClick={() => { setFilterType('all'); setFilterCategory('all'); }}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${filterType === 'all' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-brand-bg border-brand-border text-slate-400 hover:text-slate-200 hover:border-brand-border-focus'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => { setFilterType('income'); setFilterCategory('all'); }}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${filterType === 'income' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-brand-bg border-brand-border text-slate-400 hover:text-slate-200 hover:border-brand-border-focus'}`}
          >
            Ingresos
          </button>
          <button 
            onClick={() => { setFilterType('expense'); setFilterCategory('all'); }}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${filterType === 'expense' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-brand-bg border-brand-border text-slate-400 hover:text-slate-200 hover:border-brand-border-focus'}`}
          >
            Gastos
          </button>

          {/* Quick Category filter */}
          {filterType !== 'all' && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-lg px-2.5 py-1 text-slate-300 font-semibold cursor-pointer transition-all"
            >
              <option value="all">Categorías (Todas)</option>
              {(filterType === 'expense' ? CATEGORIES_EXPENSE : CATEGORIES_INCOME).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Historial de Movimientos ({filteredTransactions.length})</span>
        </div>

        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="bg-brand-panel border border-brand-border rounded-2xl p-8 text-center shadow-md">
              <p className="text-slate-500 text-sm">No se encontraron movimientos que coincidan con la búsqueda.</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const account = accounts.find(a => a.id === tx.account);
              return (
                <motion.div
                  layout
                  key={tx.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-brand-panel border border-brand-border hover:border-brand-border-focus p-4 rounded-2xl flex justify-between items-center group transition-all duration-300 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-slate-100 font-semibold text-sm">{tx.description}</h4>
                        {tx.receiptUrl && (
                          <span className="px-1.5 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-md text-[9px] font-bold flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> Ticket
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs mt-0.5">
                        <span className="font-semibold text-slate-300">{tx.category}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                        {account && (
                          <>
                            <span>•</span>
                            <span 
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              style={{ backgroundColor: `${account.color}20`, color: account.color }}
                            >
                              {account.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`font-bold text-sm md:text-base tracking-tight ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {tx.type === 'income' ? "+" : "-"}{formatAr(tx.amount)}
                    </span>

                    {/* Actions on hover/active */}
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleStartEdit(tx)}
                        className="p-1.5 hover:bg-brand-panel-light text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(tx.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Gastos Futuros (Reminders) Section */}
      <div className="pt-4 border-t border-brand-border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-slate-200 text-sm tracking-wide">Gastos Futuros & Recordatorios</h3>
            <p className="text-[11px] text-slate-400">Anotá tus gastos previstos para que no se te pasen</p>
          </div>
          <button
            id="btn-toggle-future-form"
            onClick={() => setShowAddFuture(!showAddFuture)}
            className="px-2.5 py-1.5 bg-brand-panel-light hover:bg-[#1e2d54] text-slate-300 border border-brand-border rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
          >
            {showAddFuture ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddFuture ? "Cerrar" : "Agendar"}
          </button>
        </div>

        {/* Add Future Expense Form */}
        {showAddFuture && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmitFutureExpense}
            className="bg-brand-panel border border-brand-border p-4 rounded-2xl mb-4 space-y-3 shadow-lg"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Título / Recordatorio</label>
                <input
                  type="text"
                  placeholder="Ej: Cumple mamá"
                  value={futureTitle}
                  onChange={(e) => setFutureTitle(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monto aproximado</label>
                <input
                  type="number"
                  placeholder="Monto"
                  value={futureAmount}
                  onChange={(e) => setFutureAmount(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fecha límite</label>
                <input
                  type="date"
                  value={futureDueDate}
                  onChange={(e) => setFutureDueDate(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white text-center"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recordar días antes</label>
                <select
                  value={futureRemindDays}
                  onChange={(e) => setFutureRemindDays(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="1">1 día antes</option>
                  <option value="3">3 días antes</option>
                  <option value="5">5 días antes</option>
                  <option value="7">1 semana antes</option>
                </select>
              </div>
            </div>

            <button
              id="btn-save-future-expense"
              type="submit"
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10"
            >
              Guardar Recordatorio
            </button>
          </motion.form>
        )}

        {/* Future Expenses list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {futureExpenses.filter(fe => !fe.completed).length === 0 ? (
            <p className="text-slate-500 text-xs py-2 text-center col-span-2">No hay gastos futuros agendados o sin completar.</p>
          ) : (
            futureExpenses.filter(fe => !fe.completed).map(fe => {
              const diffTime = new Date(fe.dueDate).getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isUrgent = diffDays <= fe.remindDaysBefore;

              return (
                <div 
                  key={fe.id}
                  className={`border p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 shadow-md ${
                    isUrgent ? 'bg-amber-950/20 border-amber-500/40 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.02)]' : 'bg-brand-panel border-brand-border hover:border-brand-border-focus'
                  }`}
                >
                  {isUrgent && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[8px] font-bold px-2 py-0.5 rounded-bl">
                      Próximo
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-100">{fe.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Vence el: {fe.dueDate} ({diffDays > 0 ? `Faltan ${diffDays} días` : 'Hoy o vencido'})
                      </p>
                    </div>
                    <span className="text-white font-bold text-sm tracking-tight">{formatAr(fe.amount)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-brand-border mt-2 text-xs">
                    <button
                      onClick={() => setConfirmDeleteFutureId(fe.id)}
                      className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Borrar
                    </button>

                    <button
                      onClick={() => {
                        setFutureConversionItem(fe);
                        setConversionAccountId(accounts[0]?.id || "");
                      }}
                      className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-blue-500/10"
                    >
                      <CheckCircle className="w-3 h-3" /> Convertir a gasto real
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT TRANSACTION */}
      <AnimatePresence>
        {openAddModal !== 'none' && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-brand-border flex justify-between items-center bg-brand-panel-light/40">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${openAddModal === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <h3 className="font-bold text-white tracking-wide">
                    {editingTransaction ? 'Editar' : 'Agregar'} {openAddModal === 'income' ? 'Ingreso' : 'Gasto'}
                  </h3>
                </div>
                <button 
                  onClick={() => { setOpenAddModal('none'); resetForm(); }}
                  className="p-1 hover:bg-brand-panel-light rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitTransaction} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Amount input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monto ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-500 font-semibold text-lg">$</span>
                    <input
                      id="tx-amount"
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-2xl py-3 pl-8 pr-4 text-xl font-bold text-white shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Category Selection */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Categoría</label>
                    <select
                      id="tx-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-3 text-sm text-slate-200"
                      required
                    >
                      <option value="">Seleccionar</option>
                      {(openAddModal === 'expense' ? CATEGORIES_EXPENSE : CATEGORIES_INCOME).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subcategoría (Opcional)</label>
                    <input
                      id="tx-subcategory"
                      type="text"
                      placeholder="Ej: McDonald's"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-3 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Account Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Desde Cuenta</label>
                    <select
                      id="tx-account"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-3 text-sm text-slate-200"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Descripción</label>
                    <input
                      id="tx-description"
                      type="text"
                      placeholder="Concepto corto..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-3 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Date */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fecha</label>
                    <div className="relative">
                      <Calendar className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        id="tx-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-3 pr-10 text-sm text-white text-center"
                        required
                      />
                    </div>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hora</label>
                    <div className="relative">
                      <Clock className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        id="tx-time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-3 pr-10 text-sm text-white text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ubicación (Opcional)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      id="tx-location"
                      type="text"
                      placeholder="Ej: Estación YPF Luján"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl py-2.5 pl-10 pr-4 text-sm text-white"
                    />
                  </div>
                </div>

                {/* DRAG-AND-DROP TICKET UPLOADER */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Adjuntar Ticket de Compra</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      dragActive ? 'bg-blue-500/10 border-blue-400 text-blue-300' : 'bg-brand-bg/60 border-brand-border text-slate-400 hover:border-brand-border-focus hover:text-slate-300'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {receiptUrl ? (
                      <div className="space-y-2">
                        <img 
                          src={receiptUrl} 
                          alt="Ticket Preview" 
                          referrerPolicy="no-referrer"
                          className="max-h-24 mx-auto rounded-lg border border-brand-border object-contain shadow"
                        />
                        <span className="text-[10px] text-emerald-400 font-semibold block flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Ticket cargado correctamente
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setReceiptUrl(""); }}
                          className="text-[10px] text-rose-400 font-semibold hover:underline mt-1"
                        >
                          Eliminar foto
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mb-2 text-slate-500" />
                        <p className="text-xs font-semibold text-slate-300">Arrastrá tu ticket acá o tocala para buscar</p>
                        <p className="text-[10px] text-slate-500 mt-1">Formato JPG, PNG (Opcional)</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setOpenAddModal('none'); resetForm(); }}
                    className="w-1/3 py-3 bg-brand-panel-light hover:bg-[#1e2d54] text-slate-300 border border-brand-border rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-save-transaction"
                    type="submit"
                    className={`w-2/3 py-3 font-semibold rounded-xl text-xs text-white transition-all cursor-pointer shadow-md ${
                      openAddModal === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/10'
                    }`}
                  >
                    {editingTransaction ? 'Guardar Cambios' : 'Confirmar Registro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CONVERT FUTURE EXPENSE TO REAL */}
      <AnimatePresence>
        {futureConversionItem && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-sm overflow-hidden p-5 space-y-4 shadow-2xl"
            >
              <div className="text-center">
                <AlertCircle className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                <h3 className="font-bold text-white text-lg">Convertir a Gasto Real</h3>
                <p className="text-xs text-slate-400 mt-1">Vamos a registrar "{futureConversionItem.title}" (${formatAr(futureConversionItem.amount)}) como un gasto actual.</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">¿Desde qué cuenta pagaste?</label>
                <select
                  value={conversionAccountId}
                  onChange={(e) => setConversionAccountId(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-3 text-sm text-slate-200"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFutureConversionItem(null)}
                  className="w-1/2 py-2.5 bg-brand-panel-light hover:bg-[#1e2d54] text-slate-300 border border-brand-border rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onConvertFutureToReal(futureConversionItem, conversionAccountId);
                    setFutureConversionItem(null);
                  }}
                  className="w-1/2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-blue-500/10"
                >
                  Confirmar Gasto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODALS (REAL & FUTURE TRANSACTION) */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl"
            >
              <Trash2 className="w-10 h-10 text-rose-500 mx-auto" />
              <div>
                <h3 className="font-bold text-white text-lg">¿Eliminar Movimiento?</h3>
                <p className="text-xs text-slate-400 mt-1">Esta acción es irreversible y ajustará el saldo de la cuenta asociada correspondientemente.</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-1/2 py-2.5 bg-brand-panel-light hover:bg-[#1e2d54] text-slate-300 border border-brand-border rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteTransaction(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="w-1/2 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-rose-500/10"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDeleteFutureId && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl"
            >
              <Trash2 className="w-10 h-10 text-rose-500 mx-auto" />
              <div>
                <h3 className="font-bold text-white text-lg">¿Eliminar Recordatorio?</h3>
                <p className="text-xs text-slate-400 mt-1">Se borrará permanentemente de tu lista de gastos futuros agendados.</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setConfirmDeleteFutureId(null)}
                  className="w-1/2 py-2.5 bg-brand-panel-light hover:bg-[#1e2d54] text-slate-300 border border-brand-border rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteFutureExpense(confirmDeleteFutureId);
                    setConfirmDeleteFutureId(null);
                  }}
                  className="w-1/2 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-rose-500/10"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
