const jwt = require("jsonwebtoken");
const SECRET_KEY = "secret123";

module.exports = function (req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send({ message: "Unauthorized" });

  try {
    jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    res.status(401).send({ message: "Invalid Token" });
  }
};
