import LeaveBalance from '../models/LeaveBalance.js';

export const getOrCreateLeaveBalance = async (userId, year) => {
  let balance = await LeaveBalance.findOne({ user: userId, year });
  if (!balance) {
    balance = await LeaveBalance.create({ user: userId, year });
  }
  return balance;
};
