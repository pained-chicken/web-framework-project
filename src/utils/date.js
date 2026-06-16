// 날짜 헬퍼: 오늘 날짜를 "YYYY-MM-DD" 문자열로 (예약 date 필드 형식과 동일).
const pad = (n) => String(n).padStart(2, "0");

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

module.exports = { pad, todayStr };
