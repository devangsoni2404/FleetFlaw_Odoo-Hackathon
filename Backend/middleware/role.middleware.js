export const allowRoles = (...allowedRoles) => (req, res, next) => {
  const userRole = req.user?.role_name || req.user?.role || req.user?.name;

  if (!userRole) {
    return res.status(403).json({ success: false, message: 'Forbidden: role not found in token' });
  }

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role permissions' });
  }

  return next();
};

export const allowSelfOrRoles = (paramKey = 'userId', ...allowedRoles) => (req, res, next) => {
  const userRole = req.user?.role_name || req.user?.role || req.user?.name;
  const requesterId = Number.parseInt(req.user?.user_id, 10);
  const targetId = Number.parseInt(req.params?.[paramKey], 10);

  if (userRole && allowedRoles.includes(userRole)) {
    return next();
  }

  if (!Number.isNaN(requesterId) && !Number.isNaN(targetId) && requesterId === targetId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden: you can only update your own profile',
  });
};
