import express from 'express';
import { 
  getAllUsers, 
  getUser, 
  updateUser, 
  changePassword, 
  deleteUser 
} from '../controllers/userController.js';
import { protect, authorize, canModifyUser } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.put('/:id', canModifyUser, updateUser);
router.put('/:id/password', canModifyUser, changePassword);
router.delete('/:id', authorize('super_admin'), deleteUser);

export default router;
