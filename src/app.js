require("dotenv").config();
const path = require("path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const connectDb = require("./config/db");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const { loadUser } = require("./middleware/auth");
const labels = require("./utils/labels");

const app = express();
const port = process.env.PORT || 3000;

// DB 연결
connectDb();

//레이아웃과 뷰 엔진 설정
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 정적 파일
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 폼의 hidden _method 필드(POST 바디)로 PUT/DELETE 오버라이드.
// method-override 3.x에서 문자열 getter("_method")는 query만 읽으므로 바디 getter를 사용한다.
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      const method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

app.use(cookieParser());

// 로그인 상태(res.locals.user)와 뷰 헬퍼(라벨/배지)를 모든 요청에 노출
app.use(loadUser);
app.use((req, res, next) => {
  res.locals.catLabel = labels.catLabel;
  res.locals.statusLabel = labels.statusLabel;
  res.locals.statusBadge = labels.statusBadge;
  next();
});

app.use("/", require("./routes/main"));
app.use("/", require("./routes/admin"));

// 404 — 위 라우트에 안 잡힌 요청
app.use((req, res) => {
  res.status(404).render("error", {
    layout: "layouts/main",
    title: "페이지를 찾을 수 없습니다",
    message: "요청하신 페이지를 찾을 수 없습니다. (404)",
  });
});

// 전역 에러 핸들러 (4-인자)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render("error", {
    layout: "layouts/main",
    title: "오류가 발생했습니다",
    message: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

module.exports = app;