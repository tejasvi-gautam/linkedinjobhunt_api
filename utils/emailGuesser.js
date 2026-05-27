export function buildRecruiterEmails(company) {
  const domain = `${normalizeCompanyName(company)}.com`;

  return [`careers@${domain}`, `hr@${domain}`];
}

function normalizeCompanyName(company) {
  return String(company)
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|company|co|pvt|private)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
