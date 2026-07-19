import { pgTable, text, integer, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  uid: text('uid').primaryKey(), // Firebase UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').notNull(),
  userId: text('user_id').references(() => users.uid).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'cash' | 'bank' | 'digital' | 'other'
  balance: integer('balance').notNull(),
  color: text('color'),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').notNull(),
  userId: text('user_id').references(() => users.uid).notNull(),
  type: text('type').notNull(), // 'income' | 'expense'
  amount: integer('amount').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  account: text('account').notNull(), // Client-side account ID
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time'), // HH:mm
  description: text('description').notNull(),
});

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').notNull(),
  userId: text('user_id').references(() => users.uid).notNull(),
  name: text('name').notNull(),
  targetAmount: integer('target_amount').notNull(),
  currentAmount: integer('current_amount').notNull(),
  targetDate: text('target_date').notNull(), // YYYY-MM-DD
  icon: text('icon'),
});

export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').notNull(),
  userId: text('user_id').references(() => users.uid).notNull(),
  category: text('category').notNull(),
  limitAmount: integer('limit_amount').notNull(),
});

export const futureExpenses = pgTable('future_expenses', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').notNull(),
  userId: text('user_id').references(() => users.uid).notNull(),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  dueDate: text('due_date').notNull(), // YYYY-MM-DD
  remindDaysBefore: integer('remind_days_before').notNull(),
  completed: boolean('completed').notNull(),
});
