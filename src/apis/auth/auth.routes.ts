import { Router } from 'express';
import { googleLogin, appleLogin } from '../users/users.controller';

const router = Router();

router.post('/google', googleLogin);
router.post('/apple', appleLogin);

export default router;
