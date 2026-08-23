const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parsePostDate(value) {
  if (!value) return null;
  const iso = String(value).includes("T") ? String(value) : `${value}T12:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDated(value) {
  const d = parsePostDate(value);
  if (!d) return "";
  const hh24 = d.getHours();
  const suffix = hh24 >= 12 ? "PM" : "AM";
  const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
  const pad = (n) => String(n).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} ${pad(hh12)}:${pad(d.getMinutes())} ${suffix}`;
}

function computeReadTime(html) {
  const text = String(html || "").replace(/<[^>]*>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

const POST_FIELD_ORDER = [
  "author", "title", "tags", "category", "body", "datePublished",
  "dateModified", "coverImage", "readTime", "dated", "slug",
  "categorySlug", "status", "summary", "description", "content",
];

function orderFields(post) {
  const ordered = {};
  for (const key of POST_FIELD_ORDER) {
    if (post[key] !== undefined) ordered[key] = post[key];
  }
  for (const key of Object.keys(post)) {
    if (!(key in ordered)) ordered[key] = post[key];
  }
  return ordered;
}

module.exports = {
  MONTHS,
  parsePostDate,
  formatDated,
  computeReadTime,
  todayIsoDate,
  orderFields,
};
