import { modelParts, partBounds } from "./model-occupancy-union.mjs";

/** Compare a wall-face sentence with the Z minima of its authored parts. */
/** @param {string} id @param {string} body */
export const implicitWallContactRows = (id, body) => {
  if (!/원점[^\n]*뒷변/.test(body) || !/앞은[^\n]*\+Z/.test(body)) return [];
  const parts = modelParts(body);
  const bounds = partBounds(body);
  const rows = [];
  const assigned = new Set();
  const clauses = body.split(/(?<=다\.)\s+|이고,\s+/);
  for (const clause of clauses) {
    const face = clause.match(/(.+?)의 뒷면(?:\(Z=([\d.]+)\))?[^\n]*?벽과 (닿|([\d.]+)m 떨어)/);
    if (!face) continue;
    const group = face[1].split(/[.]/).at(-1);
    const isTouch = face[3] === "닿";
    const expected = isTouch ? 0 : Number(face[4]);
    let named = parts.filter(({ key, noun }) => {
      const words = [key, noun, noun.split(" ")[0], noun.split(" ").slice(-2).join(" ")];
      return words.some((word) => word && (group.includes(word) || group.includes("`" + word + "`")));
    });
    const namedCount = group.split(/·|과 |와 /).filter(Boolean).length;
    if (assigned.size && named.length < namedCount) {
      const missing = parts.filter(({ key }) => !assigned.has(key) && !named.some((part) => part.key === key));
      if (named.length + missing.length === namedCount) named = [...named, ...missing];
    }
    for (const { key } of named) {
      assigned.add(key);
      const coordinates = bounds[key]?.Z ?? [];
      if (!coordinates.length) continue;
      const back = Math.min(...coordinates);
      const declared = face[2] === undefined ? expected : Number(face[2]);
      rows.push({ id, part: key, back,
        pass: Math.abs(back - expected) < 1e-6 && Math.abs(declared - expected) < 1e-6 });
    }
  }
  return rows;
};
