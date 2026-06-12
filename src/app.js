require("dotenv").config();
const express = require("express");
const expressLayout = require("express-ejs-layouts");

const app = express();
app.use(expressLayout);
app.set("layout", "./layouts/main");
app.set("view engine", "ejs");
app.set("views", "./src/views");
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.use("/", require("./routes/main"));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;