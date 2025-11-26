const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY || "secret123";

module.exports = function (req, res, next) {
  const tokenHeader = req.headers["authorization"];
  if (!tokenHeader) return res.status(401).send({ message: "No token" });

  const token = tokenHeader.replace("Bearer ", "");

  try {
    jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    res.status(401).send({ message: "Invalid Token" });
  }
};
