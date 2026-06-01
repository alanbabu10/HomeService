const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.json({ message: "Admin access only" });
  }
  next();
};

const employeeOnly = (req, res, next) => {
  if (req.user.role !== "employee") {
    return res.json({ message: "Employee access only" });
  }
  next();
};

module.exports = { adminOnly, employeeOnly };