/** Exactness follows the authored member's building role. Mixed files declare
 * an envelope, fitted, or fixed-service role in the owning H2 rather than this
 * gate guessing from an anchor-name list. */
const fs = require("node:fs");
const path = require("node:path");
const docs = path.resolve(__dirname, "../../docs/models");
/** @type {Map<string, Map<string, string>>} */
const cache = new Map();
/** @param {string} file @param {string} anchor */
const body = (file, anchor) => {
  let sections = cache.get(file);
  if (!sections) {
    sections = new Map();
    for (const chunk of fs.readFileSync(path.join(docs, file), "utf8").split(/^## /m).slice(
      1,
    )) {
      const id = /\{#([^}]+)\}/.exec(chunk.split("\n", 1)[0])?.[1];
      if (id) sections.set(id, chunk.replace(/<!--[\s\S]*?-->/g, ""));
    }
    cache.set(file, sections);
  }
  return sections.get(anchor) ?? "";
};
const approximateContents = new Set([
  "clothes",
  "folded",
  "shoe-box",
  "basket",
  "accessory",
]);
/** @param {{ file:string; anchor?:string; id?:string; candidate:boolean }} row */
const isBuildingFaceMissing = (row) => {
  if (row.candidate || (row.id && approximateContents.has(row.id))) return false;
  if (/^0[1-6]-/.test(row.file)) return true;
  return !!row.anchor && /^건물 분류: (?:외피|붙박이|설비) —/m.test(body(row.file, row.anchor));
};

module.exports = { isBuildingFaceMissing };
