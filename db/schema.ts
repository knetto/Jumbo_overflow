import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';

export const records = sqliteTable('records', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  ownerId: text('owner_id').notNull(),
  data: text('data').notNull(),
  createdAt: integer('created_at').notNull(),
  parentId: text('parent_id'),
}, t => [index('records_kind_idx').on(t.kind),index('records_parent_idx').on(t.parentId)]);
export const votes = sqliteTable('votes', {
  userId: text('user_id').notNull(),
  targetId: text('target_id').notNull(),
}, t => [primaryKey({columns:[t.userId,t.targetId]})]);
export const settings = sqliteTable('settings', {
  userId: text('user_id').primaryKey(),
  data: text('data').notNull(),
});
export const downloads = sqliteTable('downloads', {
  id: text('id').primaryKey(),
  targetId: text('target_id').notNull(),
  createdAt: integer('created_at').notNull(),
});
