require("dotenv").config();
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.use("/", require("./routes/main"));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;