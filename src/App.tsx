import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, 
  ArrowLeftRight, 
  Wallet, 
  Car, 
  PieChart, 
  Calendar, 
  BarChart2, 
  CloudCheck,
  Cloud,
  RefreshCw,
  Sparkles,
  User,
  LogOut,
  Moon
} from "lucide-react";
import { FinanceData, Transaction, Account, Goal, Budget, FutureExpense } from "./types";
import { fetchFinanceData, saveFinanceData } from "./utils/api";

// Subcomponents
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Accounts from "./components/Accounts";
import Goals from "./components/Goals";
import Budgets from "./components/Budgets";
import CalendarView from "./components/CalendarView";
import Stats from "./components/Stats";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [openQuickModal, setOpenQuickModal] = useState<'none' | 'income' | 'expense'>('none');

  // Load finance data on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      const loadedData = await fetchFinanceData();
      setData(loadedData);
      setLoading(false);
    }
    load();
  }, []);

  // Sync back to database whenever data state changes
  const syncData = async (updatedData: FinanceData) => {
    setSyncStatus('syncing');
    const success = await saveFinanceData(updatedData);
    if (success) {
      setSyncStatus('synced');
    } else {
      setSyncStatus('offline');
    }
  };

  if (loading || !data) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 z-50">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <Sparkles className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-slate-400 text-sm font-semibold tracking-wider animate-pulse uppercase">Cargando tu Centro Financiero...</p>
      </div>
    );
  }

  // Transaction Actions
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const txId = "t-" + Date.now();
    const createdTx: Transaction = { id: txId, ...newTx };

    // Update account balance
    const updatedAccounts = data.accounts.map(acc => {
      if (acc.id === newTx.account) {
        const adjustment = newTx.type === 'income' ? newTx.amount : -newTx.amount;
        return { ...acc, balance: acc.balance + adjustment };
      }
      return acc;
    });

    // If category is "Auto", contribute to Auto Goal
    let updatedGoals = [...data.goals];
    if (newTx.category === "Auto" && newTx.type === "expense") {
      updatedGoals = data.goals.map(goal => {
        if (goal.name.toLowerCase().includes('auto')) {
          return { ...goal, currentAmount: goal.currentAmount + newTx.amount };
        }
        return goal;
      });
    }

    const updatedData: FinanceData = {
      ...data,
      transactions: [...data.transactions, createdTx],
      accounts: updatedAccounts,
      goals: updatedGoals
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleEditTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    const originalTx = data.transactions.find(t => t.id === id);
    if (!originalTx) return;

    // Revert original transaction balance effect
    let tempAccounts = data.accounts.map(acc => {
      if (acc.id === originalTx.account) {
        const revertAdjustment = originalTx.type === 'income' ? -originalTx.amount : originalTx.amount;
        return { ...acc, balance: acc.balance + revertAdjustment };
      }
      return acc;
    });

    // Apply new transaction balance effect
    const finalAccountId = updatedFields.account || originalTx.account;
    const finalAmount = updatedFields.amount !== undefined ? updatedFields.amount : originalTx.amount;
    const finalType = updatedFields.type || originalTx.type;

    tempAccounts = tempAccounts.map(acc => {
      if (acc.id === finalAccountId) {
        const applyAdjustment = finalType === 'income' ? finalAmount : -finalAmount;
        return { ...acc, balance: acc.balance + applyAdjustment };
      }
      return acc;
    });

    const updatedTransactions = data.transactions.map(t => {
      if (t.id === id) {
        return { ...t, ...updatedFields } as Transaction;
      }
      return t;
    });

    const updatedData: FinanceData = {
      ...data,
      transactions: updatedTransactions,
      accounts: tempAccounts
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleDeleteTransaction = (id: string) => {
    const originalTx = data.transactions.find(t => t.id === id);
    if (!originalTx) return;

    // Revert balance effect
    const updatedAccounts = data.accounts.map(acc => {
      if (acc.id === originalTx.account) {
        const revertAdjustment = originalTx.type === 'income' ? -originalTx.amount : originalTx.amount;
        return { ...acc, balance: acc.balance + revertAdjustment };
      }
      return acc;
    });

    const updatedTransactions = data.transactions.filter(t => t.id !== id);

    const updatedData: FinanceData = {
      ...data,
      transactions: updatedTransactions,
      accounts: updatedAccounts
    };

    setData(updatedData);
    syncData(updatedData);
  };

  // Account Actions
  const handleAddAccount = (newAcc: Omit<Account, 'id'>) => {
    const accId = "acc-" + Date.now();
    const createdAcc: Account = { id: accId, ...newAcc };

    const updatedData: FinanceData = {
      ...data,
      accounts: [...data.accounts, createdAcc]
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleEditAccount = (id: string, name: string, balance: number, color: string) => {
    const updatedAccounts = data.accounts.map(acc => {
      if (acc.id === id) {
        return { ...acc, name, balance, color };
      }
      return acc;
    });

    const updatedData: FinanceData = {
      ...data,
      accounts: updatedAccounts
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleDeleteAccount = (id: string) => {
    const updatedAccounts = data.accounts.filter(acc => acc.id !== id);
    const updatedData: FinanceData = {
      ...data,
      accounts: updatedAccounts
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleTransferMoney = (fromId: string, toId: string, amount: number) => {
    // Subtract from origin, add to destination
    const updatedAccounts = data.accounts.map(acc => {
      if (acc.id === fromId) {
        return { ...acc, balance: acc.balance - amount };
      }
      if (acc.id === toId) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    });

    const fromAcc = data.accounts.find(a => a.id === fromId);
    const toAcc = data.accounts.find(a => a.id === toId);

    // Register dynamic transfer logging in transactions
    const txId = "t-transfer-" + Date.now();
    const transferTx: Transaction = {
      id: txId,
      type: 'expense',
      amount: amount,
      category: 'Otros',
      description: `Transferencia a ${toAcc?.name || 'otra cuenta'}`,
      account: fromId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      subcategory: 'Transferencia'
    };

    const transferIncomeTx: Transaction = {
      id: txId + "-in",
      type: 'income',
      amount: amount,
      category: 'Otros',
      description: `Transferencia desde ${fromAcc?.name || 'otra cuenta'}`,
      account: toId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      subcategory: 'Transferencia'
    };

    const updatedData: FinanceData = {
      ...data,
      accounts: updatedAccounts,
      transactions: [...data.transactions, transferTx, transferIncomeTx]
    };

    setData(updatedData);
    syncData(updatedData);
  };

  // Goal Actions
  const handleAddGoal = (newGoal: Omit<Goal, 'id'>) => {
    const goalId = "g-" + Date.now();
    const createdGoal: Goal = { id: goalId, ...newGoal };

    const updatedData: FinanceData = {
      ...data,
      goals: [...data.goals, createdGoal]
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleEditGoal = (id: string, name: string, targetAmount: number, currentAmount: number, targetDate: string) => {
    const updatedGoals = data.goals.map(g => {
      if (g.id === id) {
        return { ...g, name, targetAmount, currentAmount, targetDate };
      }
      return g;
    });

    const updatedData: FinanceData = {
      ...data,
      goals: updatedGoals
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleDeleteGoal = (id: string) => {
    const updatedGoals = data.goals.filter(g => g.id !== id);
    const updatedData: FinanceData = {
      ...data,
      goals: updatedGoals
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleDepositToGoal = (goalId: string, accountId: string, amount: number) => {
    // Subtract from designated account, add to Goal
    const updatedAccounts = data.accounts.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, balance: acc.balance - amount };
      }
      return acc;
    });

    const updatedGoals = data.goals.map(g => {
      if (g.id === goalId) {
        return { ...g, currentAmount: g.currentAmount + amount };
      }
      return g;
    });

    const targetGoal = data.goals.find(g => g.id === goalId);

    // Register transaction log
    const txId = "t-dep-" + Date.now();
    const depositTx: Transaction = {
      id: txId,
      type: 'expense',
      amount: amount,
      category: 'Auto',
      description: `Ahorro asignado: ${targetGoal?.name || 'Meta'}`,
      account: accountId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      subcategory: 'Ahorros'
    };

    const updatedData: FinanceData = {
      ...data,
      accounts: updatedAccounts,
      goals: updatedGoals,
      transactions: [...data.transactions, depositTx]
    };

    setData(updatedData);
    syncData(updatedData);
  };

  // Budget Actions
  const handleAddBudget = (newB: Omit<Budget, 'id'>) => {
    const bId = "b-" + Date.now();
    const createdB: Budget = { id: bId, ...newB };

    const updatedData: FinanceData = {
      ...data,
      budgets: [...data.budgets, createdB]
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleEditBudget = (id: string, limitAmount: number) => {
    const updatedBudgets = data.budgets.map(b => {
      if (b.id === id) {
        return { ...b, limitAmount };
      }
      return b;
    });

    const updatedData: FinanceData = {
      ...data,
      budgets: updatedBudgets
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleDeleteBudget = (id: string) => {
    const updatedBudgets = data.budgets.filter(b => b.id !== id);
    const updatedData: FinanceData = {
      ...data,
      budgets: updatedBudgets
    };

    setData(updatedData);
    syncData(updatedData);
  };

  // Future Expenses Actions
  const handleAddFutureExpense = (newFe: Omit<FutureExpense, 'id'>) => {
    const feId = "fe-" + Date.now();
    const createdFe: FutureExpense = { id: feId, ...newFe };

    const updatedData: FinanceData = {
      ...data,
      futureExpenses: [...data.futureExpenses, createdFe]
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleToggleFutureExpense = (id: string) => {
    const updatedFuture = data.futureExpenses.map(fe => {
      if (fe.id === id) {
        return { ...fe, completed: !fe.completed };
      }
      return fe;
    });

    const updatedData: FinanceData = {
      ...data,
      futureExpenses: updatedFuture
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleDeleteFutureExpense = (id: string) => {
    const updatedFuture = data.futureExpenses.filter(fe => fe.id !== id);
    const updatedData: FinanceData = {
      ...data,
      futureExpenses: updatedFuture
    };

    setData(updatedData);
    syncData(updatedData);
  };

  const handleConvertFutureToReal = (fe: FutureExpense, accountId: string) => {
    // 1. Mark future expense completed
    const updatedFuture = data.futureExpenses.map(item => {
      if (item.id === fe.id) {
        return { ...item, completed: true };
      }
      return item;
    });

    // 2. Add real transaction expense
    const txId = "t-conv-" + Date.now();
    const realTx: Transaction = {
      id: txId,
      type: 'expense',
      amount: fe.amount,
      category: 'Otros',
      description: fe.title,
      account: accountId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      subcategory: 'Gasto Futuro'
    };

    // 3. Deduct from account balance
    const updatedAccounts = data.accounts.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, balance: acc.balance - fe.amount };
      }
      return acc;
    });

    const updatedData: FinanceData = {
      ...data,
      futureExpenses: updatedFuture,
      accounts: updatedAccounts,
      transactions: [...data.transactions, realTx]
    };

    setData(updatedData);
    syncData(updatedData);
  };

  // Navigations configuration
  const navigationItems = [
    { id: "dashboard", label: "Inicio", icon: Home },
    { id: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
    { id: "cuentas", label: "Cuentas", icon: Wallet },
    { id: "objetivos", label: "Objetivos", icon: Car },
    { id: "presupuestos", label: "Límites", icon: PieChart },
    { id: "calendario", label: "Calendario", icon: Calendar },
    { id: "estadisticas", label: "Reportes", icon: BarChart2 }
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-slate-100 font-sans antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 bg-brand-panel/90 backdrop-blur-md border-b border-brand-border z-40 px-4 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          {/* Logo brand */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-none">Mis Finanzas</h1>
              <span className="text-[9px] text-blue-400 font-semibold tracking-wider uppercase">YPF Centro Financiero</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex gap-1">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.05)]' 
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Sync status & User avatar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-brand-panel-light/60 px-2.5 py-1 rounded-full border border-brand-border">
              {syncStatus === 'synced' && (
                <>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-emerald-400 uppercase">Sincronizado</span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
                  <span className="text-blue-400">GUARDANDO...</span>
                </>
              )}
              {syncStatus === 'offline' && (
                <>
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  <span className="text-amber-400">MODO LOCAL</span>
                </>
              )}
            </div>

            <div className="w-8.5 h-8.5 bg-brand-panel-light hover:bg-brand-panel-light/80 rounded-xl flex items-center justify-center border border-brand-border shadow cursor-pointer">
              <User className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        </div>
      </header>

      {/* Main app viewport container */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-10 pb-28 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                data={data} 
                onOpenAddTransaction={(type) => { setOpenQuickModal(type); }}
                onSwitchTab={setActiveTab}
              />
            )}

            {activeTab === 'movimientos' && (
              <Transactions 
                transactions={data.transactions}
                accounts={data.accounts}
                futureExpenses={data.futureExpenses}
                onAddTransaction={handleAddTransaction}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onAddFutureExpense={handleAddFutureExpense}
                onToggleFutureExpense={handleToggleFutureExpense}
                onDeleteFutureExpense={handleDeleteFutureExpense}
                onConvertFutureToReal={handleConvertFutureToReal}
                openAddModal={openQuickModal}
                setOpenAddModal={setOpenQuickModal}
              />
            )}

            {activeTab === 'cuentas' && (
              <Accounts 
                accounts={data.accounts}
                transactions={data.transactions}
                onAddAccount={handleAddAccount}
                onEditAccount={handleEditAccount}
                onDeleteAccount={handleDeleteAccount}
                onTransferMoney={handleTransferMoney}
              />
            )}

            {activeTab === 'objetivos' && (
              <Goals 
                goals={data.goals}
                accounts={data.accounts}
                transactions={data.transactions}
                onAddGoal={handleAddGoal}
                onEditGoal={handleEditGoal}
                onDeleteGoal={handleDeleteGoal}
                onDepositToGoal={handleDepositToGoal}
              />
            )}

            {activeTab === 'presupuestos' && (
              <Budgets 
                budgets={data.budgets}
                transactions={data.transactions}
                onAddBudget={handleAddBudget}
                onEditBudget={handleEditBudget}
                onDeleteBudget={handleDeleteBudget}
              />
            )}

            {activeTab === 'calendario' && (
              <CalendarView 
                transactions={data.transactions}
              />
            )}

            {activeTab === 'estadisticas' && (
              <Stats 
                transactions={data.transactions}
                budgets={data.budgets}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Bottom Nav Menu (Tactile, styled for Mobile viewports) */}
      <div className="fixed bottom-0 left-0 right-0 bg-brand-panel/95 backdrop-blur-md border-t border-brand-border md:hidden z-40 px-3 py-2 flex justify-around shadow-2xl">
        {navigationItems.map(item => {
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                // Also close any lingering quickmodal state
                setOpenQuickModal('none');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all cursor-pointer ${
                isSelected ? 'text-blue-400 bg-blue-500/10 shadow-[inset_0_0_8px_rgba(59,130,246,0.05)]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
