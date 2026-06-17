/**
 * 관리자 계정 시드 스크립트.
 *
 * 사용법:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=<password> node scripts/seedAdmin.js
 *
 * ADMIN_USERNAME과 ADMIN_PASSWORD 환경변수를 반드시 설정해야 합니다.
 * 회원가입 라우트는 role='user'만 생성하므로, 관리자는 이 스크립트로 만듭니다.
 * 이미 같은 username이 있으면 role을 admin으로 승격합니다.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../src/models/User");

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error("오류: ADMIN_USERNAME과 ADMIN_PASSWORD 환경변수를 설정하세요.");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const existing = await User.findOne({ username });
    if (existing) {
      existing.role = "admin";
      existing.password = await bcrypt.hash(password, 10);
      await existing.save();
      console.log(`기존 사용자 '${username}'를 관리자로 승격하고 비밀번호를 갱신했습니다.`);
    } else {
      const hash = await bcrypt.hash(password, 10);
      await User.create({ username, password: hash, role: "admin" });
      console.log(`관리자 계정 생성 완료: ${username}`);
    }
  } catch (err) {
    console.error("시드 실패:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
