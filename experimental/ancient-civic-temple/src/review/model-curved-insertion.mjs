/**
 * Reconstruct the authored polygonal vessel and Bézier handle sections in
 * metres. The overlap audit uses these cross sections at both attachment
 * ends; a shared AABB cannot establish that either capped tube enters clay.
 */

/** @param {string} text @returns {number[][]} */
const coordinates = (text) => [...text.matchAll(/\((?:±)?([\d.]+),([\d.]+)(?:,0)?\)/g)]
  .map((match) => [Number(match[1]), Number(match[2])]);

/** @param {number[][]} profile @param {number} y */
const radiusAt = (profile, y) => {
  for (let i = 1; i < profile.length; i++) {
    const [r0, y0] = profile[i - 1], [r1, y1] = profile[i];
    if (y >= Math.min(y0, y1) - 1e-9 && y <= Math.max(y0, y1) + 1e-9)
      return r0 + (r1 - r0) * (y - y0) / (y1 - y0);
  }
  return null;
};

/** @param {number} radius @param {number} x @param {number} z @param {number} sides */
const polygonRadius = (radius, x, z, sides) => {
  const step = 2 * Math.PI / sides;
  const theta = Math.atan2(-z, x);
  const offset = Math.abs(((theta + step / 2 + 2 * Math.PI) % step) - step / 2);
  return radius * Math.cos(step / 2) / Math.cos(step / 2 - offset);
};

/** @param {number[][]} points @param {number} t */
const bezier = (points, t) => {
  const q = 1 - t;
  return [0, 1].map((axis) => q ** 3 * points[0][axis] +
    3 * q ** 2 * t * points[1][axis] + 3 * q * t ** 2 * points[2][axis] +
    t ** 3 * points[3][axis]);
};

/** @param {number[]} a @param {number[]} b */
const subtract = (a, b) => a.map((value, i) => value - b[i]);
/** @param {number[]} a @param {number[]} b */
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
/** @param {number[]} a @param {number[]} b */
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** @param {number[]} p @param {number[]} a @param {number[]} b */
const segmentDistanceSquared = (p, a, b) => {
  const ab = subtract(b, a), ap = subtract(p, a);
  const t = Math.max(0, Math.min(1, dot(ap, ab) / dot(ab, ab)));
  return dot(
    subtract(
      p,
      a.map((v, i) => v + t * ab[i]),
    ),
    subtract(
      p,
      a.map((v, i) => v + t * ab[i]),
    ),
  );
};

/** Squared Euclidean distance to one actual polygonal body triangle. */
/** @param {number[]} p @param {number[]} a @param {number[]} b @param {number[]} c */
const triangleDistanceSquared = (p, a, b, c) => {
  const ab = subtract(b, a), ac = subtract(c, a), ap = subtract(p, a);
  const n = cross(ab, ac), nn = dot(n, n);
  if (nn > 1e-20) {
    const v = dot(cross(ap, ac), n) / nn;
    const w = dot(cross(ab, ap), n) / nn;
    if (v >= 0 && w >= 0 && v + w <= 1) return dot(ap, n) ** 2 / nn;
  }
  return Math.min(
    segmentDistanceSquared(p, a, b),
    segmentDistanceSquared(p, b, c),
    segmentDistanceSquared(p, c, a),
  );
};

/** @param {number[][]} outer @param {number[][]} inner @param {number} sides */
const vesselTriangles = (outer, inner, sides) => {
  const profile = [...outer, ...inner];
  /** @type {number[][][]} */
  const triangles = [];
  /** @param {number} r @param {number} y */
  const ring = (r, y) => Array.from({ length: sides }, (_, i) => {
    const angle = 2 * Math.PI * i / sides;
    return [r * Math.cos(angle), y, -r * Math.sin(angle)];
  });
  for (let j = 1; j < profile.length; j++) {
    const a = ring(profile[j - 1][0], profile[j - 1][1]);
    const b = ring(profile[j][0], profile[j][1]);
    for (let i = 0; i < sides; i++) {
      const k = (i + 1) % sides;
      triangles.push([a[i], a[k], b[k]], [a[i], b[k], b[i]]);
    }
  }
  return triangles;
};

/** @param {string} body @returns {null | { outer:number[][];inner:number[][];floor:number;points:number[][];radius:number;pathSegments:number;tubeSides:number;bodySides:number }} */
const vesselHandle = (body) => {
  const outerText = body.match(/바깥 윤곽은 ([^\n]+?)m의 직선 연결/)?.[1];
  const innerMatch = body.match(
    /입 안쪽은 ([^\n]+?)m의 직선 연결 뒤 Y=([\d.]+)m/,
  );
  const lower = body.match(/아래 부착점 \((±?[\d.]+),([\d.]+),0\)m/);
  const upper = body.match(/위 부착점 \((±?[\d.]+),([\d.]+),0\)m/);
  const controls = body.match(/제어점 \((±?[\d.]+),([\d.]+),0\)m·\((±?[\d.]+),([\d.]+),0\)m/) ??
    body.match(/아래점→\((±?[\d.]+),([\d.]+),0\)→\((±?[\d.]+),([\d.]+),0\)→위점/);
  const radius = body.match(/관 반지름 ([\d.]+)m/);
  const division = body.match(/(?:길이|경로) (\d+)분할·관 둘레 (\d+)분할/);
  const bodyDivision = body.match(/몸체 회전 (\d+)분할/);
  if (!outerText || !innerMatch || !lower || !upper || !controls || !radius ||
      !division || !bodyDivision) return null;
  const outer = coordinates(outerText).map(([y, r]) => [r, y]);
  const inner = coordinates(innerMatch[1]).map(([y, r]) => [r, y]);
  if (outer.length < 2 || inner.length < 2) return null;
  /** @param {string} x @param {string} y */
  const point = (x, y) => [Number(x.replace("±", "")), Number(y)];
  return {
    outer,
    inner,
    floor: Number(innerMatch[2]),
    points: [
      point(lower[1], lower[2]),
      point(controls[1], controls[2]),
      point(controls[3], controls[4]),
      point(upper[1], upper[2]),
    ],
    radius: Number(radius[1]),
    pathSegments: Number(division[1]),
    tubeSides: Number(division[2]),
    bodySides: Number(bodyDivision[1]),
  };
};

/**
 * Positive values are the sampled maximum Euclidean penetration depths at
 * the two ends. Each end uses its adjacent chord ring, internal rings use
 * their exact planar mitre, and samples cover tube faces as well as caps.
 * Null means the stated construction cannot be reconstructed.
 * @param {string} body
 * @returns {null | [number, number]}
 */
export const curvedVesselInsertionMargins = (body) => {
  const model = vesselHandle(body);
  if (!model) return null;
  const { outer, inner, floor, points, radius, pathSegments, tubeSides, bodySides } = model;
  if (radius <= 0 || pathSegments < 1 || tubeSides < 3 || bodySides < 3) return null;
  const samplesPerEdge = 4;
  const triangles = vesselTriangles(outer, inner, bodySides);
  /** @param {number} x @param {number} y @param {number} z */
  const clayMargin = (x, y, z) => {
    const surface = radiusAt(outer, y);
    if (surface === null) return -Infinity;
    const radial = Math.hypot(x, z);
    const outside = polygonRadius(surface, x, z, bodySides) - radial;
    const innerSurface = y > floor ? radiusAt(inner, y) : null;
    const inside = innerSurface === null
      ? Infinity
      : radial - polygonRadius(innerSurface, x, z, bodySides);
    return Math.min(outside, inside);
  };
  const path = Array.from({ length: pathSegments + 1 }, (_, i) =>
    bezier(points, i / pathSegments),
  );
  const tangents = path.slice(1).map((b, i) => {
    const a = path[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
  });
  /** @param {number} ringIndex @param {number} side */
  const vertex = (ringIndex, side) => {
    const angle = 2 * Math.PI * side / tubeSides;
    const incoming = tangents[Math.max(0, ringIndex - 1)];
    const outgoing = tangents[Math.min(pathSegments - 1, ringIndex)];
    const e = [
      radius * incoming[1] * Math.sin(angle),
      -radius * incoming[0] * Math.sin(angle),
      radius * Math.cos(angle),
    ];
    let shift = 0;
    if (ringIndex > 0 && ringIndex < pathSegments) {
      const bisector = [incoming[0] + outgoing[0], incoming[1] + outgoing[1]];
      shift = -(e[0] * bisector[0] + e[1] * bisector[1]) /
        (incoming[0] * bisector[0] + incoming[1] * bisector[1]);
    }
    return [
      path[ringIndex][0] + e[0] + shift * incoming[0],
      path[ringIndex][1] + e[1] + shift * incoming[1],
      e[2],
    ];
  };
  /** @param {number[]} p */
  const depth = (p) => {
    if (clayMargin(p[0], p[1], p[2]) <= 1e-9) return 0;
    return Math.sqrt(Math.min(...triangles.map(([a, b, c]) =>
      triangleDistanceSquared(p, a, b, c))));
  };
  return /** @type {[number, number]} */ ([0, 1].map((end) => {
    const endIndex = end ? pathSegments : 0;
    let maximum = depth([path[endIndex][0], path[endIndex][1], 0]);
    for (const segment of end ? [pathSegments - 2, pathSegments - 1] : [0, 1])
      for (let side = 0; side < tubeSides; side++) {
        const next = (side + 1) % tubeSides;
        const a = vertex(segment, side), b = vertex(segment, next);
        const c = vertex(segment + 1, side), d = vertex(segment + 1, next);
        for (let u = 0; u <= samplesPerEdge; u++) for (let v = 0; v <= samplesPerEdge; v++) {
          const s = u / samplesPerEdge, t = v / samplesPerEdge;
          const p = a.map((value, i) => value * (1 - s) * (1 - t) +
            b[i] * (1 - s) * t + c[i] * s * (1 - t) + d[i] * s * t);
          maximum = Math.max(maximum, depth(p));
        }
      }
    for (let side = 0; side < tubeSides; side++) {
      const a = vertex(endIndex, side), b = vertex(endIndex, (side + 1) % tubeSides);
      for (let u = 0; u <= samplesPerEdge; u++) for (let v = 0; v <= samplesPerEdge - u; v++) {
        const s = u / samplesPerEdge, t = v / samplesPerEdge;
        maximum = Math.max(maximum, depth(a.map((value, i) =>
          (i === 2 ? 0 : points[end ? 3 : 0][i]) * (1 - s - t) + value * s + b[i] * t)));
      }
    }
    return maximum;
  }));
};
