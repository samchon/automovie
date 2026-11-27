import { AutoMovieEngineRandom, AutoMoviePhysicalHullFaces } from "@automovie/engine";

import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeConvexCell } from "../../core";

/*
 * A seeded irregular stone as one convex cell, resting on a flat base at `y =
 * 0`, its largest horizontal extent along X and equal to `diameter`.
 *
 * Construction: 64 unit directions spread over the sphere by a Fibonacci
 * lattice (González 2010, "Measurement of Areas on a Sphere Using Fibonacci and
 * Latitude-Longitude Lattices", Mathematical Geosciences 42), each scaled by `r
 * (1 + DISPLACEMENT n(d))` with `r` half the diameter and `n` the engine's
 * three-dimensional fractal noise at the direction. Corners below `BASE_CUT` of
 * the height are raised onto that plane, so the hull has one flat base facet,
 * which becomes `y = 0`. The hull then turns about +Y until its two corners
 * farthest apart in plan lie along X, so its X extent is its largest horizontal
 * extent, and it scales uniformly until that extent is `diameter`; the plan box
 * is centred on the origin. The hull loses any concavity, acceptable for a
 * coarse form.
 * Parameter seed: Sixteen hexadecimal digits that draw the displacement noise.
 * Parameter diameter: The drawn diameter, metres, positive.
 * Returns: The admitted cell, the hull's highest corner and the point where a
 * +Z ray at half height through the centroid leaves the hull.
 * When the half-height ray from the centroid's plan position
 * starts outside the hull, which a convex stone on its base cannot do.
 */
export function irregularRockForm(
  seed: string,
  diameter: number,
): {
  cell: AutoMovieArchetypeConvexCell.ICell;
  top: IAutoMovieVector3;
  side: IAutoMovieVector3;
} {
  const noise: (x: number, y: number, z: number) => number =
    AutoMovieEngineRandom.createFractalNoise3(seed, OCTAVES, ROUGHNESS);
  const golden: number = Math.PI * (3 - Math.sqrt(5));
  const radius: number = diameter / 2;
  const raw: IAutoMovieVector3[] = [];
  for (let i: number = 0; i < DIRECTIONS; ++i) {
    // The Fibonacci lattice: equal-area latitude bands, one point each, at
    // longitudes a golden angle apart.
    const y: number = 1 - (2 * i + 1) / DIRECTIONS;
    const ring: number = Math.sqrt(1 - y * y);
    const x: number = ring * Math.cos(golden * i);
    const z: number = ring * Math.sin(golden * i);
    const reach: number = radius * (1 + DISPLACEMENT * noise(x, y, z));
    raw.push({ x: x * reach, y: y * reach, z: z * reach });
  }

  // Cut the base flat at BASE_CUT of the raw height.
  const heights: number[] = raw.map((p: IAutoMovieVector3): number => p.y);
  const low: number = Math.min(...heights);
  const high: number = Math.max(...heights);
  const cut: number = low + BASE_CUT * (high - low);

  // Turn so the farthest plan pair lies along X: rotating by minus its plan
  // angle maps (dx, dz) onto (|d|, 0).
  let span: number = -1;
  let angle: number = 0;
  for (let i: number = 0; i < raw.length; ++i)
    for (let j: number = i + 1; j < raw.length; ++j) {
      const dx: number = raw[j]!.x - raw[i]!.x;
      const dz: number = raw[j]!.z - raw[i]!.z;
      const distance: number = Math.hypot(dx, dz);
      if (distance > span) {
        span = distance;
        angle = Math.atan2(dz, dx);
      }
    }
  const cos: number = Math.cos(angle);
  const sin: number = Math.sin(angle);
  const turned: IAutoMovieVector3[] = raw.map(
    (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: p.x * cos + p.z * sin,
      y: Math.max(p.y, cut) - cut,
      z: -p.x * sin + p.z * cos,
    }),
  );

  // Centre the plan box and scale so the X extent is the diameter.
  const xs: number[] = turned.map((p: IAutoMovieVector3): number => p.x);
  const zs: number[] = turned.map((p: IAutoMovieVector3): number => p.z);
  const minX: number = Math.min(...xs);
  const maxX: number = Math.max(...xs);
  const midX: number = (minX + maxX) / 2;
  const midZ: number = (Math.min(...zs) + Math.max(...zs)) / 2;
  const scale: number = diameter / (maxX - minX);
  const points: IAutoMovieVector3[] = turned.map(
    (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: (p.x - midX) * scale,
      y: p.y * scale,
      z: (p.z - midZ) * scale,
    }),
  );
  // The cell keeps only the hull's corners: a collider admits no point
  // inside its hull.
  const hull: IAutoMoviePhysicalHullFaces.IHull = AutoMoviePhysicalHullFaces.build(points);
  const cell: AutoMovieArchetypeConvexCell.ICell =
    AutoMovieArchetypeConvexCell.of(hull.vertices);
  const top: IAutoMovieVector3 = hull.vertices.reduce(
    (best: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
      p.y > best.y ? p : best,
  );

  // The +Z ray at half height from the centroid's plan position leaves the
  // convex hull through the nearest face it moves toward.
  const start: IAutoMovieVector3 = {
    x: cell.centroid.x,
    y: top.y / 2,
    z: cell.centroid.z,
  };
  let travel: number = Infinity;
  for (const face of hull.faces) {
    const inside: number =
      face.offset -
      (face.normal.x * start.x +
        face.normal.y * start.y +
        face.normal.z * start.z);
    if (inside < -hull.tolerance)
      throw new Error(
        "An irregular rock's half-height ray starts outside its hull",
      );
    if (face.normal.z > 0) travel = Math.min(travel, inside / face.normal.z);
  }
  return {
    cell,
    top,
    side: { x: start.x, y: start.y, z: start.z + travel },
  };
}

/*
 * Directions on the sphere the stone's corners are cast along.
 */
const DIRECTIONS: number = 64;

/*
 * The greatest relative swell or dent of a corner, a construction detail no act
 * reads.
 */
const DISPLACEMENT: number = 0.3;

/*
 * The fraction of the raw height cut flat as the base, a construction detail no
 * act reads.
 */
const BASE_CUT: number = 0.2;

/*
 * Octaves of the displacement noise; each halves the scale of the last.
 */
const OCTAVES: number = 3;

/*
 * Amplitude ratio between the displacement noise's octaves.
 */
const ROUGHNESS: number = 0.5;
