const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Belum login" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses hanya untuk admin" });
  }

  next();
};

module.exports = adminOnly;