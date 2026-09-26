import { modelParts, partBounds } from "./model-occupancy-union.mjs";
import { partContactRows } from "./model-part-contact.mjs";
import { shapeRelationRows } from "./model-shape-relations.mjs";

/** A centred rotational primitive can disprove a misleading AABB overlap. */
/** @param {{key:string;noun:string}} part @param {string} source @param {number | null} cavityRadius */
const radialBand = (part, source, cavityRadius) => {
  const noun = part.noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const annulus = source.match(new RegExp(`${noun} 벽은 바깥 지름 ([\\d.]+)m·두께 ([\\d.]+)m의 원환 벽`));
  if (annulus) return [Number(annulus[1]) / 2 - Number(annulus[2]), Number(annulus[1]) / 2];
  if (part.noun.includes("안쪽 바닥") && cavityRadius !== null) return [0, cavityRadius];
  const disc = source.match(new RegExp(`${noun}은[^.\\n]*?지름 ([\\d.]+)m 원판`));
  if (disc) {
    const opening = source.match(new RegExp(`${noun} 원판은[^\\n]*?반지름 ([\\d.]+)m 안쪽을 비워`));
    return [opening ? Number(opening[1]) : 0, Number(disc[1]) / 2];
  }
  const cylinder = source.match(new RegExp(`${noun} 받침은 반지름 ([\\d.]+)m 원통`));
  if (cylinder) return [0, Number(cylinder[1])];
  const cone = source.match(new RegExp(`${noun}(?:은|는)[^\\n]*?원뿔대\\(아래 반지름 ([\\d.]+)m, 위 ([\\d.]+)m\\)`));
  if (cone) return [0, Math.max(Number(cone[1]), Number(cone[2]))];
  const wave = source.match(new RegExp(`중심선 반지름 ([\\d.]+)m의 낮은 ${noun} 고리`));
  const width = source.match(/파문 단면은 수평 폭 ([\d.]+)m/);
  if (wave && width) return [Number(wave[1]) - Number(width[1]) / 2,
    Number(wave[1]) + Number(width[1]) / 2];
  return null;
};

/** Split repeated physical components before testing box intersections. */
/** @param {{key:string;noun:string}} part @param {{X:number[];Y:number[];Z:number[]}} box @param {string} source */
const componentBoxes = (part, box, source) => {
  const ranges = [];
  const noun = part.noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ownY = source.match(new RegExp(`${noun}(?:은|는) Y=([\\d.]+)~([\\d.]+)m`));
  if (ownY) box = { ...box, Y: [Number(ownY[1]), Number(ownY[2])] };
  // A bent plate is the union of its authored straight segments, not the
  // rectangular hull spanning the air between them.
  if (/꺾인 판/.test(source) && part.noun.includes("걸쇠")) {
    const segments = [...source.matchAll(/(?:아래|윗) 구간은 Y=([\d.]+)~([\d.]+)m·Z=([+−][\d.]+)~([+−][\d.]+)m/g)];
    if (segments.length === 2) return segments.map((m) => ({ X: box.X,
      Y: [Number(m[1]), Number(m[2])],
      Z: [Number(m[3].replace("−", "-")), Number(m[4].replace("−", "-"))] }));
  }
  if (/꺾인 금속판/.test(source) && part.noun === "띠") {
    const lower = source.match(/몸체 뒷면 Z=−[\d.]+m에 닿는 구간 Y=([\d.]+)~([\d.]+)m/);
    const upper = source.match(/뚜껑 뒷면 Z=−[\d.]+m에 닿는 구간 Y=([\d.]+)~([\d.]+)m/);
    const backs = source.match(/몸체 쪽 띠는 Z=(−[\d.]+)~(−[\d.]+)m, 뚜껑 쪽 띠는 Z=(−[\d.]+)~(−[\d.]+)m/);
    const corners = source.match(/두께이고 Y=([\d.]+)~([\d.]+)m로 이어진다/);
    if (lower && upper && backs && corners) {
      /** @param {string} s */
      const signed = (s) => Number(s.replace("−", "-"));
      return [
        { X: box.X, Y: [Number(lower[1]), Number(lower[2])], Z: [signed(backs[1]), signed(backs[2])] },
        { X: box.X, Y: [Number(upper[1]), Number(upper[2])], Z: [signed(backs[3]), signed(backs[4])] },
        { X: box.X, Y: [Number(corners[1]), Number(corners[2])], Z: box.Z },
      ];
    }
  }
  if (/선반 판|가로판/.test(part.noun)) {
    const clear = source.match(/판(?:은| 모두)[^\n]*?X=−([\d.]+)~\+([\d.]+)m/);
    if (clear) box = { ...box, X: [-Number(clear[1]), Number(clear[2])] };
  }
  if (/가로판/.test(part.noun)) {
    const intervals = [];
    for (const name of ["아래판", "위판", "중간 가로판"]) {
      const clause = source.match(new RegExp(`${name}(?:은|의)[^\\n]*?(?=\\. |$)`))?.[0] ?? "";
      for (const match of clause.matchAll(/Y=([\d.]+)~([\d.]+)m/g))
        intervals.push([Number(match[1]), Number(match[2])]);
    }
    if (intervals.length >= 3) return intervals.map((y) => ({ X: box.X, Y: y, Z: box.Z }));
  }
  if (/칸막이/.test(part.noun)) {
    const clause = source.match(/칸막이는 다섯 열린 높이 구간 ([^\n]*?)마다/)?.[1] ?? "";
    const intervals = [...clause.matchAll(/(?:Y=)?([\d.]+)~([\d.]+)m/g)]
      .map((match) => [Number(match[1]), Number(match[2])]);
    if (intervals.length >= 3) return intervals.map((y) => ({ X: box.X, Y: y, Z: box.Z }));
  }
  if (part.noun.includes("측판")) {
    const gauge = source.match(/측판(?:·위판·아래판)? 두께 ([\d.]+)m/);
    if (gauge) {
      const t = Number(gauge[1]), left = Math.min(...box.X), right = Math.max(...box.X);
      ranges.push([left, left + t], [right - t, right]);
    }
  }
  if (part.noun.includes("바퀴") && /바퀴 중심은 \(X,Y,Z\)=\(±/.test(source)) {
    const center = source.match(/바퀴 중심은 \(X,Y,Z\)=\(±([\d.]+),/);
    const thickness = source.match(/바퀴 중심은[^\n]*?두께 ([\d.]+)m/);
    if (center && thickness) {
      const c = Number(center[1]), half = Number(thickness[1]) / 2;
      ranges.push([-c - half, -c + half], [c - half, c + half]);
    }
  }
  return ranges.length ? ranges.map((x) => ({ X: x, Y: box.Y, Z: box.Z })) : [box];
};

/** A pitched or mono-pitch slab meets a wall when both authored wall tops
 * equal the corresponding roof undersides. Missing terms are not proof. */
/** @param {string} source */
const roofWallTangent = (source) => {
  const thickness = Number(source.match(/slab 두께는 연직 ([\d.]+)m/)?.[1]);
  const gableEave = source.match(/지붕 윗면은 처마 끝 Z=±([\d.]+)m에서 Y=([\d.]+)m, 중심에서 `([\d.]+)\+([\d.]+)×tan\(([\d.]+)°\)=([\d.]+)m`/);
  const gableSide = source.match(/지붕 아랫면 `([\d.]+)\+([\d.]+)×tan\(([\d.]+)°\)−([\d.]+)=([\d.]+)m`까지/);
  const gableRidge = source.match(/중심 높이 `([\d.]+)−([\d.]+)=([\d.]+)m`까지/);
  const monoTop = source.match(/앞벽선 Z=\+([\d.]+)m의 지붕 윗면 Y=([\d.]+)m에서 뒤쪽으로 ([\d.]+)° 올라가므로 뒤벽선 Z=−([\d.]+)m의 윗면은 `([\d.]+)\+([\d.]+)×tan\(([\d.]+)°\)=([\d.]+)m`/);
  const monoWalls = source.match(/앞벽은 Y=([\d.]+)m, 뒤벽은 Y=([\d.]+)m까지 닫히며/);
  if (!Number.isFinite(thickness) || !gableEave || !gableSide || !gableRidge ||
    !monoTop || !monoWalls) return null;
  /** @param {RegExpMatchArray} m @param {number} i */
  const n = (m, i) => Number(m[i]);
  /** @param {number} a @param {number} b @param {number} [tolerance] */
  const close = (a, b, tolerance = 0.001) => Math.abs(a - b) <= tolerance;
  const gableAngle = n(gableEave, 5) * Math.PI / 180;
  const monoAngle = n(monoTop, 3) * Math.PI / 180;
  return close(n(gableEave, 1), n(gableEave, 4)) &&
    close(n(gableEave, 6), n(gableEave, 3) + n(gableEave, 4) * Math.tan(gableAngle)) &&
    close(n(gableSide, 5), n(gableSide, 1) + n(gableSide, 2) * Math.tan(n(gableSide, 3) * Math.PI / 180) - n(gableSide, 4)) &&
    close(n(gableSide, 4), thickness, 1e-6) &&
    close(n(gableSide, 1), n(gableEave, 2), 1e-6) &&
    close(n(gableSide, 3), n(gableEave, 5), 1e-6) &&
    close(n(gableRidge, 1), n(gableEave, 6), 1e-6) &&
    close(n(gableRidge, 2), thickness, 1e-6) &&
    close(n(gableRidge, 3), n(gableRidge, 1) - thickness) &&
    close(n(monoTop, 1), n(monoTop, 4), 1e-6) &&
    close(n(monoTop, 2), n(monoTop, 5), 1e-6) &&
    close(n(monoTop, 3), n(monoTop, 7), 1e-6) &&
    close(n(monoTop, 6), n(monoTop, 1) + n(monoTop, 4), 1e-6) &&
    close(n(monoTop, 8), n(monoTop, 5) + n(monoTop, 6) * Math.tan(monoAngle)) &&
    close(n(monoWalls, 1), n(monoTop, 2) - thickness) &&
    close(n(monoWalls, 2), n(monoTop, 8) - thickness);
};

/** Cut timber ends are checked at their authored host faces; the uncut
 * diagonal AABB is never a collision primitive. */
/** @param {string} source */
const cutBeamTangencies = (source) => {
  const principal = source.match(/Yprincipal\(\|X\|\)=([\d.]+)\+\(([\d.]+)−\|X\|\)tan\(([\d.]+)°\)−([\d.]+)\/cos\(([\d.]+)°\)/);
  const lower = source.match(/Yprincipal−([\d.]+)\/cos\(([\d.]+)°\)/);
  const king = source.match(/가운데 기둥\(([\d.]+)×([\d.]+)m\)[^\n]*?\|X\|≤([\d.]+)m[^\n]*?중심 높이 약 ([\d.]+)m/);
  const foot = source.match(/발끝 중심은 가운데 기둥의 양 측면 X=±([\d.]+)m·Y=([\d.]+)m/);
  const tip = source.match(/끝 중심은 각 경사재의 수평 구간 중간 X=±([\d.]+)m에서 그 아랫면 Y≈([\d.]+)m/);
  const cutClaim = source.split(/(?<=다\.)\s+/).some((sentence) =>
    /^\s*버팀재 위끝/.test(sentence) && /경사재/.test(sentence) &&
    /가운데 기둥/.test(sentence) && /절삭/.test(sentence));
  if (!principal || !lower || !king || !foot || !tip || !cutClaim ||
    !/V형 절삭면/.test(source)) return null;
  const angle = Number(principal[3]) * Math.PI / 180;
  /** @param {number} x */
  const underside = (x) => Number(principal[1]) +
    (Number(principal[2]) - Math.abs(x)) * Math.tan(angle) -
    Number(principal[4]) / Math.cos(angle) - Number(lower[1]) / Math.cos(angle);
  const kingWidth = Number(king[1]), kingHalf = Number(king[3]);
  /** @type {Record<string, boolean>} */
  return {
    "principal/king-post": Math.abs(kingHalf - kingWidth / 2) < 1e-6 &&
      Math.abs(Number(king[4]) - underside(0)) < 0.001 &&
      Number(lower[2]) === Number(principal[3]) &&
      Number(principal[5]) === Number(principal[3]),
    "principal/strut": Math.abs(Number(tip[2]) - underside(Number(tip[1]))) < 0.001 &&
      Number(tip[1]) > Number(foot[1]) && Number(tip[2]) > Number(foot[2]),
    "king-post/strut": Math.abs(Number(foot[1]) - kingWidth / 2) < 1e-6,
  };
};

/** The two feet of an arched cover meet the ledge tops while its cavity
 * remains empty. Its full rectangular hull includes that cavity. */
/** @param {string} source */
const archFeetTangent = (source) => {
  const centre = source.match(/이음선 X=\+([\d.]+)m/);
  const radii = source.match(/바깥 반지름은 Z=[\d.]+m에서 ([\d.]+)m, Z=[\d.]+m에서 ([\d.]+)m/);
  const toes = source.match(/두 발의 X는 시작에서 ([\d.]+)\/([\d.]+)m, 끝에서 ([\d.]+)\/([\d.]+)m/);
  const supports = source.match(/왼발은[^\n]*?턱\(\+([\d.]+)~\+([\d.]+)m\), 오른발은[^\n]*?턱\(\+([\d.]+)~\+([\d.]+)m\) 위에서 Y=([\d.]+)m에 닿는다/);
  const ledge = source.match(/Y=([\d.]+)~([\d.]+)m의 폭 [\d.]+m 턱/);
  const footWidth = source.match(/양 발의 ([\d.]+)m 폭이 각 턱 안에/);
  if (!centre || !radii || !toes || !supports || !ledge || !footWidth) return null;
  const c = Number(centre[1]), half = Number(footWidth[1]) / 2;
  const positions = toes.slice(1).map(Number), r = radii.slice(1).map(Number);
  const left = supports.slice(1, 3).map(Number), right = supports.slice(3, 5).map(Number);
  /** @param {number} x @param {number[]} bounds */
  const within = (x, bounds) => x - half >= bounds[0] - 1e-6 && x + half <= bounds[1] + 1e-6;
  return Math.abs(Number(supports[5]) - Number(ledge[2])) < 1e-6 &&
    Math.abs(positions[0] - (c - r[0])) < 1e-6 &&
    Math.abs(positions[1] - (c + r[0])) < 1e-6 &&
    Math.abs(positions[2] - (c - r[1])) < 1e-6 &&
    Math.abs(positions[3] - (c + r[1])) < 1e-6 &&
    within(positions[0], left) && within(positions[2], left) &&
    within(positions[1], right) && within(positions[3], right);
};

/** Conservative 3D overlap audit for independently named solid parts. */
/** @param {string} id @param {string} body */
export const partOverlapRows = (id, body) => {
  const parts = modelParts(body), bounds = partBounds(body);
  if (parts.length < 2) return [];
  const construction = body.split(/^부재 대응:/m)[0].replace(/<!--[\s\S]*?-->/g, "");
  const declaration = body.split(/^부재 대응:/m)[1] ?? "";
  /** @param {{key:string;noun:string}} part */
  const zeroVolumeSurface = (part) => {
    const noun = part.noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const followingKey = declaration.split("`" + part.key + "`").slice(1);
    return new RegExp(`${noun} 면을 따로 가진다`).test(construction) ||
      followingKey.some((fragment) => fragment.startsWith("(") && fragment.split(")")[0].includes("면"));
  };
  const cavity = construction.match(/바깥 지름 ([\d.]+)m·두께 ([\d.]+)m의 원환 벽/);
  const cavityRadius = cavity ? Number(cavity[1]) / 2 - Number(cavity[2]) : null;
  const bands = Object.fromEntries(parts.map((part) =>
    [part.key, radialBand(part, construction, cavityRadius)]));
  const contacts = partContactRows(id, body), shapes = shapeRelationRows(id, body);
  const cutBeams = cutBeamTangencies(construction);
  const sentences = construction.split(/(?<=다\.)\s+|\n+/).filter((sentence) =>
    /겹쳐|들어가|끼워|관통한다|중심(?: 사이)?(?:을|를|의)?.*잇/.test(sentence) &&
    !/검토 판|실패다/.test(sentence));
  /** @param {string} sentence @param {{key:string;noun:string}} part */
  const named = (sentence, part) => {
    const noun = part.noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return sentence.includes(`\`${part.key}\``) ||
      part.key === "body" && /(?<![\p{L}\p{N}])몸체(?=$|[.,;:()·\s]|은|는|이|가|을|를|의|와|과|에|에서|으로|로)/u.test(sentence) ||
      new RegExp(`(?<![\\p{L}\\p{N}])${noun}(?=$|[.,;:()·\\s]|은|는|이|가|을|를|의|와|과|에|에서|으로|로)`, "u")
        .test(sentence);
  };
  const rows = [];
  for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
    const a = parts[i], b = parts[j], ab = bounds[a.key], bb = bounds[b.key];
    if (zeroVolumeSurface(a) || zeroVolumeSurface(b)) continue;
    if ([a.noun, b.noun].includes("벽") && [a.noun, b.noun].includes("지붕") &&
      roofWallTangent(construction)) continue;
    if ([a.noun, b.noun].includes("평기와") && [a.noun, b.noun].includes("둥근기와") &&
      archFeetTangent(construction)) continue;
    if (!(/** @type {("X"|"Y"|"Z")[]} */ (["X", "Y", "Z"]))
      .every((axis) => ab[axis].length >= 2 && bb[axis].length >= 2)) continue;
    const candidateDepths = componentBoxes(a, ab, construction).flatMap((ac) =>
      componentBoxes(b, bb, construction).map((bc) =>
        /** @type {("X"|"Y"|"Z")[]} */ (["X", "Y", "Z"]).map((axis) =>
          Math.min(Math.max(...ac[axis]), Math.max(...bc[axis])) -
          Math.max(Math.min(...ac[axis]), Math.min(...bc[axis])))));
    const intersections = candidateDepths.filter((set) => set.every((depth) => depth > 1e-6));
    if (!intersections.length) continue;
    const depths = intersections[0];
    const ra = bands[a.key], rb = bands[b.key];
    if (ra && rb && (ra[1] <= rb[0] + 1e-6 || rb[1] <= ra[0] + 1e-6)) continue;
    /** @param {{parts?:string}} relation */
    const samePair = (relation) => relation.parts === `${a.key}/${b.key}` ||
      relation.parts === `${b.key}/${a.key}`;
    const cutKey = `${a.key}/${b.key}`;
    if (cutBeams && Object.hasOwn(cutBeams, cutKey) && cutBeams[cutKey]) continue;
    const clearances = shapes.filter((row) => samePair(row) &&
      /clearance|separation|zero-volume/.test(row.kind));
    if (clearances.length && clearances.every((row) => row.pass)) continue;
    if (contacts.some((row) => samePair(row) && row.pass)) continue;
    const relationSentence = sentences.find((sentence) => named(sentence, a) && named(sentence, b));
    const depthClaim = relationSentence?.match(/([\d.]+)m (?:안으로 )?들어가/);
    const depthAxis = relationSentence && /X 방향으로/.test(relationSentence) ? 0 :
      relationSentence && /Y=/.test(relationSentence) ? 1 :
        relationSentence && /Z 방향으로/.test(relationSentence) ? 2 : null;
    const claimedDepthMatches = !depthClaim || depthAxis === null ||
      intersections.every((set) => Math.abs(set[depthAxis] - Number(depthClaim[1])) < 1e-6);
    rows.push({ id, parts: `${a.key}/${b.key}`, depths,
      relationSentence: relationSentence ?? "", pass: Boolean(relationSentence) && claimedDepthMatches });
  }
  return rows;
};
