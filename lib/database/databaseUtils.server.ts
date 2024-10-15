import { eq, sql } from 'drizzle-orm';
import { database } from './database.server';
import { usersTable, type UserInsertSchema, staffsTable } from './schema';

function generatePassengerId(lastId: string | null): string {
  if (!lastId) {
    return 'P0000001';  // If no ID found, start with P0000001
  }

  // Extract numeric part of the ID (everything after the first character)
  const numericPart = lastId.substring(1);
  
  // Increment the numeric part and pad it to 7 digits
  const nextNumericPart = (parseInt(numericPart, 10) + 1).toString().padStart(7, '0');
  
  return `P${nextNumericPart}`;
}

export const checkIfEmailExists = async (email: string) => {
  const queryResult = await database
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  return queryResult.length > 0;
};

export const insertNewUser = async (userData: UserInsertSchema) => {
  // Correct usage of orderBy for descending order
  const lastUser = await database
    .select({ passenger_id: usersTable.passenger_id })
    .from(usersTable)
    .orderBy(sql`CAST(SUBSTRING(${usersTable.passenger_id}, 2) AS UNSIGNED) DESC`)
    .limit(1);

  const lastId = lastUser.length > 0 ? lastUser[0].passenger_id : null;
  const newPassengerId = generatePassengerId(lastId);

  return await database.insert(usersTable).values({
    ...userData,
    passenger_id: newPassengerId,
  });
};

export const getAllUsers = async () => {
  const queryResult = await database
    .select({
      passenger_id: usersTable.passenger_id,
      firstname: usersTable.firstname,
      lastname: usersTable.lastname,
      email: usersTable.email,
      password: usersTable.password,
      phonenumber: usersTable.phonenumber,
      personal_id: usersTable.personal_id
    })
    .from(usersTable);

  return queryResult;
};

export const deleteAllUsers = async () => {
  return await database.delete(usersTable);
};

export const getUserName = async (userId: string) => {
  // ตรวจสอบจากตาราง PASSENGERS (usersTable)
  const [user] = await database
    .select({
      firstname: usersTable.firstname,
      lastname: usersTable.lastname,
      role: sql`'user'`.as('role')  // กำหนด role เป็น 'user' สำหรับผู้โดยสาร
    })
    .from(usersTable)
    .where(eq(usersTable.passenger_id, userId))
    .all();

  if (user) {
    return `${user.firstname} ${user.lastname}`;  // ถ้าเป็นผู้โดยสาร แสดงชื่อเต็ม
  }

  // ถ้าหาไม่เจอใน usersTable, ตรวจสอบใน STAFFS (staffsTable)
  const [staff] = await database
    .select({
      firstname: staffsTable.firstname,
      lastname: staffsTable.lastname,
      role: staffsTable.role  // ดึง role ของ staff
    })
    .from(staffsTable)
    .where(eq(staffsTable.staff_id, userId))
    .all();

  // ถ้าเป็น staff, แสดงชื่อและ role
  if (staff) {
    return `${staff.firstname} ${staff.lastname} (Role: ${staff.role})`;
  }

  // ถ้าไม่เจอทั้งสองที่ ให้คืนค่าเป็น null
  return null;
};
