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
