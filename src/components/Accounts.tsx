import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CreditCard, 
  Wallet, 
  Building, 
  ArrowLeftRight, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  PenTool, 
  Trash2,
  CheckCircle2
} from "lucide-react";
import { Account, Transaction } from "../types";

interface AccountsProps {
  accounts: Account[];
  transactions: Transaction[];
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onEditAccount: (id: string, name: string, balance: number, color: string) => void;
  onDeleteAccount: (id: string) => void;
  onTransferMoney: (fromId: string, toId: string, amount: number) => void;
}

export default function Accounts({
  accounts,
  transactions,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onTransferMoney
}: AccountsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Add Account form state
  const [name, setName] = useState("");
  const [type, setType] = useState<'cash' | 'bank' | 'digital' | 'other'>("cash");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState("#3b82f6");

  // Transfer form state
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  // Edit / Delete states
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBalance, setEditBalance] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmitAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance || isNaN(Number(balance))) {
      alert("Por favor ingresá datos válidos.");
      return;
    }

    onAddAccount({
      name,
      type,
      balance: Number(balance),
      color
    });

    setName("");
    setBalance("");
    setShowAddModal(false);
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccount || !toAccount || !transferAmount || isNaN(Number(transferAmount))) {
      alert("Completá todos los campos.");
      return;
    }
    if (fromAccount === toAccount) {
      alert("La cuenta de origen y destino deben ser distintas.");
      return;
    }

    const amountNum = Number(transferAmount);
    const sourceAcc = accounts.find(a => a.id === fromAccount);
    if (sourceAcc && sourceAcc.balance < amountNum) {
      alert("Saldo insuficiente en la cuenta de origen.");
      return;
    }

    onTransferMoney(fromAccount, toAccount, amountNum);
    setTransferAmount("");
    setShowTransferModal(false);
  };

  const handleStartEdit = (acc: Account) => {
    setEditingAccountId(acc.id);
    setEditName(acc.name);
    setEditBalance(acc.balance.toString());
    setEditColor(acc.color || "#3b82f6");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || isNaN(Number(editBalance)) || !editingAccountId) return;
    onEditAccount(editingAccountId, editName, Number(editBalance), editColor);
    setEditingAccountId(null);
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
      {/* Title & Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Cuentas y Saldos</h2>
          <p className="text-slate-400 text-xs">Ubicación y distribución de tu dinero</p>
        </div>

        <div className="flex gap-2">
          <button
            id="btn-transfer"
            onClick={() => {
              setFromAccount(accounts[0]?.id || "");
              setToAccount(accounts[1]?.id || "");
              setShowTransferModal(true);
            }}
            className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all shadow-[0_0_15px_rgba(59,130,246,0.05)]"
          >
            <ArrowLeftRight className="w-4 h-4" /> Transferir
          </button>
          <button
            id="btn-add-account"
            onClick={() => setShowAddModal(true)}
            className="p-2.5 bg-brand-panel-light hover:bg-[#1e2d54] text-white rounded-xl border border-brand-border flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Nueva Cuenta
          </button>
        </div>
      </div>

      {/* Grid Accounts Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {accounts.map(acc => {
          // Calculate historical transactions for this account
          const accTransactions = transactions.filter(t => t.account === acc.id);
          const totalIncomes = accTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const totalExpenses = accTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

          return (
            <motion.div
              layout
              key={acc.id}
              className="bg-brand-panel border border-brand-border rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-blue-500/2 hover:border-brand-border-focus transition-all duration-300"
            >
              {/* Top border colored glow */}
              <div 
                className="absolute top-0 left-0 right-0 h-1" 
                style={{ backgroundColor: acc.color || '#3b82f6' }}
              />

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: `${acc.color || '#3b82f6'}22`, color: acc.color }}
                  >
                    {acc.type === 'cash' && <Wallet className="w-4.5 h-4.5" />}
                    {acc.type === 'bank' && <Building className="w-4.5 h-4.5" />}
                    {acc.type === 'digital' && <CreditCard className="w-4.5 h-4.5" />}
                    {acc.type === 'other' && <ArrowLeftRight className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm tracking-wide">{acc.name}</h3>
                    <p className="text-[10px] text-slate-400 capitalize">{acc.type === 'digital' ? 'Fintech/Virtual' : acc.type === 'bank' ? 'Banco' : 'Efectivo'}</p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button 
                    onClick={() => handleStartEdit(acc)}
                    className="p-1 hover:bg-brand-panel-light text-slate-400 hover:text-white rounded transition-colors"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteId(acc.id)}
                    className="p-1 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="my-2">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Saldo Actual</p>
                <p className="text-2xl font-bold text-white tracking-tight leading-none mt-1">
                  {formatAr(acc.balance)}
                </p>
              </div>

              <div className="pt-3 border-t border-brand-border mt-3 grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-400">
                <div>
                  <span className="flex items-center gap-1 text-emerald-400"><TrendingUp className="w-3 h-3" /> Ingre:</span>
                  <span className="text-slate-200">{formatAr(totalIncomes)}</span>
                </div>
                <div>
                  <span className="flex items-center gap-1 text-rose-400"><TrendingDown className="w-3 h-3" /> Gasto:</span>
                  <span className="text-slate-200">{formatAr(totalExpenses)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL: ADD ACCOUNT */}
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
                <h3 className="font-bold text-white text-sm">Nueva Cuenta</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-brand-panel-light text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAddAccount} className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre de Cuenta</label>
                  <input
                    type="text"
                    placeholder="Ej: Mercado Pago, Banco Nación"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="bank">Banco / CBU</option>
                      <option value="digital">Billetera Virtual</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Color Identificador</label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full h-9 bg-brand-bg border border-brand-border rounded-xl p-1 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Saldo Inicial ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white font-bold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                >
                  Crear Cuenta
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: TRANSFER MONEY */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-panel-light/40">
                <h3 className="font-bold text-white text-sm flex items-center gap-1">
                  <ArrowLeftRight className="w-4.5 h-4.5 text-blue-400" /> Transferir entre cuentas
                </h3>
                <button 
                  onClick={() => setShowTransferModal(false)}
                  className="p-1 hover:bg-brand-panel-light text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmitTransfer} className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Origen (Sale)</label>
                  <select
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Destino (Entra)</label>
                  <select
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monto a Transferir ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white font-bold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                >
                  Confirmar Transferencia
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT ACCOUNT */}
      <AnimatePresence>
        {editingAccountId && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4"
            >
              <h3 className="font-bold text-white text-sm">Editar Cuenta</h3>
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Saldo ($)</label>
                    <input
                      type="number"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-border-focus focus:outline-none rounded-xl p-2.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Color</label>
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-full h-9 bg-brand-bg border border-brand-border rounded-xl p-1 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingAccountId(null)}
                    className="w-1/2 py-2 bg-brand-panel-light hover:bg-[#1e2d54] text-slate-300 border border-brand-border rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE ACCOUNT */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-panel border border-brand-border rounded-3xl w-full max-w-sm p-6 text-center space-y-4 z-50 shadow-2xl"
            >
              <Trash2 className="w-10 h-10 text-rose-500 mx-auto" />
              <div>
                <h3 className="font-bold text-white text-lg">¿Eliminar Cuenta?</h3>
                <p className="text-xs text-slate-400 mt-1">Se borrará permanentemente. Nota: Las transacciones asociadas seguirán existiendo pero perderán su etiqueta de cuenta activa.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-1/2 py-2.5 bg-brand-panel-light hover:bg-[#1e2d54] text-slate-300 border border-brand-border rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteAccount(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="w-1/2 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-rose-500/10"
                >
                  Confirmar Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
