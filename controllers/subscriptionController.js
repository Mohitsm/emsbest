import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

// Admin: get own subscription
export const getSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ adminId: req.user._id });
    if (!sub) {
      return res.status(200).json({ success: true, subscription: null });
    }
    res.status(200).json({
      success: true,
      subscription: {
        plan: sub.plan,
        maxUsers: sub.maxUsers,
        currentUsers: sub.currentUsers,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        remaining: sub.maxUsers - sub.currentUsers,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching subscription' });
  }
};

// Get available plans for upgrade (exclude current plan)
export const getAvailablePlans = async (req, res) => {
  try {
    const currentSub = await Subscription.findOne({ adminId: req.user._id });
    const allPlans = [
      { name: 'Basic', maxUsers: 100 },
      { name: 'Standard', maxUsers: 500 },
      { name: 'Premium', maxUsers: 1000 },
      { name: 'Enterprise', maxUsers: 10 },
    ];
    const available = currentSub
      ? allPlans.filter(p => p.name !== currentSub.plan)
      : allPlans;
    res.status(200).json({
      success: true,
      plans: available,
      currentPlan: currentSub?.plan || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching plans' });
  }
};

// Purchase or upgrade subscription
export const purchaseSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['Basic', 'Standard', 'Premium', 'Enterprise'];
    if (!plan || !validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const maxUsers = Subscription.getPlanLimits(plan);
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1-year subscription

    const existing = await Subscription.findOne({ adminId: req.user._id });
    if (existing) {
      // Check if downgrade is possible
      if (existing.currentUsers > maxUsers) {
        return res.status(400).json({
          success: false,
          message: `Cannot downgrade: you have ${existing.currentUsers} users, but ${plan} allows only ${maxUsers}.`,
        });
      }
      existing.plan = plan;
      existing.maxUsers = maxUsers;
      existing.endDate = endDate;
      existing.status = 'active';
      await existing.save();
      return res.status(200).json({
        success: true,
        message: 'Subscription upgraded',
        subscription: existing,
      });
    }

    // New subscription
    const newSub = await Subscription.create({
      adminId: req.user._id,
      plan,
      maxUsers,
      currentUsers: 0,
      status: 'active',
      endDate,
    });
    res.status(201).json({
      success: true,
      message: 'Subscription created',
      subscription: newSub,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error purchasing subscription' });
  }
};

// Super admin: get all admins with their subscriptions
export const getAllAdminSubscriptions = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admin can access this resource' });
    }

    const admins = await User.find({ role: 'admin' })
      .select('_id name email company isActive createdAt');

    if (!admins.length) {
      return res.status(200).json({ success: true, admins: [] });
    }

    const adminIds = admins.map(a => a._id);
    const subscriptions = await Subscription.find({ adminId: { $in: adminIds } });

    const result = admins.map(admin => {
      const sub = subscriptions.find(s => s.adminId.toString() === admin._id.toString());
      return {
        ...admin.toObject(),
        subscription: sub ? {
          plan: sub.plan,
          maxUsers: sub.maxUsers,
          currentUsers: sub.currentUsers,
          status: sub.status,
          endDate: sub.endDate,
          remaining: sub.maxUsers - sub.currentUsers,
        } : null
      };
    });

    res.status(200).json({ success: true, admins: result, count: result.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching admin subscriptions', error: err.message });
  }
};