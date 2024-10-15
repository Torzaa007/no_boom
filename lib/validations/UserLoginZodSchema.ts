import { z } from 'zod';

export const UserLoginZodSchema = z.object({
	email: z.string(),
	password: z.string()
});
