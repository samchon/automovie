import { modelParts, partBounds } from "./model-occupancy-union.mjs";

/** Check named part faces against the geometry recovered from the same H2. */
/** @param {string} id @param {string} body */
export const partContactRows = (id, body) => {
  const parts = modelParts(body), bounds = partBounds(body);
  const construction = body.split(/^부재 대응:/m)[0].replace(/\[[^\]]+\]\([^)]*\)/g, "");
  const rows = [];
  for (const sentence of construction.split(/(?<=다\.)\s+|\n+/)) {
    if (!/닿|접촉|접한다/.test(sentence) ||
      /닿지 않|접촉 판단|검토 판|실패|뒷면 Z=|쪽 [가-힣]+는 Z=/.test(sentence)) continue;
    const named = parts.filter(({ noun }) => sentence.includes(noun));
    if (named.length < 2) continue;
    const axis = /끝면/.test(sentence) && !/윗면|아랫면/.test(sentence) ? "X" : "Y";
    const intervals = named.map(({ key }) => ({ key, points: bounds[key][axis] }))
      .filter(({ points }) => points.length >= 2)
      .map(({ key, points }) => ({ key, lo: Math.min(...points), hi: Math.max(...points), points }));
    if (intervals.length !== named.length) continue;
    intervals.sort((a, b) => a.lo - b.lo);
    const datum = Number(sentence.match(new RegExp(axis + "=([\\d.]+)m"))?.[1]);
    for (let i = 0; i < intervals.length - 1; i++) {
      const a = intervals[i], b = intervals[i + 1];
      const tangent = Math.abs(a.hi - b.lo) < 1e-6 || Math.abs(b.hi - a.lo) < 1e-6;
      const sharedDatum = Number.isFinite(datum) &&
        a.points.some((p) => Math.abs(p - datum) < 1e-6) &&
        b.points.some((p) => Math.abs(p - datum) < 1e-6);
      rows.push({ id, parts: `${a.key}/${b.key}`, axis, pass: tangent || sharedDatum });
    }
  }
  return rows;
};
