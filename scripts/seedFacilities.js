/**
 * 테스트용 시설 시드 스크립트 (멱등 — 같은 이름은 중복 생성 안 함).
 *
 * 사용법 (운영 Atlas, 하이픈 DB명 + authSource=admin 주의):
 *   MONGODB_URI="mongodb+srv://<user>:<password>@<your-cluster>.mongodb.net/<db>?retryWrites=true&w=majority&authSource=admin" \
 *   node scripts/seedFacilities.js
 *
 * 로컬:
 *   node scripts/seedFacilities.js   (.env의 MONGODB_URI 사용)
 *
 * category 슬러그: study | meeting | sports | etc
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Facility = require("../src/models/Facility");

const FACILITIES = [
  { name: "중앙도서관 스터디룸 A", category: "study", capacity: 6, openTime: "09:00", closeTime: "22:00", description: "조용한 6인용 그룹 스터디룸. 화이트보드와 모니터(HDMI) 구비.", isActive: true },
  { name: "제2열람실 그룹 스터디룸 B", category: "study", capacity: 8, openTime: "09:00", closeTime: "22:00", description: "8인용 스터디룸. 콘센트 다수, 토론 가능.", isActive: true },
  { name: "본관 3층 대회의실", category: "meeting", capacity: 20, openTime: "08:00", closeTime: "21:00", description: "빔프로젝터·화상회의 장비 완비. 세미나/발표용.", isActive: true },
  { name: "신관 소회의실 (4인)", category: "meeting", capacity: 4, openTime: "08:00", closeTime: "20:00", description: "소규모 미팅용 4인 회의실.", isActive: true },
  { name: "실내 체육관 (농구/배드민턴)", category: "sports", capacity: 40, openTime: "07:00", closeTime: "23:00", description: "농구 코트 1면 또는 배드민턴 4코트. 샤워실 이용 가능.", isActive: true },
  { name: "옥상 다목적 라운지", category: "etc", capacity: 30, openTime: "10:00", closeTime: "18:00", description: "행사·동아리 모임용 다목적 공간. 야외 테라스 포함. (현재 점검중)", isActive: false },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${mongoose.connection.host} / db=${mongoose.connection.name}`);
    let created = 0, skipped = 0;
    for (const f of FACILITIES) {
      const exists = await Facility.findOne({ name: f.name });
      if (exists) { skipped++; continue; }
      await Facility.create(f);
      created++;
      console.log(`  + ${f.name} (${f.category})`);
    }
    const total = await Facility.countDocuments({});
    console.log(`완료: 생성 ${created}, 건너뜀(이미존재) ${skipped}, 전체 시설 ${total}`);
  } catch (err) {
    console.error("시드 실패:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
