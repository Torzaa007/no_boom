import { sql } from 'drizzle-orm';
import { float } from 'drizzle-orm/mysql-core';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('PASSENGERS', {
    passenger_id: text('passenger_id').primaryKey(),
    firstname: text('firstname').notNull(), // เพิ่มฟิลด์ชื่อ
    lastname: text('lastname').notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    phonenumber: text('phonenumber').notNull(), // เพิ่มฟิลด์เบอร์โทรศัพท์
    personal_id: text('personal_id').notNull() // เพิ่มฟิลด์เลขบัตรประชาชน
});

export const staffsTable = sqliteTable('STAFFS', {
    staff_id: text('staff_id').primaryKey(),
    firstname: text('firstname').notNull(),
    lastname: text('lastname').notNull(),
    staff_username: text('staff_username').notNull(),
    password: text('password').notNull(),
    phonenumber: text('phonenumber').notNull(),
    role: text('role').notNull()
});

export type UserInsertSchema = typeof usersTable.$inferInsert;