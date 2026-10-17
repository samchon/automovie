import {
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweepSection,
} from "@automovie/engine";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";

/**
 * The shared layout and helpers of the trunk's surface network: the row and column counts its sweeps and bridges agree on, the section families the crotch and the thighs share, and the conversions between the trunk's millimetres and the engine's metres.
 */
export namespace AutoMovieHumanTrunkSweep {
  /** The tier the human profile samples; one tier keeps one topology until resolution tiers reach the other parts. */
  export const TIER: "medium" = "medium" as const;

  /**
   * Rows of the trunk between its key levels from the crotch to the axilla, in their order up the body: crotch to buttock, buttock to iliac crest, crest to waist, waist to underbust, underbust to chest point, chest point to axilla. Every key level is a row, so the subdivided surface passes through each measured section's girth, and rows stay within about a quarter of the narrowest girth falloff the CC0 reference's measure targets show (hips 105 mm full width at half maximum), so a measured girth changes the surface over its own height. The hip bridges and the thigh tubes' first rows take the lowest row's height, so the subdivided surface meets no change of row spacing at the hips.
   */
  export const LOWER_ROWS: readonly number[] = [1, 5, 2, 3, 2, 2];

  /**
   * Tube phase at each shoulder opening. The rectangular opening loop starts at its anterior lower corner; the arm section starts anteriorly and turns down on the left and up on the right, so one of its eight columns aligns those named sectors. The bridge chart uses the same phase as its destination loop.
   */
  export const SHOULDER_PHASE: Record<"left" | "right", number> = {
    left: 1 / 8,
    right: -1 / 8,
  };

  /** Where each tube's last row starts: the loop there repeats the ring's section, one row before the ring. */
  export const COLLAR: { readonly arm: number; readonly thigh: number } = {
    arm: 2 / 3,
    thigh: 1 / 2,
  } as const;

  /** Exponent of the crotch section and of the thighs' first sections, one superellipse family so their contours agree. */
  export const FORK_EXPONENT: number = 2.5;

  /** Exponent of the thighs' medial sides at the crotch, flattened where they press together. */
  export const MEDIAL_EXPONENT: number = 4;

  /** A horizontal section plane: first axis `+Z` (forward), second `+X` (the person's left), normal `+Y`. */
  export const HORIZONTAL: IAutoMovieQuaternion = {
    x: -0.5,
    y: -0.5,
    z: -0.5,
    w: 0.5,
  };

  /**
   * The same count at every tier.
   *
   * @param n The count
   * @returns The counts by tier
   */
  export const fixed: (n: number) => IAutoMovieSurfaceNetwork.ICounts = (
    n: number,
  ): IAutoMovieSurfaceNetwork.ICounts => ({
    lowest: n,
    low: n,
    medium: n,
    high: n,
  });

  /**
   * An edge along a sweep's domain between two `(u, v)` points.
   *
   * @param sweep Name of the sweep
   * @param from Start `[u, v]`
   * @param to End `[u, v]`
   * @param segments Segments at every tier
   * @returns The edge
   */
  export const edge: (
    sweep: string,
    from: [number, number],
    to: [number, number],
    segments: number,
  ) => IAutoMovieSurfaceNetwork.ISweepEdge = (
    sweep: string,
    from: [number, number],
    to: [number, number],
    segments: number,
  ): IAutoMovieSurfaceNetwork.ISweepEdge => ({
    type: "sweep",
    sweep,
    from: { u: from[0], v: from[1] },
    to: { u: to[0], v: to[1] },
    segments: fixed(segments),
  });

  /**
   * Millimetres to metres.
   *
   * @param mm Millimetres
   * @returns Metres
   */
  export const metres: (mm: number) => number = (mm: number): number =>
    mm / 1000;

  /**
   * Metres to millimetres.
   *
   * @param m Metres
   * @returns Millimetres
   */
  export const millimetres: (m: number) => number = (m: number): number =>
    m * 1000;

  /**
   * A point in millimetres to metres.
   *
   * @param p Millimetres
   * @returns Metres
   */
  export const toMetres: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: p.x / 1000,
    y: p.y / 1000,
    z: p.z / 1000,
  });

  /**
   * Each point's share of the polyline's chord length, 0 at the first and 1 at the last.
   *
   * @param points The polyline
   * @returns One share per point
   */
  export const chordShares: (points: IAutoMovieVector3[]) => number[] = (
    points: IAutoMovieVector3[],
  ): number[] => {
    const lengths: number[] = [0];
    for (let k: number = 1; k < points.length; ++k)
      lengths.push(
        lengths[k - 1]! +
          AutoMovieHumanVector.distance(points[k - 1]!, points[k]!),
      );
    const total: number = lengths[lengths.length - 1]!;
    return lengths.map((l: number): number => l / total);
  };

  /**
   * A vector turned by a unit quaternion.
   *
   * @param q The rotation
   * @param v The vector
   * @returns The turned vector
   */
  export const rotate: (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const tx: number = 2 * (q.y * v.z - q.z * v.y);
    const ty: number = 2 * (q.z * v.x - q.x * v.z);
    const tz: number = 2 * (q.x * v.y - q.y * v.x);
    return {
      x: v.x + q.w * tx + (q.y * tz - q.z * ty),
      y: v.y + q.w * ty + (q.z * tx - q.x * tz),
      z: v.z + q.w * tz + (q.x * ty - q.y * tx),
    };
  };

  /**
   * The unit quaternion of the rotation whose matrix columns are `x`, `y`, `z`.
   *
   * @param x First column, unit
   * @param y Second column, unit
   * @param z Third column, unit
   * @returns The rotation
   */
  export const quaternionOf: (
    x: IAutoMovieVector3,
    y: IAutoMovieVector3,
    z: IAutoMovieVector3,
  ) => IAutoMovieQuaternion = (
    x: IAutoMovieVector3,
    y: IAutoMovieVector3,
    z: IAutoMovieVector3,
  ): IAutoMovieQuaternion => {
    const trace: number = x.x + y.y + z.z;
    if (trace > 0) {
      const s: number = Math.sqrt(trace + 1) * 2;
      return {
        w: s / 4,
        x: (y.z - z.y) / s,
        y: (z.x - x.z) / s,
        z: (x.y - y.x) / s,
      };
    }
    if (x.x > y.y && x.x > z.z) {
      const s: number = Math.sqrt(1 + x.x - y.y - z.z) * 2;
      return {
        w: (y.z - z.y) / s,
        x: s / 4,
        y: (y.x + x.y) / s,
        z: (z.x + x.z) / s,
      };
    }
    if (y.y > z.z) {
      const s: number = Math.sqrt(1 + y.y - x.x - z.z) * 2;
      return {
        w: (z.x - x.z) / s,
        x: (y.x + x.y) / s,
        y: s / 4,
        z: (z.y + y.z) / s,
      };
    }
    const s: number = Math.sqrt(1 + z.z - x.x - y.y) * 2;
    return {
      w: (x.y - y.x) / s,
      x: (z.x + x.z) / s,
      y: (z.y + y.z) / s,
      z: s / 4,
    };
  };

  /**
   * A circle of radius `r` millimetres.
   *
   * @param r Radius, millimetres
   * @returns The section in metres
   */
  export const circle: (r: number) => IAutoMovieSweepSection = (
    r: number,
  ): IAutoMovieSweepSection => ({
    type: "superellipse",
    right: metres(r),
    up: metres(r),
    left: metres(r),
    down: metres(r),
    exponents: [2, 2, 2, 2],
  });

  /**
   * The ring's section as a superellipse with its first axis along vertex `first`.
   *
   * @param shape The ring
   * @param first Index of the vertex the first axis points at
   * @returns The section in metres
   */
  export const ringSection: (
    shape: IAutoMovieHumanRingShape,
    first: number,
  ) => IAutoMovieSweepSection = (
    shape: IAutoMovieHumanRingShape,
    first: number,
  ): IAutoMovieSweepSection => {
    const n: number = shape.count;
    const r: (k: number) => number = (k: number): number =>
      metres(shape.radii[(first + k) % n]!);
    return {
      type: "superellipse",
      right: r(0),
      up: r(n / 4),
      left: r(n / 2),
      down: r((3 * n) / 4),
      exponents: [2, 2, 2, 2],
    };
  };

  /**
   * Rotation taking `+X` to the ring direction of vertex `first`, `+Z` to the ring's normal.
   *
   * @param shape The ring
   * @param first Index of the vertex
   * @returns The rotation
   */
  export const ringRotation: (
    shape: IAutoMovieHumanRingShape,
    first: number,
  ) => IAutoMovieQuaternion = (
    shape: IAutoMovieHumanRingShape,
    first: number,
  ): IAutoMovieQuaternion => {
    const z: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
      shape.frame.normal,
    );
    const raw: IAutoMovieVector3 = shape.directions[first % shape.count]!;
    const x: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
      AutoMovieHumanVector.offset(raw, [z, -AutoMovieHumanVector.dot(raw, z)]),
    );
    return quaternionOf(x, AutoMovieHumanVector.cross(z, x), z);
  };

  /**
   * The ring's control positions moved `distance` millimetres back along its axis, into the part, in metres.
   *
   * @param shape The ring
   * @param distance Millimetres
   * @returns The moved positions, metres
   */
  export const collarOf: (
    shape: IAutoMovieHumanRingShape,
    distance: number,
  ) => IAutoMovieVector3[] = (
    shape: IAutoMovieHumanRingShape,
    distance: number,
  ): IAutoMovieVector3[] => {
    const n: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
      shape.frame.normal,
    );
    return shape.positions.map((p: IAutoMovieVector3) =>
      toMetres(AutoMovieHumanVector.offset(p, [n, -distance])),
    );
  };
}
