import fs from "node:fs";
import path from "node:path";
const docs = path.resolve(__dirname, "../../docs/models");
const cache: Map<string, Map<string, string>> = new Map();
const body = (file: string, anchor: string) => {
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
const isBuildingFaceMissing = (row: { file:string; anchor?:string; id?:string; candidate:boolean }) => {
  if (row.candidate || (row.id && approximateContents.has(row.id))) return false;
  if (/^0[1-6]-/.test(row.file)) return true;
  return !!row.anchor && /^건물 분류: (?:외피|붙박이|설비) —/m.test(body(row.file, row.anchor));
};

export { isBuildingFaceMissing };