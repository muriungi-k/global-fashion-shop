import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', { id: text('id').primaryKey(), email: text('email').notNull().unique(), name: text('name').notNull(), password: text('password').notNull(), salt: text('salt').notNull(), address: text('address').notNull().default('') });
export const sessions = sqliteTable('sessions', { id: text('id').primaryKey(), userId: text('user_id').notNull(), expires: integer('expires').notNull(), role: text('role').notNull().default('customer') });
export const orders = sqliteTable('orders', { id: text('id').primaryKey(), userId: text('user_id').notNull(), data: text('data').notNull(), status: text('status').notNull().default('Processing'), created: text('created').notNull() });
export const products = sqliteTable('products', { id: text('id').primaryKey(), data: text('data').notNull() });
export const messages = sqliteTable('messages', { id: text('id').primaryKey(), data: text('data').notNull(), created: text('created').notNull() });
export const attempts = sqliteTable('attempts', { id: text('id').primaryKey(), count: integer('count').notNull().default(0), expires: integer('expires').notNull() });
