export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  subcategory?: string;
  account: string; // The account ID it relates to
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  description: string;
  receiptUrl?: string;
  location?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'digital' | 'other';
  balance: number;
  color?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  icon?: string;
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
}

export interface FutureExpense {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  remindDaysBefore: number;
  completed: boolean;
}

export interface FinanceData {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  budgets: Budget[];
  futureExpenses: FutureExpense[];
}
