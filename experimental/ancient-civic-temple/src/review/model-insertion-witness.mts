import { curvedVesselInsertionMargins } from "./model-curved-insertion.mjs";

/**
 * Find authored surface points strictly inside the joined solid. Each margin
 * is a section clearance in metres for one named attachment, not an AABB overlap.
 * Unknown constructions fail closed so a new joint needs its own section rule.
 */

const numbers = (text: string) => (text.match(/[+−-]?\d+(?:\.\d+)?/g) ?? [])
  .map((value) => Number(value.replace("−", "-")));

const profileRadius = (profile: string, y: number) => {
  const points = [...profile.matchAll(/\(([\d.]+),([\d.]+)\)/g)]
    .map((match) => [Number(match[1]), Number(match[2])]);
  for (let i = 1; i < points.length; i++) {
    const [a, r0] = points[i - 1], [b, r1] = points[i];
    if (y >= Math.min(a, b) && y <= Math.max(a, b))
      return r0 + (r1 - r0) * (y - a) / (b - a);
  }
  return null;
};

const semicircleEnds = (source: string) => {
  const body = source.match(/Y=0에서 반지름 ([\d.]+)m, Y=([\d.]+)m에서 반지름 ([\d.]+)m/);
  const path = source.match(/\(X,Y,Z\)=\(([\d.]+) cos t,([\d.]+)\+([\d.]+) sin t,0\)/);
  const inner = source.match(/Y=([\d.]+)m에서 반지름 ([\d.]+)m부터 입 아래 반지름 ([\d.]+)m/);
  const tube = source.match(/관 반지름 ([\d.]+)m·둘레 (\d+)분할/);
  const segments = source.match(/t=0\.\.π를 (\d+)등분/);
  const bodySides = source.match(/(\d+)분할 원뿔대/);
  if (!body || !path || !inner || !tube || !segments || !bodySides) return null;
  const [, lower, height, upper] = body.map(Number);
  const [, x, y, rise] = path.map(Number);
  const next = Math.PI / Number(segments[1]);
  const dx = x * (Math.cos(next) - 1), dy = rise * Math.sin(next);
  const length = Math.hypot(dx, dy), radius = Number(tube[1]);
  if (length <= 0 || radius <= 0 || Number(tube[2]) < 3) return null;
  const step = 2 * Math.PI / Number(bodySides[1]);
  let maximum = -Infinity;
  for (let i = 0; i < Number(tube[2]); i++) {
    const angle = 2 * Math.PI * i / Number(tube[2]);
    const px = x + radius * dy / length * Math.sin(angle);
    const py = y - radius * dx / length * Math.sin(angle);
    const pz = radius * Math.cos(angle);
    if (py < Number(inner[1]) || py > height) continue;
    const theta = Math.atan2(-pz, px);
    const offset = Math.abs(((theta + step / 2 + 2 * Math.PI) % step) - step / 2);
    const factor = Math.cos(step / 2) / Math.cos(step / 2 - offset);
    const radial = Math.hypot(px, pz);
    const outside = (lower + (upper - lower) * py / height) * factor - radial;
    const inside = radial - (Number(inner[2]) +
      (Number(inner[3]) - Number(inner[2])) * (py - Number(inner[1])) /
      (height - Number(inner[1]))) * factor;
    maximum = Math.max(maximum, Math.min(outside, inside));
  }
  return [maximum, maximum];
};

const torusInsertion = (source: string) => {
  const ring = source.match(/중심선 반지름 ([\d.]+)m, 관 반지름 ([\d.]+)m/);
  const center = source.match(/중심 \(X,Y,Z\)=\(±([\d.]+),([\d.]+),0\)/);
  const outer = source.match(/바깥 윤곽은 ([^\n]+?)m의 직선 연결/);
  const inner = source.match(/입 안쪽은 ([^\n]+?)m의 직선 연결 뒤 Y=([\d.]+)m/);
  const divisions = source.match(/원환은 주환 (\d+)분할·관 (\d+)분할/);
  const bodySides = source.match(/몸체 회전 (\d+)분할/);
  if (!ring || !center || !outer || !inner || !divisions || !bodySides) return null;
  const major = Number(ring[1]), minor = Number(ring[2]);
  const cx = Number(center[1]), cy = Number(center[2]);
  if (major <= 0 || minor <= 0 || Number(divisions[1]) < 3 ||
      Number(divisions[2]) < 3) return null;
  const step = 2 * Math.PI / Number(bodySides[1]);
  let maximum = -Infinity;
  for (let i = 0; i < Number(divisions[1]); i++)
    for (let j = 0; j < Number(divisions[2]); j++) {
      const phi = 2 * Math.PI * i / Number(divisions[1]);
      const psi = 2 * Math.PI * j / Number(divisions[2]);
      const px = cx + (major + minor * Math.cos(psi)) * Math.cos(phi);
      const py = cy + (major + minor * Math.cos(psi)) * Math.sin(phi);
      const pz = minor * Math.sin(psi);
      const outerR = profileRadius(outer[1], py);
      if (outerR === null) continue;
      const theta = Math.atan2(-pz, px);
      const offset = Math.abs(((theta + step / 2 + 2 * Math.PI) % step) - step / 2);
      const factor = Math.cos(step / 2) / Math.cos(step / 2 - offset);
      const radial = Math.hypot(px, pz);
      const innerR = py > Number(inner[2]) ? profileRadius(inner[1], py) : null;
      const margin = Math.min(outerR * factor - radial,
        innerR === null ? Infinity : radial - innerR * factor);
      maximum = Math.max(maximum, margin);
    }
  return [maximum, maximum];
};

const coaxialCylinderInsertion = (source: string) => {
  const stem = source.match(/줄기는 반지름 ([\d.]+)m 원통/);
  const beads = source.match(/중심 Y=([\d.]+)m와 ([\d.]+)m[^\n]*반지름 ([\d.]+)m·높이 ([\d.]+)m 원통/);
  const range = source.match(/원판 윗면 Y=([\d.]+)m부터[^\n]*윗끝 Y=([\d.]+)m/);
  if (!stem || !beads || !range) return null;
  return [Number(beads[1]), Number(beads[2])].map((y) => Math.min(
    Number(stem[1]), Number(beads[3]), Number(beads[4]) / 2,
    y - Number(range[1]), Number(range[2]) - y,
  ));
};

const wheelAxleInsertion = (source: string) => {
  const wheel = source.match(/바퀴 중심은 \(X,Y,Z\)=\(±([\d.]+),([\d.]+),([\d.]+)\)m, 반지름 ([\d.]+)m·두께 ([\d.]+)m/);
  const axle = source.match(/축은 X=−([\d.]+)~([\d.]+)m, Y=([\d.]+)m, Z=([\d.]+)m/);
  const axleRadius = source.match(/축은 X=[^\n]*반지름 ([\d.]+)m 원통/);
  if (!wheel || !axle || !axleRadius) return null;
  const center = Number(wheel[1]), halfWidth = Number(wheel[5]) / 2;
  const radial = Number(wheel[4]);
  const offset = Math.hypot(Number(wheel[2]) - Number(axle[3]),
    Number(wheel[3]) - Number(axle[4]));
  return [-Number(axle[1]), Number(axle[2])].map((signedX) => {
    const x = Math.abs(signedX);
    return Math.min(
      x - (center - halfWidth), center + halfWidth - x, radial - offset,
      Number(axleRadius[1]),
    );
  });
};

const trunkCrownInsertion = (source: string) => {
  const trunk = source.match(/줄기는 반지름 ([\d.]+)m에서 ([\d.]+)m로 줄어드는 원뿔대\(높이 ([\d.]+)m\)/);
  const crown = source.match(/아래 덩어리의 중심 \(X,Y,Z\)은 \(0,([\d.]+),0\)m,[^\n]*?전체 높이 ([\d.]+)m/);
  if (!trunk || !crown) return null;
  const top = Number(trunk[3]), center = Number(crown[1]), halfHeight = Number(crown[2]) / 2;
  return [Math.min(Number(trunk[1]), Number(trunk[2]),
    top - (center - halfHeight), center + halfHeight - top)];
};

const branchEnds = (source: string) => {
  const trunk = source.match(/줄기는 반지름 ([\d.]+)m에서 ([\d.]+)m로 줄어드는 원뿔대\(높이 ([\d.]+)m\)/);
  const branchRadius = source.match(/반지름 ([\d.]+)m인 세 가지/);
  const branch = source.match(/줄기 중심 \(([^)]+)\)m에서 각각 \(([^)]+)\)m, \(([^)]+)\)m, \(([^)]+)\)m로 뻗/);
  if (!trunk || !branch || !branchRadius) return null;
  const start = numbers(branch[1]);
  const radius = Number(trunk[1]) + (Number(trunk[2]) - Number(trunk[1])) * start[1] / Number(trunk[3]);
  const root = Math.min(Number(branchRadius[1]), radius - Math.hypot(start[0], start[2]),
    start[1], Number(trunk[3]) - start[1]);
  const tips = branch.slice(2).map(numbers);
  const crowns = [...source.matchAll(/^\|[^\n]*?\| \(([^)]+)\) \| \(([^)]+)\) \|$/gm)]
    .map((match) => ({ center: numbers(match[1]), axes: numbers(match[2]) }));
  if (crowns.length < tips.length) return null;
  const tipMargins = tips.map((tip, index) => {
    const { center, axes } = crowns[index];
    const norm = Math.sqrt(tip.reduce((sum, value, axis) =>
      sum + ((value - center[axis]) / axes[axis]) ** 2, 0));
    // The inset is conservative for the authored 10×6 polygonal ellipsoid.
    return Math.min(...axes) * (Math.cos(Math.PI / 10) * Math.cos(Math.PI / 6) - norm);
  });
  return { root, tips: tipMargins };
};

export const insertionWitnessMargins = (pair: string, source: string): number[] | null => {
  if (pair === "body/handle") {
    if (/베지어/.test(source)) return curvedVesselInsertionMargins(source);
    if (/반타원/.test(source)) return semicircleEnds(source);
    if (/원환/.test(source)) return torusInsertion(source);
  }
  if (pair === "stem/knop") return coaxialCylinderInsertion(source);
  if (pair === "axle/wheel") return wheelAxleInsertion(source);
  if (pair === "trunk/crown") return trunkCrownInsertion(source);
  if (pair === "trunk/branch" || pair === "branch/crown") {
    const ends = branchEnds(source);
    return ends && (pair === "trunk/branch" ? [ends.root] : ends.tips);
  }
  return null;
};
