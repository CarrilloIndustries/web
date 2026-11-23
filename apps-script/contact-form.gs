/**
 * Contact form back end for https://carrilloindustries.com/web/
 *
 * A Google Apps Script web app that runs under Cameron's Google Workspace account. The site's
 * contact form posts here. Each message is checked, saved to the "Website inquiries" sheet and
 * emailed to TO, with Reply set to the visitor's address.
 *
 * Setup and redeploy steps are in README.md under "Contact form".
 */

const TO = "cam.carrillo@carrilloindustries.com";
const SHEET_NAME = "Website inquiries";
const MAX_LENGTH = { name: 100, email: 254, company: 120, need: 60, message: 5000 };
const PER_SENDER = 3; // messages from one email address in 10 minutes
const PER_HOUR = 30; // messages from everyone in an hour, so a flood can't bury the inbox or use up the mail quota

/** The form posts here. Always answers with JSON: { ok: true } or { ok: false, error }. */
function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p._gotcha) return reply({ ok: true }); // Bots fill the hidden field. Tell them it worked and drop it.

    const msg = {
      name: clean(p.name, MAX_LENGTH.name),
      email: clean(p.email, MAX_LENGTH.email),
      company: clean(p.company, MAX_LENGTH.company),
      need: clean(p.need, MAX_LENGTH.need),
      message: clean(p.message, MAX_LENGTH.message, true),
    };
    const problem = check(msg);
    if (problem) return reply({ ok: false, error: problem });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (overLimit(msg.email)) return reply({ ok: false, error: "rate-limited" });
    } finally {
      lock.releaseLock();
    }

    saveRow(msg);
    sendEmail(msg);
    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: "server" });
  }
}

/** Opening the web app URL in a browser shows this, which confirms the deployment works. */
function doGet() {
  return reply({ ok: true, service: "contact-form" });
}

/**
 * Run once from the Apps Script editor before deploying. It asks you to approve the script,
 * creates the "Website inquiries" sheet in your Drive and sends you a test email.
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("SHEET_ID");
  if (!id) {
    const ss = SpreadsheetApp.create(SHEET_NAME);
    const sheet = ss.getSheets()[0];
    sheet.appendRow(["Received", "Name", "Email", "Company", "Need", "Message"]);
    sheet.setFrozenRows(1);
    id = ss.getId();
    props.setProperty("SHEET_ID", id);
  }
  const url = SpreadsheetApp.openById(id).getUrl();
  MailApp.sendEmail(TO, "Your website's contact form is set up",
    "Messages from the contact form on carrilloindustries.com/web will arrive at this address.\n\n" +
    "Each one is also saved to this sheet: " + url);
  console.log("Inquiries sheet: " + url);
}

/** Returns the first problem with a message, or "" when it's fine. The site checks the same rules. */
function check(m) {
  if (!m.name) return "name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.email)) return "email";
  if (!m.need) return "need";
  if (m.message.length < 10) return "message";
  return "";
}

/** Trims, caps the length and removes control characters. The message keeps its line breaks and tabs. */
function clean(value, max, multiline) {
  let s = String(value == null ? "" : value);
  s = multiline
    ? s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    : s.replace(/[\u0000-\u001f\u007f]+/g, " ");
  return s.trim().slice(0, max).trim();
}

/** Counts messages in the script cache. Returns true when this one goes over a limit. */
function overLimit(email) {
  const cache = CacheService.getScriptCache();
  const hourKey = "hour:" + Math.floor(Date.now() / 3600000);
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, email.toLowerCase());
  const senderKey = "from:" + Utilities.base64EncodeWebSafe(digest);
  const hour = Number(cache.get(hourKey) || 0);
  const sender = Number(cache.get(senderKey) || 0);
  if (hour >= PER_HOUR || sender >= PER_SENDER) return true;
  cache.put(hourKey, String(hour + 1), 3600);
  cache.put(senderKey, String(sender + 1), 600);
  return false;
}

/** Adds the message to the inquiries sheet. The email still goes out if this fails. */
function saveRow(m) {
  try {
    const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
    if (!id) return;
    SpreadsheetApp.openById(id).getSheets()[0]
      .appendRow([new Date(), m.name, m.email, m.company, m.need, m.message].map(asText));
  } catch (err) {
    console.error(err);
  }
}

/** Sheets treats text starting with = + - or @ as a formula. A leading apostrophe keeps it plain text. */
function asText(v) {
  return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;
}

function sendEmail(m) {
  const lines = ["Name: " + m.name, "Email: " + m.email];
  if (m.company) lines.push("Company: " + m.company);
  lines.push("Need: " + m.need, "", m.message, "", "--",
    "Sent from the contact form on carrilloindustries.com/web. Reply to this email to answer " + m.name.split(/\s+/)[0] + ".");
  MailApp.sendEmail({
    to: TO,
    replyTo: m.email,
    name: "Website contact form",
    subject: "Project inquiry from " + m.name + (m.company ? " (" + m.company + ")" : ""),
    body: lines.join("\n"),
  });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
