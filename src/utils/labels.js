// Maps between stored slugs/enums and Korean display labels + badge classes.

const CATEGORY_LABELS = {
  study: "스터디룸",
  meeting: "회의실",
  sports: "체육시설",
  etc: "기타",
};

const STATUS_LABELS = {
  pending: "대기",
  approved: "승인",
  rejected: "거절",
  cancelled: "취소",
};

const STATUS_BADGE = {
  pending: "badge--pending",
  approved: "badge--approved",
  rejected: "badge--rejected",
  cancelled: "badge--cancelled",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS); // ['study','meeting','sports','etc']

const catLabel = (slug) => CATEGORY_LABELS[slug] || CATEGORY_LABELS.etc;
const statusLabel = (s) => STATUS_LABELS[s] || s;
const statusBadge = (s) => STATUS_BADGE[s] || "badge--muted";

module.exports = {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_BADGE,
  CATEGORIES,
  catLabel,
  statusLabel,
  statusBadge,
};
