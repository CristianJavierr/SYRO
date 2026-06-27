import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const ROOT = "/Users/cristianjavierguzman/Work/SYRO/V7/.recover";
const DL = path.join(ROOT, "dl");
const MODS = path.join(ROOT, "src_modules");

function fetch(url, bin = false) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": UA, "Accept": "*/*" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetch(res.headers.location, bin).then(b => ({ status: res.statusCode, body: b })));
      }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        resolve({ status: res.statusCode, body: bin ? buf : buf.toString("utf8") });
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("timeout " + url)));
  });
}

async function head(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: "GET", headers: { "User-Agent": UA } }, (res) => {
      res.resume();
      res.on("end", () => resolve(res.statusCode));
    });
    req.on("error", () => resolve(0));
    req.setTimeout(20000, () => req.destroy());
  });
}

export { fetch as get_, head, UA, ROOT, DL, MODS };

export async function getBin(url) {
  const { status, body } = await fetch(url, true);
  return { status, body };
}
export async function getText(url) {
  const { status, body } = await fetch(url, false);
  return { status, body };
}