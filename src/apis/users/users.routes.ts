import { Router } from 'express';
import upload from '../../middlewares/multer';
import {
    getUsers,
    register,
    updateUser,
    deleteUser,
    getUserById,
    getUserByUsername,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getUserProfile,
    updatePassword,
    login,
    appleLogin,
} from './users.controller';
import { auth } from '../../middlewares/auth';

const router = Router();

// Public endpoints - registration, login, and public profile viewing
router.post('/', register);
router.post('/login', login);
router.get('/username/:username', getUserByUsername);
router.get('/:id', getUserById);
router.get('/:id/profile', getUserProfile);

router.post('/apple', appleLogin);

// Protected endpoints - require authentication
router.get('/', auth, getUsers); // User discovery may require auth
router.put('/:id', auth, upload.single('profilePicture'), updateUser);
router.put('/:id/password', auth, updatePassword);
router.delete('/:id', auth, deleteUser);
router.post('/:id/follow', auth, followUser);
router.post('/:id/unfollow', auth, unfollowUser);
router.get('/:id/followers', auth, getFollowers);
router.get('/:id/following', auth, getFollowing);

export default router;