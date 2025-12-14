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
} from './users.controller';

const router = Router();

router.get('/', getUsers);
router.post('/', register);
router.post('/login', login);
router.put('/:id', upload.single('profilePicture'), updateUser);
router.put('/:id/password', updatePassword);
router.delete('/:id', deleteUser);

router.get('/username/:username', getUserByUsername);
router.get('/:id', getUserById);

router.post('/:id/follow', followUser);
router.post('/:id/unfollow', unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/:id/profile', getUserProfile);

export default router;