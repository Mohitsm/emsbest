// controllers/employee.controller.js
import User from '../models/User.js';
import bcrypt from 'bcrypt';

export const changeEmployeePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const employee = await User.findById(req.user.id).select('+password');

  const match = await bcrypt.compare(oldPassword, employee.password);
  if (!match) return res.status(401).json({ message: 'Wrong password' });

  employee.password = await bcrypt.hash(newPassword, 10);
  await employee.save();

  res.json({ message: 'Password updated' });
};
