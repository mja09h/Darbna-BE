import { Router } from 'express';
import { appleLogin } from '../users/users.controller';
import { forgotPassword, resetPassword } from './auth.controller';

const router = Router();

router.post('/apple', appleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
