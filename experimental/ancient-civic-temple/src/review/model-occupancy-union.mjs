/** Recover exact part bounds only where the prose supplies every part's datum. */

const number = "[+−-]?\\d+(?:\\.\\d+)?";
/** @param {string} value */
const scalar = (value) => Number(value.replace("−", "-"));
/** @param {number} left @param {number} right */
const close = (left, right) => Math.abs(left - right) < 1e-6;
/** @param {string} value */
const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** @param {string} body @returns {string[]} */
const constructionSentences = (body) => body.split(/^부재 대응:/m)[0]
  .split(/(?<=다\.)\s+|\n+/).filter(Boolean);

/** @param {string} sentence @param {string} noun @returns {number} */
const nounIndex = (sentence, noun) => {
  const match = new RegExp(`(?<![\\p{L}\\p{N}])${escaped(noun)}(?=$|[.,;:()·\\s]|은|는|이|가|을|를|의|와|과|에서|으로|로)`, "u").exec(sentence);
  return match?.index ?? -1;
};

/** @param {string} sentence @returns {Record<string, number[]>} */
const coordinates = (sentence) => {
  /** @type {Record<string, number[]>} */
  const values = { X: [], Y: [], Z: [] };
  for (const match of sentence.matchAll(new RegExp(`([XYZ])=(${number})(?:~(${number}))?`, "g"))) {
    values[match[1]].push(scalar(match[2]));
    if (match[3]) values[match[1]].push(scalar(match[3]));
  }
  for (const match of sentence.matchAll(/\(([XYZ](?:,[XYZ]){1,2})\)=\(([^)]+)\)m/g)) {
    const axes = match[1].split(","), entries = match[2].split(",");
    if (axes.length !== entries.length) continue;
    axes.forEach((axis, index) => {
      const entry = entries[index];
      if (!new RegExp(`^±?${number}$`).test(entry)) return;
      const value = scalar(entry.replace("±", ""));
      values[axis].push(value);
      if (entry.startsWith("±")) values[axis].push(-value);
    });
  }
  for (const match of sentence.matchAll(new RegExp(`([XYZ])=±(${number})`, "g"))) {
    const value = scalar(match[2]);
    values[match[1]].push(-value, value);
  }
  return values;
};

/** @param {string} sentence @param {Record<string, number[]>} values @returns {string[]} */
const expandCircular = (sentence, values) => {
  if (!/원판|원통|원환|원뿔대|회전체/.test(sentence)) return [];
  const radii = [...sentence.matchAll(new RegExp(`(?:바깥 |외)?반지름\\s+(${number})(?:→(${number}))?`, "g"))]
    .flatMap((match) => [match[1], match[2]].filter(Boolean).map(scalar));
  const torus = sentence.match(new RegExp(`중심선 반지름\\s+(${number})m[^\\n]*?관 반지름\\s+(${number})m`));
  if (torus) radii.push(scalar(torus[1]) + scalar(torus[2]));
  if (!radii.length) return [];
  const radius = Math.max(...radii);
  const radial = /X축|축은 X=/.test(sentence) ||
      (/X=/.test(sentence) && !/Y=/.test(sentence) && !/Z=/.test(sentence)) ? ["Y", "Z"]
    : /Z축/.test(sentence) ? ["X", "Y"] : /YZ 평면/.test(sentence) ? ["Y", "Z"] : ["X", "Z"];
  for (const axis of radial) {
    const centers = values[axis].length ? [...values[axis]] : [0];
    values[axis].push(...centers.flatMap((center) => [center - radius, center + radius]));
  }
  return radial;
};

/** @param {string} id @param {string} body */
export const occupancyUnionRows = (id, body) => {
  const boxMatch = body.match(/(?:기본형 )?점유 상자는\s*([\d.]+)×([\d.]+)×([\d.]+)m/);
  if (!boxMatch) return [];
  const box = boxMatch.slice(1).map(Number);
  /** @type {{id:string,axis:string,box:number,union:number,pass:boolean}[]} */
  const rows = [];
  const wholeWidth = body.match(/기본 폭 W=([\d.]+)m/);
  if (wholeWidth) rows.push({ id, axis: "X width", box: box[0], union: Number(wholeWidth[1]), pass: close(box[0], Number(wholeWidth[1])) });
  const outerDiameter = body.match(/바깥 지름은 ([\d.]+)m/);
  if (outerDiameter) for (const axis of ["X diameter", "Z diameter"])
    rows.push({ id, axis, box: box[axis[0] === "X" ? 0 : 2], union: Number(outerDiameter[1]), pass: close(box[axis[0] === "X" ? 0 : 2], Number(outerDiameter[1])) });
  const mapping = body.match(/^부재 대응: (.+)$/m)?.[1];
  if (!mapping) return rows;
  const labels = [...mapping.matchAll(/`([^`]+)`=([^;.]+)/g)].map(([, , label]) => label.trim());
  /** @type {Record<string, number[]>[]} */
  const parts = labels.map(() => ({ X: [], Y: [], Z: [] }));
  /** @type {Record<string, boolean>[]} */
  const sufficient = labels.map(() => ({ X: false, Y: false, Z: false }));
  for (const sentence of constructionSentences(body)) {
    const matches = labels.map((noun, index) => ({ index, at: nounIndex(sentence, noun) }))
      .filter((match) => match.at >= 0);
    if (matches.length !== 1) continue;
    const values = coordinates(sentence);
    const radial = expandCircular(sentence, values);
    const section = sentence.match(new RegExp(`X·Z 각 (${number})m 단면`));
    if (section) for (const axis of ["X", "Z"]) {
      const half = scalar(section[1]) / 2;
      const centers = [...values[axis]];
      values[axis].push(...centers.flatMap((center) => [center - half, center + half]));
    }
    for (const { index: subject } of matches) for (const axis of ["X", "Y", "Z"]) {
      parts[subject][axis].push(...values[axis]);
      const interval = new RegExp(`${axis}=${number}~${number}`).test(sentence);
      sufficient[subject][axis] ||= interval || radial.includes(axis) ||
        (section !== null && (axis === "X" || axis === "Z")) ||
        new Set(values[axis]).size > 1;
    }
  }
  /** @type {Array<[string, number]>} */
  const axes = [["X", 0], ["Y", 1], ["Z", 2]];
  for (const [axis, index] of axes) {
    if (!parts.length || sufficient.some((part) => !part[axis])) continue;
    const all = parts.flatMap((part) => part[axis]);
    const union = Math.max(...all) - Math.min(...all);
    rows.push({ id, axis: `${axis} part union`, box: box[index], union, pass: close(box[index], union) });
  }
  return rows;
};
