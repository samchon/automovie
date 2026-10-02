import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");
type Point = [number, number];
type Geometry = { hinge:number;pathZ:number;rise:number;center:number;centerY:number;radius:number;topY:number;topStart:number;end:number;length:number;closedMin:number;closedMax:number;maxTravel:number;floor:number;reserveMin:number;reserveMax:number;panelCount:number };
const num = "([−-]?\\d+(?:\\.\\d+)?)";
const value = (s: string) => Number(s.replace("−", "-"));
const required = (source: string, pattern: RegExp, label: string) => {
  const match = pattern.exec(source);
  if (!match) throw Error(`missing numeric ${label}`);
  return match.slice(1).map(value);
};
const h2 = (source: string, anchor: string) => source.split(/^## /m).slice(1)
  .find((chunk) => chunk.split("\n", 1)[0].includes(`{#${anchor}}`))
  ?.replace(/<!--[\s\S]*?-->/g, "") ?? "";

function pathPoint(p: Geometry, distance: number): Point {
  if (distance <= p.rise) return [p.hinge, distance];
  const arc = Math.PI * p.radius / 2;
  if (distance <= p.rise + arc) {
    const theta = (distance - p.rise) / p.radius;
    return [
      p.center + p.radius * Math.cos(theta),
      p.rise + p.radius * Math.sin(theta),
    ];
  }
  return [p.center - (distance - p.rise - arc), p.rise + p.radius];
}
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** First forward point at the panel's rigid chord length. */
function nextHinge(p: Geometry, start: number, length: number) {
  const first = pathPoint(p, start);
  let lo = start, hi = start + length + Math.PI * p.radius / 2;
  if (pathPoint(p, hi)[0] < p.end - 1e-8) throw Error(
    "hinge path ends before the panel",
  );
  if (distance(first, pathPoint(p, hi)) < length) throw Error(
    "no forward hinge at rigid panel length",
  );
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (distance(first, pathPoint(p, mid)) < length) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Panel section in the local depth/height plane. A centered hinge has
 * positive inner and outer offsets; an inner-edge hinge has inner=0. */
function panelPolygon(a: Point, b: Point, inner: number, outer: number): Point[] {
  const length = distance(a, b);
  const normal = [(b[1] - a[1]) / length, -(b[0] - a[0]) / length];
    const move = (point: Point, amount: number): Point => [
    point[0] + normal[0] * amount,
    point[1] + normal[1] * amount,
  ];
  return [move(a, -inner), move(b, -inner), move(b, outer), move(a, outer)];
}
const area = (poly: Point[]) => Math.abs(poly.reduce((sum, p, i) => {
  const q = poly[(i + 1) % poly.length];
  return sum + p[0] * q[1] - q[0] * p[1];
}, 0)) / 2;
/** Clip two convex sections. Contact at a shared hinge has zero area. */
function intersectionArea(subject: Point[], clip: Point[]) {
  let output = subject;
  const signed = clip.reduce((sum, p, i) => {
    const q = clip[(i + 1) % clip.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0);
  const sign = Math.sign(signed);
  for (let i = 0; i < clip.length; i++) {
    const a = clip[i], b = clip[(i + 1) % clip.length];
        const side = (p: Point) => sign * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j], q = input[(j + 1) % input.length];
      const sp = side(p), sq = side(q);
      if (sp >= -1e-12) output.push(p);
      if ((sp < -1e-12 && sq > 1e-12) || (sp > 1e-12 && sq < -1e-12)) {
        const t = sp / (sp - sq);
        output.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
      }
    }
    if (!output.length) return 0;
  }
  return output.length < 3 ? 0 : area(output);
}

function authoredGeometry(): Geometry {
  const model = h2(
    fs.readFileSync(path.join(root, "docs/models/02-exterior-doors.md"), "utf8"),
    "garage-sectional-door",
  );
  const parent = h2(
    fs.readFileSync(path.join(root, "docs/spaces/envelope/front.md"), "utf8"),
    "garage-front-opening",
  );
  if (!model || !parent) throw Error(
    "missing articulated panel or reviewed reservation H2",
  );
  const [hinge] = required(
    model,
    new RegExp(`이음 관절은[^.\\n]*국소 z=${num} m`),
    "hinge depth",
  );
  const [pathZ, rise, center, centerY, radius, topY, topStart, end] = required(
    model,
    new RegExp(
      `레일 중심선 [^\\n]*?국소 z = ${num} m, y = \\[0, ${num}\\] m 수직, 중심 \\(z = ${num}, y = ${num}\\) m의 반지름 ${num} m 사분원, y = ${num} m에서 z = \\[${num}, ${num}\\] m 수평`,
    ),
    "hinge path",
  );
  const [length] = required(
    model,
    new RegExp(`직선 거리 ${num} m`),
    "rigid panel length",
  );
  const [closedMin, closedMax] = required(
    model,
    new RegExp(`문짝 네 장은 X=\\[[^\\]]+\\] m, 국소 z=\\[${num},${num}\\] m`),
    "closed panel depth",
  );
  const [maxTravel] = required(
    model,
    new RegExp(`범위는 0[–-]${num} m`),
    "travel range",
  );
  const [floor] = required(
    parent,
    new RegExp(`Y = \\[${num}, 2\\.15\\] m의 거친 개구부`),
    "garage floor datum",
  );
  const [reserveMin, reserveMax] = required(
    parent,
    new RegExp(
      `상부의 가이드/열린 패널 예약은[^\\n]*?Y = \\[${num}, ${num}\\] m`,
    ),
    "upper reservation",
  );
  const panelCount = Number(/`panel-1`[–-]`panel-(\d+)`/.exec(model)?.[1]);
  if (!Number.isInteger(panelCount) || panelCount < 2) throw Error(
    "missing panel count",
  );
  return {
    hinge,
    pathZ,
    rise,
    center,
    centerY,
    radius,
    topY,
    topStart,
    end,
    length,
    closedMin,
    closedMax,
    maxTravel,
    floor,
    reserveMin,
    reserveMax,
    panelCount,
  };
}

function sweep(p: Geometry, samples: number = 230) {
  const failures = [];
  if (Math.abs(p.pathZ - p.hinge) > 1e-8 ||
      Math.abs(p.center + p.radius - p.pathZ) > 1e-8 ||
      Math.abs(p.centerY - p.rise) > 1e-8 ||
      Math.abs(p.topY - p.rise - p.radius) > 1e-8 ||
      Math.abs(p.topStart - p.center) > 1e-8 ||
      Math.abs(p.closedMax - p.closedMin - (p.closedMax - p.hinge) - (p.hinge - p.closedMin)) > 1e-8)
    failures.push("hinge path and closed section do not share one axis");
  const inner = p.hinge - p.closedMin, outer = p.closedMax - p.hinge;
  if (inner < -1e-8 || outer < -1e-8) failures.push(
    "hinge lies outside the closed section",
  );
  let maximumOverlap = 0, minimumOpenY = Infinity, maximumOpenY = -Infinity;
  for (let step = 0; step <= samples; step++) {
    const travel = p.maxTravel * step / samples;
    const polygons = [];
    let along = travel;
    for (let panel = 0; panel < p.panelCount; panel++) {
      const next = nextHinge(p, along, p.length);
      polygons.push(
        panelPolygon(pathPoint(p, along), pathPoint(p, next), inner, outer),
      );
      along = next;
    }
    for (let panel = 1; panel < polygons.length; panel++)
      maximumOverlap = Math.max(maximumOverlap, intersectionArea(polygons[panel - 1], polygons[panel]));
    if (step === samples) for (const polygon of polygons) for (const point of polygon) {
      minimumOpenY = Math.min(minimumOpenY, point[1] + p.floor);
      maximumOpenY = Math.max(maximumOpenY, point[1] + p.floor);
    }
  }
  if (maximumOverlap > 1e-8) failures.push(
    `adjacent rigid panels overlap ${maximumOverlap.toFixed(8)} m² in section`,
  );
  if (minimumOpenY < p.reserveMin - 1e-8 || maximumOpenY > p.reserveMax + 1e-8)
    failures.push(
      `fully open panels Y=[${minimumOpenY},${maximumOpenY}] outside reviewed reservation`,
    );
  return {
    samples: samples + 1,
    panelPairs: (samples + 1) * (p.panelCount - 1),
    maximumOverlap,
    fullyOpenY: [minimumOpenY, maximumOpenY],
    failures,
  };
}

if (require.main === module) {
  try {
    const result = sweep(authoredGeometry());
    console.log(JSON.stringify(result));
    if (result.failures.length) process.exitCode = 1;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
export { pathPoint, nextHinge, panelPolygon, intersectionArea, authoredGeometry, sweep };