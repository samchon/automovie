import { IAutoMovieSweepSection } from "@automovie/engine";

/** A closed polygon sampled from the centripetal-free uniform Catmull-Rom curve through points, eight samples per span. */
export const sectionAutoMovieHumanHeadRing: (points: Array<{ x: number; y: number; }>) => IAutoMovieSweepSection = (
  points: Array<{ x: number; y: number }>,
): IAutoMovieSweepSection => {
  const n: number = points.length;
  const out: Array<{ x: number; y: number }> = [];
  for (let k: number = 0; k < n; ++k) {
    const p0: { x: number; y: number; } = points[(k + n - 1) % n]!;
    const p1: { x: number; y: number; } = points[k]!;
    const p2: { x: number; y: number; } = points[(k + 1) % n]!;
    const p3: { x: number; y: number; } = points[(k + 2) % n]!;
    for (let i: number = 0; i < 8; ++i) {
      const t: number = i / 8;
      const t2: number = t * t;
      const t3: number = t2 * t;
      const w0: number = -0.5 * t3 + t2 - 0.5 * t;
      const w1: number = 1.5 * t3 - 2.5 * t2 + 1;
      const w2: number = -1.5 * t3 + 2 * t2 + 0.5 * t;
      const w3: number = 0.5 * t3 - 0.5 * t2;
      out.push({
        x: w0 * p0.x + w1 * p1.x + w2 * p2.x + w3 * p3.x,
        y: w0 * p0.y + w1 * p1.y + w2 * p2.y + w3 * p3.y,
      });
    }
  }
  // counterclockwise in the plane
  let area: number = 0;
  for (let k: number = 0; k < out.length; ++k) {
    const a: { x: number; y: number; } = out[k]!;
    const b: { x: number; y: number; } = out[(k + 1) % out.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  return { type: "polygon", points: area >= 0 ? out : out.reverse() };
};
