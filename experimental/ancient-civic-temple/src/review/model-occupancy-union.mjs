/** Recover measurable bounds from the authored part construction, not summaries. */
const number = "[+−-]?\\d+(?:\\.\\d+)?";
const scalar = (s) => Number(s.replace("−", "-"));
const near = (a, b) => Math.abs(a - b) < 1e-6;
const escape = (s) => s.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
const axes = ["X", "Y", "Z"];

/** @param {string} body */
export const modelParts = (body) => [...(body.match(/^부재 대응: (.+)$/m)?.[1] ?? "")
  .matchAll(/`([^`]+)`=([^;.]+)/g)].map(([, key, noun]) => ({ key, noun: noun.trim() }));
const mentions = (sentence, noun) => new RegExp(
  "(?<![\\p{L}\\p{N}])" + escape(noun) + "(?=$|[.,;:()·\\s]|은|는|이|가|을|를|의|와|과|에서|으로|로)", "u",
).test(sentence);
const expression = (source, width) => {
  const match = source.replaceAll("−", "-").match(/^W\/2([+-]\d+(?:\.\d+)?)?$/);
  return match ? width / 2 + Number(match[1] ?? 0) : NaN;
};

/** @param {string} body @param {number} [width] */
export const partBounds = (body, width = NaN) => {
  const parts = modelParts(body);
  /** @type {Record<string, {X:number[],Y:number[],Z:number[],summary:{X:number[][],Y:number[][],Z:number[][]}}>} */
  const result = Object.fromEntries(parts.map(({ key }) => [key, {
    X: [], Y: [], Z: [], summary: { X: [], Y: [], Z: [] },
  }]));
  const construction = body.split(/^부재 대응:/m)[0].replace(/\[[^\]]+\]\([^)]*\)/g, "");
  const sentences = construction.replace(/이고, (?=[가-힣]+(?:은|는) Z=)/g, "다. ")
    .split(/(?<=다\.)\s+|\n+/).filter(Boolean);
  const ground = /원점[^.\n]*(?:바닥|지면|아래면)/.test(construction);
  const backOrigin = /원점[^.\n]*뒷변/.test(construction) && /앞은[^.\n]*\+Z/.test(construction);
  const add = (part, axis, a, b) => {
    if (part && Number.isFinite(a) && Number.isFinite(b)) result[part][axis].push(a, b);
  };
  let previous = "";
  for (const sentence of sentences) {
    const firstGeometry = sentence.search(/(?:[XYZ]=|반지름|폭 |깊이 |높이 |두께 |중심선)/);
    const prefix = firstGeometry < 0 ? sentence : sentence.slice(0, firstGeometry);
    const named = parts.filter(({ key, noun }) =>
      mentions(prefix, noun) || mentions(prefix, noun.split(" ")[0]) || prefix.includes("`" + key + "`"));
    const afterCentre = sentence.match(/중심 \(X,Z\).*?([가-힣]+) 두 개가/);
    const located = afterCentre && parts.find(({ noun }) => mentions(afterCentre[1], noun));
    const later = /^(?:[XYZ]=|반지름 |t=)/.test(sentence) ?
      parts.map((p) => ({ ...p, at: sentence.indexOf(p.noun) }))
        .filter((p) => p.at >= 0).sort((a, b) => a.at - b.at) : [];
    const subject = located?.key ?? (named.length === 1 ? named[0].key :
      later.length ? later[0].key : "");
    if (subject) previous = subject;
    const part = subject || (/^중심선|^관의 바깥|^t=/.test(sentence) ? previous : "");
    if (!part) continue;
    const bounds = result[part];
    for (const match of sentence.matchAll(new RegExp("([XYZ])=(" + number + ")~(" + number + ")m", "g"))) {
      const axis = match[1], a = scalar(match[2]), b = scalar(match[3]);
      if (/^(?:두 )?[^.]+는 [XYZ]=/.test(sentence) && bounds[axis].length)
        bounds.summary[axis].push([Math.min(a, b), Math.max(a, b)]);
      else add(part, axis, a, b);
    }
    for (const match of sentence.matchAll(new RegExp("([XYZ]) 범위는 (" + number + ")~(" + number + ")m", "g")))
      add(part, match[1], scalar(match[2]), scalar(match[3]));
    for (const match of sentence.matchAll(new RegExp("([XYZ])=(" + number + ")m", "g")))
      if (!new RegExp(match[1] + "=" + match[2] + "~").test(sentence))
        add(part, match[1], scalar(match[2]), scalar(match[2]));
    const widths = Object.fromEntries([...sentence.matchAll(new RegExp(
      "(폭|깊이|높이|두께|연직 두께) (" + number + ")m", "g",
    ))].reverse().map((match) => [match[1], scalar(match[2])]));
    const center = sentence.match(/중심(?:은|\s*)\s*\((X,Y,Z|X,Z)\)=\(([^)]+)\)m/);
    if (center) {
      const labels = center[1].split(","), entries = center[2].split(",");
      if (labels.length === entries.length) labels.forEach((axis, i) => {
        const entry = entries[i], v = scalar(entry.replace("±", ""));
        add(part, axis, entry.startsWith("±") ? -v : v, v);
      });
    }
    const symbolic = sentence.match(/X=±\((W\/2[+−-]\d+(?:\.\d+)?)\)m/);
    if (symbolic) { const x = expression(symbolic[1], width); add(part, "X", -x, x); }
    const simpleX = sentence.match(new RegExp("X=±(" + number + ")m"));
    if (simpleX) add(part, "X", -scalar(simpleX[1]), scalar(simpleX[1]));
    const seriesX = sentence.match(new RegExp("X=(" + number + ")m, 0, \\+(" + number + ")m"));
    if (seriesX) add(part, "X", scalar(seriesX[1]), scalar(seriesX[2]));
    const centreSeries = sentence.match(new RegExp("중심 X=±(" + number + ")m·Y=(" + number + ")m·Z=(" + number + ")"));
    if (centreSeries) {
      add(part, "X", -scalar(centreSeries[1]), scalar(centreSeries[1]));
      add(part, "Y", scalar(centreSeries[2]), scalar(centreSeries[2]));
      add(part, "Z", scalar(centreSeries[3]), scalar(centreSeries[3]));
    }
    const line = sentence.match(new RegExp(
      "\\(Y,Z\\)=\\((" + number + "),(" + number + ")\\)m에서 \\(("+ number + "),(" + number + ")\\)m",
    ));
    if (line) {
      const y0 = scalar(line[1]), z0 = scalar(line[2]), y1 = scalar(line[3]), z1 = scalar(line[4]);
      const halfY = (widths["연직 두께"] ?? 0) / 2;
      add(part, "Y", Math.min(y0, y1) - halfY, Math.max(y0, y1) + halfY);
      add(part, "Z", Math.min(z0, z1), Math.max(z0, z1));
    }
    const pointProfile = sentence.match(/\(Y,반지름\)=/);
    if (pointProfile) {
      for (const p of sentence.matchAll(/\(([\d.]+),([\d.]+)\)/g)) {
        add(part, "Y", Number(p[1]), Number(p[1]));
        add(part, "X", -Number(p[2]), Number(p[2]));
        add(part, "Z", -Number(p[2]), Number(p[2]));
      }
    }
    const ellipse = sentence.match(/\(X,Y,Z\)=\(([\d.]+) cos t,([\d.]+)\+([\d.]+) sin t,0\)/);
    if (ellipse) {
      const tube = construction.match(/관 반지름 ([\d.]+)m/);
      if (tube) {
        const [horizontal, bottom, rise, radius] = [ellipse[1], ellipse[2], ellipse[3], tube[1]].map(Number);
        add(part, "X", -horizontal - radius, horizontal + radius);
        add(part, "Y", bottom - radius, bottom + rise + radius);
        add(part, "Z", -radius, radius);
      }
    }
    const outerFrustum = sentence.match(/Y=([\d.]+)에서 반지름 [\d.]+m, Y=([\d.]+)m에서 반지름/);
    if (outerFrustum) add(part, "Y", Number(outerFrustum[1]), Number(outerFrustum[2]));
    if (widths.폭 && !bounds.X.length) add(part, "X", -widths.폭 / 2, widths.폭 / 2);
    if (widths.깊이 && !bounds.Z.length) add(part, "Z", backOrigin ? 0 : -widths.깊이 / 2,
      backOrigin ? widths.깊이 : widths.깊이 / 2);
    if (widths.높이 && !bounds.Y.length && ground) add(part, "Y", 0, widths.높이);
    if (widths.폭 && bounds.X.length === 2 && /두 중심은 X=±/.test(sentence)) {
      const points = [...bounds.X];
      add(part, "X", Math.min(...points) - widths.폭 / 2, Math.max(...points) + widths.폭 / 2);
    }
    const upper = sentence.match(new RegExp("윗면 Y=(" + number + ")m"));
    if (upper && widths.두께 && !bounds.Y.length)
      add(part, "Y", scalar(upper[1]) - widths.두께, scalar(upper[1]));
    const radii = [...sentence.matchAll(new RegExp(
      "(?:(?:바깥|외|아래|위|바닥|윗입)\\s*)?반지름(?:은)?\\s*(" + number + ")(?:→(" + number + "))?m", "g",
    ))].flatMap((match) => [match[1], match[2]].filter(Boolean).map(scalar));
    if (radii.length && (/원판|원통|원환|원뿔대|회전체|컵|몸체|발/.test(sentence) ||
      /Y=[+−-]?[\d.]+~[+−-]?[\d.]+m/.test(sentence))) {
      const radius = Math.max(...radii);
      const alongX = /X축|YZ 평면/.test(sentence) ||
        (/X=/.test(sentence) && /원통/.test(sentence) && !/Y=.{0,8}~/.test(sentence));
      for (const axis of alongX ? ["Y", "Z"] : ["X", "Z"]) {
        const centers = bounds[axis].length ? [...bounds[axis]] : [0];
        add(part, axis, Math.min(...centers) - radius, Math.max(...centers) + radius);
      }
      if (alongX && widths.두께) {
        const centers = bounds.X.length ? [...bounds.X] : [0];
        add(part, "X", Math.min(...centers) - widths.두께 / 2, Math.max(...centers) + widths.두께 / 2);
      }
    }
    const torus = sentence.match(/중심선 반지름[^\n]*?관 반지름[^\n]*?([\d.]+)m/);
    if (torus) {
      const majors = [...torus[0].split("관 반지름")[0].split("중심 높이")[0]
        .matchAll(/([\d.]+)m/g)].map((match) => Number(match[1]));
      const radius = Math.max(...majors) + scalar(torus[1]);
      add(part, "X", -radius, radius); add(part, "Z", -radius, radius);
    }
    const centerTriple = sentence.match(/중심은 모두 \(0,([\d.]+),0\)m/);
    if (centerTriple) {
      const tube = construction.match(/관 반지름은 ([\d.]+)m/);
      if (tube) add(part, "Y", Number(centerTriple[1]) - Number(tube[1]),
        Number(centerTriple[1]) + Number(tube[1]));
    }
    const section = sentence.match(new RegExp("X·Z 각 (" + number + ")m 단면"));
    if (section) for (const axis of ["X", "Z"]) {
      const centers = [...bounds[axis]], half = scalar(section[1]) / 2;
      if (centers.length) add(part, axis, Math.min(...centers) - half, Math.max(...centers) + half);
    }
  }
  return result;
};

/** Each recoverable part must fit; if all parts resolve, their union must fill. */
/** @param {string} id @param {string} body */
export const occupancyUnionRows = (id, body) => {
  const match = body.match(/(?:기본형 |닫힌 전체 )?점유 상자는[^\d\n]*?([\d.]+)×([\d.]+)×([\d.]+)m/);
  if (!match) return [];
  const box = match.slice(1).map(Number);
  const ground = /원점[^.\n]*(?:바닥|지면|아래면)/.test(body);
  const backOrigin = /원점[^.\n]*뒷변/.test(body) && /앞은[^.\n]*\+Z/.test(body);
  const width = Number(body.match(/기본 폭 W=([\d.]+)m/)?.[1]);
  const parts = partBounds(body, width);
  /** @type {{id:string,part:string,axis:string,kind:string,box:number,union:number,pass:boolean}[]} */
  const rows = [];
  for (const [part, bounds] of Object.entries(parts)) for (let i = 0; i < 3; i++) {
    const axis = axes[i], points = bounds[axis];
    if (!points.length) continue;
    const lo = Math.min(...points), hi = Math.max(...points), half = box[i] / 2;
    rows.push({ id, part, axis, kind: "containment", box: box[i], union: hi - lo,
      pass: axis === "Y" && ground ? lo >= -1e-6 && hi <= box[i] + 1e-6 :
        axis === "Z" && backOrigin ? lo >= -1e-6 && hi <= box[i] + 1e-6 :
        hi - lo <= box[i] + 1e-6 });
    for (const [a, b] of bounds.summary[axis])
      rows.push({ id, part, axis, kind: "summary", box: box[i], union: b - a,
        pass: near(lo, a) && near(hi, b) });
  }
  for (let i = 0; i < 3; i++) {
    const axis = axes[i], all = Object.values(parts);
    if (!all.length || all.some((part) => part[axis].length < 2 ||
      near(Math.max(...part[axis]), Math.min(...part[axis])))) continue;
    const points = all.flatMap((part) => part[axis]);
    const extent = Math.max(...points) - Math.min(...points);
    rows.push({ id, part: "all", axis, kind: "union", box: box[i], union: extent, pass: near(extent, box[i]) });
  }
  return rows;
};
