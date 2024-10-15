import { z } from 'zod';

export const MAX_NAME_LENGTH = 50;

export const RegisterUserZodSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัว'),
  confirmPassword: z.string(),
  firstname: z.string().max(MAX_NAME_LENGTH, `ชื่อต้องไม่เกิน ${MAX_NAME_LENGTH} ตัวอักษร`),
  lastname: z.string().max(MAX_NAME_LENGTH, `นามสกุลต้องไม่เกิน ${MAX_NAME_LENGTH} ตัวอักษร`),
  phonenumber: z
    .string()
    .length(10, 'เบอร์โทรศัพท์ต้องมี 10 หลัก')
    .regex(/^[0-9]+$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น'),
  personal_id: z
    .string()
    .length(13, 'เลขบัตรประจำตัวประชาชนต้องมี 13 หลัก')
    .regex(/^[0-9]+$/, 'เลขบัตรประจำตัวประชาชนต้องเป็นตัวเลขเท่านั้น'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});