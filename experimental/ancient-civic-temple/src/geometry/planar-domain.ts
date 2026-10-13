/**
 * XZ convex region computation shared by the roof height field and space cells.
 * It decides no building dimension or surface ownership. Input is a finite CCW convex polygon,
 * and output is a new polygon that leaves the input unchanged. Height is y=ax+bz+c (m).
 * Only numeric error is handled, at 1e-9; it is not a design tolerance or a gap filler.
 */
export interface PlanPoint { x: number; z: number }
export interface HeightPlane { x: number; z: number; constant: number }
/**
 * A roof top-face piece. tier is the composition unit (wing roofs compose with each other, while the
 * sanctuary and porch are separate units floating above them), and thickness is the vertical depth from top to underside.
 */
export interface RoofPatch {
  id: string;
  owner: string;
  surface: string;
  tier: "wing" | "sanctuary" | "porch";
  polygon: PlanPoint[];
  height: HeightPlane;
  thickness: number;
}
export interface PlanRectangle {
  west: number; east: number; north: number; south: number;
}

/** Numeric cancellation limit. End lines are never moved by this amount. */
const epsilon = 1e-9;

/** Four CCW corners in XZ. Reversed or zero-area ranges are refused. */
export const rectanglePolygon = (r: PlanRectangle): PlanPoint[] => {
  if (![r.west, r.east, r.north, r.south].every(Number.isFinite) ||
      r.west >= r.east || r.north >= r.south) {
    throw new Error("planar-domain: a rectangle with finite positive area is required.");
  }
  return [
    { x: r.west, z: r.north }, { x: r.east, z: r.north },
    { x: r.east, z: r.south }, { x: r.west, z: r.south },
  ];
};

/** Evaluates one point of a finite height field. Does not change the input plane. */
export const planeHeight = (p: HeightPlane, at: PlanPoint): number =>
  p.x * at.x + p.z * at.z + p.constant;

/** Clips with the closed half-plane a*x+b*z+c >= 0. An empty result is an empty array. */
export const clipPlan = (
  polygon: readonly PlanPoint[],
  halfPlane: HeightPlane,
): PlanPoint[] => {
  const result: PlanPoint[] = [];
  for (let i = 0; i < polygon.length; ++i) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const da = planeHeight(halfPlane, a);
    const db = planeHeight(halfPlane, b);
    if (da >= 0) result.push({ ...a });
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db);
      result.push({ x: a.x + t * (b.x - a.x), z: a.z + t * (b.z - a.z) });
    }
  }
  return cleanPlan(result);
};

/** The half-plane whose inside is left of a CCW edge. No normalization is needed. */
export const edgeInside = (a: PlanPoint, b: PlanPoint): HeightPlane => ({
  x: a.z - b.z,
  z: b.x - a.x,
  constant: (b.z - a.z) * a.x - (b.x - a.x) * a.z,
});

/** Returns the intersection with a convex cutter and the non-overlapping outside pieces. */
export const partitionPlan = (
  subject: readonly PlanPoint[],
  cutter: readonly PlanPoint[],
): { inside: PlanPoint[]; outside: PlanPoint[][] } => {
  let inside = subject.map((p) => ({ ...p }));
  const outside: PlanPoint[][] = [];
  for (let i = 0; i < cutter.length && inside.length > 0; ++i) {
    const plane = edgeInside(cutter[i]!, cutter[(i + 1) % cutter.length]!);
    const rejected = clipPlan(inside, {
      x: -plane.x, z: -plane.z, constant: -plane.constant,
    });
    if (rejected.length > 0) outside.push(rejected);
    inside = clipPlan(inside, plane);
  }
  return { inside, outside };
};

/**
 * Cleans pieces to emit as faces: removes duplicate points within 0.1mm and collinear points,
 * and returns an empty array for pieces under 1mm². Shape end lines are not moved.
 */
export const simplifyPlan = (points: readonly PlanPoint[]): PlanPoint[] => {
  let ring = points.filter((p, i) => {
    const next = points[(i + 1) % points.length]!;
    return Math.hypot(p.x - next.x, p.z - next.z) > 1e-4;
  });
  let changed = true;
  while (changed && ring.length >= 3) {
    changed = false;
    for (let i = 0; i < ring.length; ++i) {
      const a = ring[(i + ring.length - 1) % ring.length]!;
      const b = ring[i]!;
      const c = ring[(i + 1) % ring.length]!;
      const cross = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
      if (Math.abs(cross) < 1e-8) {
        ring = ring.filter((_, j) => j !== i);
        changed = true;
        break;
      }
    }
  }
  if (ring.length < 3) return [];
  const doubleArea = ring.reduce((sum, p, i) => {
    const next = ring[(i + 1) % ring.length]!;
    return sum + p.x * next.z - next.x * p.z;
  }, 0);
  return doubleArea > 2e-6 ? ring : [];
};

/** Removes duplicate end points and zero area, and does not turn an empty region into a triangle. */
const cleanPlan = (points: PlanPoint[]): PlanPoint[] => {
  const result = points.filter((p, i) => {
    const next = points[(i + 1) % points.length]!;
    return Math.hypot(p.x - next.x, p.z - next.z) > epsilon;
  });
  const doubleArea = result.reduce((sum, p, i) => {
    const next = result[(i + 1) % result.length]!;
    return sum + p.x * next.z - next.x * p.z;
  }, 0);
  return doubleArea > epsilon ? result : [];
};
