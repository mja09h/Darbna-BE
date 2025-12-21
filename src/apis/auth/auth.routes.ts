import { Router } from 'express';
import { forgotPassword, resetPassword } from './auth.controller';

const router = Router();

// Password Reset (6-Digit Code)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
