const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Welcome to the main route!");
});

module.exports = router;