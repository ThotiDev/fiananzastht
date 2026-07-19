import { db } from './index.ts';
import { users, accounts, transactions, goals, budgets, futureExpenses } from './schema.ts';
import { eq } from 'drizzle-orm';
import { FinanceData } from '../types.ts';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    throw new Error("Failed to register/verify user in database.", { cause: error });
  }
}

export async function getUserFinanceData(uid: string): Promise<FinanceData> {
  try {
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, uid));
    const userTransactions = await db.select().from(transactions).where(eq(transactions.userId, uid));
    const userGoals = await db.select().from(goals).where(eq(goals.userId, uid));
    const userBudgets = await db.select().from(budgets).where(eq(budgets.userId, uid));
    const userFutureExpenses = await db.select().from(futureExpenses).where(eq(futureExpenses.userId, uid));

    // If no accounts found, return the initial default seed data for this user
    if (userAccounts.length === 0) {
      const defaultData: FinanceData = {
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
          },
          {
            id: "t-3",
            type: "expense",
            amount: 12000,
            category: "Comida",
            description: "McDonald's con los pibes",
            account: "acc-3",
            date: "2026-07-13",
            time: "22:30"
          },
          {
            id: "t-4",
            type: "expense",
            amount: 25000,
            category: "Nafta",
            description: "Carga de combustible",
            account: "acc-3",
            date: "2026-07-10",
            time: "18:00"
          },
          {
            id: "t-5",
            type: "expense",
            amount: 7800,
            category: "Steam",
            description: "Juego en oferta de invierno",
            account: "acc-3",
            date: "2026-07-08",
            time: "21:45"
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
          },
          {
            id: "g-2",
            name: "Vacaciones Verano",
            targetAmount: 800000,
            currentAmount: 0,
            targetDate: "2027-01-15",
            icon: "palm"
          }
        ],
        budgets: [
          { id: "b-1", category: "Comida", limitAmount: 100000 },
          { id: "b-2", category: "Steam", limitAmount: 20000 },
          { id: "b-3", category: "Salida", limitAmount: 50000 },
          { id: "b-4", category: "Nafta", limitAmount: 40000 }
        ],
        futureExpenses: [
          {
            id: "fe-1",
            title: "Cumple de Mamá (Regalo)",
            amount: 35000,
            dueDate: "2026-08-20",
            remindDaysBefore: 5,
            completed: false
          },
          {
            id: "fe-2",
            title: "Seguro de Moto/Auto",
            amount: 18000,
            dueDate: "2026-07-25",
            remindDaysBefore: 3,
            completed: false
          }
        ]
      };
      
      // Auto-save the default seed data in background so it's persisted right away!
      await saveUserFinanceData(uid, defaultData);
      return defaultData;
    }

    return {
      accounts: userAccounts.map(a => ({
        id: a.clientId,
        name: a.name,
        type: a.type as 'cash' | 'bank' | 'digital' | 'other',
        balance: a.balance,
        color: a.color || undefined,
      })),
      transactions: userTransactions.map(t => ({
        id: t.clientId,
        type: t.type as 'income' | 'expense',
        amount: t.amount,
        category: t.category,
        subcategory: t.subcategory || undefined,
        account: t.account,
        date: t.date,
        time: t.time || undefined,
        description: t.description,
      })),
      goals: userGoals.map(g => ({
        id: g.clientId,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate,
        icon: g.icon || undefined,
      })),
      budgets: userBudgets.map(b => ({
        id: b.clientId,
        category: b.category,
        limitAmount: b.limitAmount,
      })),
      futureExpenses: userFutureExpenses.map(fe => ({
        id: fe.clientId,
        title: fe.title,
        amount: fe.amount,
        dueDate: fe.dueDate,
        remindDaysBefore: fe.remindDaysBefore,
        completed: fe.completed,
      })),
    };
  } catch (error) {
    console.error("Error loading user finance data:", error);
    throw new Error("Failed to load your finance data.", { cause: error });
  }
}

export async function saveUserFinanceData(uid: string, data: FinanceData): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // 1. Sync accounts
      await tx.delete(accounts).where(eq(accounts.userId, uid));
      if (data.accounts.length > 0) {
        await tx.insert(accounts).values(
          data.accounts.map(a => ({
            clientId: a.id,
            userId: uid,
            name: a.name,
            type: a.type,
            balance: a.balance,
            color: a.color || null,
          }))
        );
      }

      // 2. Sync transactions
      await tx.delete(transactions).where(eq(transactions.userId, uid));
      if (data.transactions.length > 0) {
        await tx.insert(transactions).values(
          data.transactions.map(t => ({
            clientId: t.id,
            userId: uid,
            type: t.type,
            amount: t.amount,
            category: t.category,
            subcategory: t.subcategory || null,
            account: t.account,
            date: t.date,
            time: t.time || null,
            description: t.description,
          }))
        );
      }

      // 3. Sync goals
      await tx.delete(goals).where(eq(goals.userId, uid));
      if (data.goals.length > 0) {
        await tx.insert(goals).values(
          data.goals.map(g => ({
            clientId: g.id,
            userId: uid,
            name: g.name,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount,
            targetDate: g.targetDate,
            icon: g.icon || null,
          }))
        );
      }

      // 4. Sync budgets
      await tx.delete(budgets).where(eq(budgets.userId, uid));
      if (data.budgets.length > 0) {
        await tx.insert(budgets).values(
          data.budgets.map(b => ({
            clientId: b.id,
            userId: uid,
            category: b.category,
            limitAmount: b.limitAmount,
          }))
        );
      }

      // 5. Sync future expenses
      await tx.delete(futureExpenses).where(eq(futureExpenses.userId, uid));
      if (data.futureExpenses.length > 0) {
        await tx.insert(futureExpenses).values(
          data.futureExpenses.map(fe => ({
            clientId: fe.id,
            userId: uid,
            title: fe.title,
            amount: fe.amount,
            dueDate: fe.dueDate,
            remindDaysBefore: fe.remindDaysBefore,
            completed: fe.completed,
          }))
        );
      }
    });
  } catch (error) {
    console.error("Error saving user finance data:", error);
    throw new Error("Failed to save your finance data.", { cause: error });
  }
}
