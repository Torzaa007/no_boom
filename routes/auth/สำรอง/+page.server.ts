import { DASHBOARD_ROUTE, SESSION_COOKIE_NAME } from '$lib/constants';
import { database } from '$lib/database/database.server';
import { usersTable, staffsTable } from '$lib/database/schema';
import type { AlertMessageType } from '$lib/types';
import { UserLoginZodSchema } from '$validations/UserLoginZodSchema';
import { redirect } from '@sveltejs/kit';
import { sql, eq, or } from 'drizzle-orm';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const userLoginFormData = await superValidate<typeof UserLoginZodSchema, AlertMessageType>(
			request,
			UserLoginZodSchema
		);

		if (userLoginFormData.valid === false) {
			return message(userLoginFormData, {
				alertType: 'error',
				alertText: 'มีปัญหากับการส่งข้อมูลของคุณ'
			});
		}

		// ตรวจสอบจากทั้ง PASSENGERS และ STAFFS
		const [user] = await database
			.select({
				id: usersTable.passenger_id,
				firstname: usersTable.firstname,
				password: usersTable.password,
				type: sql`'passenger'`.as('type'),
				role: sql`'user'`.as('role')  // กำหนด role เป็น 'user' สำหรับผู้โดยสาร
			})
			.from(usersTable)
			.where(eq(usersTable.email, userLoginFormData.data.email))
			.union(
				database
					.select({
						id: staffsTable.staff_id,
						firstname: staffsTable.firstname,
						password: staffsTable.password,
						type: sql`'staff'`.as('type'),
						role: staffsTable.role  // ดึง role จาก staff
					})
					.from(staffsTable)
					.where(
						or(
							eq(staffsTable.staff_username, userLoginFormData.data.email),
							eq(staffsTable.phonenumber, userLoginFormData.data.email)
						)
					)
			)
			.all();

		if (!user) {
			return setError(userLoginFormData, 'email', 'ไม่พบ Email หรือ Username');
		}

		if (user.password !== userLoginFormData.data.password) {
			return setError(userLoginFormData, 'password', 'รหัสผ่านไม่ถูกต้อง');
		}

		// สร้าง session cookie พร้อม role และ type
		cookies.set(
			SESSION_COOKIE_NAME,
			JSON.stringify({ id: user.id, type: user.type, role: user.role }),
			{
				path: '/',
				httpOnly: true,
				maxAge: 60 * 60 * 24 // อายุ 1 วัน
			}
		);

		// ตรวจสอบ role และทำการ redirect
		if (user.type === 'staff' && user.role === 'manage') {
			throw redirect(307, '/staff/manage');
		}

		if (user.type === 'staff' && user.role === 'check') {
			throw redirect(307, '/staff/check');
		}

		if (user.type === 'staff' && user.role === 'sales') {
			throw redirect(307, '/staff/search');
		}


		// หากไม่เข้าเงื่อนไข staff, ให้ไปที่หน้า dashboard ปกติ
		throw redirect(307, DASHBOARD_ROUTE);
	}
};
