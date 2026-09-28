import { modelParts, partBounds } from "./model-occupancy-union.mjs";

/** Check named part faces against the geometry recovered from the same H2. */
/** @param {string} id @param {string} body */
export const partContactRows = (id, body) => {
  const parts = modelParts(body), bounds = partBounds(body);
  const construction = body.split(/^부재 대응:/m)[0].replace(
    /\[[^\]]+\]\([^)]*\)/g,
    "",
  );
  const rows = [];
  const aliases = Object.fromEntries(parts.map(({ key, noun }) => {
    const escaped = noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const extension = [...construction.matchAll(new RegExp(`${escaped}\\s+([가-힣]+)(?:은|는)\\s+(?:[XYZ]=|반지름|바깥|아래|위)`, "g"))]
      .map((match) => match[1]);
    return [key, [noun, ...extension]];
  }));
  /** @param {string} sentence @param {string} noun */
  const mentions = (sentence, noun) => {
    const distinct = parts.filter((part) => part.noun !== noun && part.noun.includes(noun))
      .reduce((text, part) => text.replaceAll(part.noun, ""), sentence);
    const escaped = noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?=$|[.,;:()·\\s]|은|는|이|가|을|를|의|와|과|에|에서|으로|로)`, "u").test(
      distinct,
    );
  };
  let previousSubject = "";
  for (const sentence of construction.split(/(?<=다\.)\s+|\n+/)) {
    const subject = parts.find(({ noun }) => new RegExp(
      `(?<![\\p{L}\\p{N}])${noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:은|는)`, "u",
    ).test(sentence));
    if (subject) previousSubject = subject.key;
    if (!/닿|접촉|접하|접한|접한다|받친|받치|잇는다|이어지|겹쳐|맞댄다/.test(sentence) ||
      /닿지 않|접촉 판단|검토 판|실패|뒷면 Z=|쪽 [가-힣]+는 Z=|(?:지면|바닥)에 접하고/.test(sentence)) continue;
    const named = parts.filter(({ key }) => aliases[key].some((noun) => mentions(sentence, noun)) ||
      key === previousSubject && /^(?:시작면|끝면)/.test(sentence));
    if (named.length < 2) continue;
    const axis = (/(?:뒤쪽|앞쪽|시작면)[^\n]*?Z=/.test(sentence) ||
      /시작면[^\n]*?뒤쪽 단면/.test(sentence)) && !/윗면|아랫면/.test(sentence)
      ? "Z"
      : /끝면/.test(sentence) && !/윗면|아랫면/.test(sentence) ? "X" : "Y";
    const intervals = named.map(({ key }) => ({ key, points: bounds[key][axis] }))
      .filter(({ points }) => points.length >= 2)
      .map(({ key, points }) => ({ key, lo: Math.min(...points), hi: Math.max(...points), points }));
    if (intervals.length !== named.length) continue;
    intervals.sort((a, b) => a.lo - b.lo);
    const datum = Number(sentence.match(new RegExp(axis + "=([\\d.]+)m"))?.[1]);
    for (let i = 0; i < intervals.length - 1; i++) {
      const a = intervals[i], b = intervals[i + 1];
      const tangent = Math.abs(a.hi - b.lo) < 1e-6 || Math.abs(b.hi - a.lo) < 1e-6;
      const joinedInside = /겹쳐|들어가|끼워|관통/.test(sentence) &&
        /** @type {("X"|"Y"|"Z")[]} */ (["X", "Y", "Z"]).every((face) => {
          const ap = bounds[a.key][face], bp = bounds[b.key][face];
          return ap.length >= 2 && bp.length >= 2 &&
            Math.min(Math.max(...ap), Math.max(...bp)) -
            Math.max(Math.min(...ap), Math.min(...bp)) > 1e-6;
        });
      const sharedDatum = Number.isFinite(datum) &&
        a.points.some((p) => Math.abs(p - datum) < 1e-6) &&
        b.points.some((p) => Math.abs(p - datum) < 1e-6);
      rows.push({
        id,
        parts: `${a.key}/${b.key}`,
        axis,
        sentence,
        pass: tangent || sharedDatum || joinedInside,
      });
    }
  }
  return rows;
};
