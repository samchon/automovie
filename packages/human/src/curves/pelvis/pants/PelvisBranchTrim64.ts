import {
  AutoMovieBernstein64 as B,
  AutoMovieCurveMath64 as M,
} from "@automovie/engine";

import type { PelvisLongitudinalFamily as Family } from "../family/PelvisLongitudinalFamily";

/** One owned paired chart, exact restrictions and moving-root first variation.
 * Roots here are binary64 monotone brackets, not the Python Sturm certificates.
 * An absent, ambiguous or singular root rejects instead of selecting a near hit.
 *
 * @author Samchon
 */
export namespace PelvisBranchTrim64 {
  /** One qualified fixed-depth root on the reversed paired-loop chart; it is a binary64 bracket, not an interval theorem.
   *
   * @author Samchon
   */
  export interface Root {
    /** Reversed-loop quarter coordinate; one quarter has parameter width one. */
    r: number;

    /** Moving-root derivative dr/dY, per physical millimetre. */
    velocity: number;

    /** Binary64 bracket within the owning original quarter, not a certified enclosure. */
    interval: [number, number];

    /** Original reversed-loop quarter index owning the root. */
    quarter: number;

    /** Evaluated dZ/dr in millimetres, strictly positive for this trim chart. */
    depthDerivative: number;

    /** Absolute evaluated depth mismatch in millimetres. */
    residualMm: number;
  }
  /** An exact paired restriction with the moving-endpoint physical-height derivative.
   *
   * @author Samchon
   */
  export interface Piece {
    /** Exact position restriction in construction millimetres. */
    controls: B.Poly;

    /** Complete physical-height derivative, including both moving endpoints. */
    fullJ: B.Poly;

    /** Ordered source-quarter endpoints defining this restriction. */
    phase: [number, number];

    /** Physical-height derivatives of the two source-quarter endpoints. */
    velocities: [number, number];
  }
  /** Read one paired section and its full physical-height derivative in the shared reversed-quarter order. */
  export function loop(
    f: Family,
    y: number,
  ): {
    /** Reversed-loop position-control arrays in construction millimetres. */
    c: B.Poly[];

    /** Reversed-loop complete physical-height derivative coefficients. */
    j: B.Poly[];
  } {
    const c: M.Span[] = f.controls(y),
      j: M.Span[] = f.controls(y, true);
    return {
      c: [2, 1, 0, 3].map((i: number): B.Poly => [...c[i]!].reverse()),
      j: [2, 1, 0, 3].map((i: number): B.Poly => [...j[i]!].reverse()),
    };
  }
  /** Bracket a target on an increasing Bernstein ordinate; absent targets return null and reversed controls reject. */
  export function monotoneRoot(
    c: B.Poly,
    target: number,
    axis: number,
  ): {
    /** Normalized root parameter within its original polynomial piece. */
    t: number;

    /** Binary64 root bracket in the same local parameter, not an interval proof. */
    interval: [number, number];
  } | null {
    const values: number[] = c.map((p: M.V): number => p[axis]! - target);
    if (values[0] === 0) return { t: 0, interval: [0, 0] };
    if (values.at(-1) === 0) return { t: 1, interval: [1, 1] };
    if (
      values.some(
        (v: number, i: number): boolean => i > 0 && v < values[i - 1]!,
      )
    )
      throw new Error(
        "The declared monotone root branch reverses its control ordinates",
      );
    if (!(values[0]! < 0 && values.at(-1)! > 0)) return null;
    let lo: number = 0,
      hi: number = 1;
    for (let i: number = 0; i < 96; i++) {
      const mid: number = (lo + hi) / 2;
      if (mid === lo || mid === hi) break;
      const v: number = B.value(c, mid)[axis]! - target;
      if (v === 0) {
        lo = mid;
        hi = mid;
        break;
      }
      if (v < 0) lo = mid;
      else hi = mid;
    }
    return { t: (lo + hi) / 2, interval: [lo, hi] };
  }
  /** Find one nonsingular inner-branch Z root and its physical-height velocity; ambiguity rejects. */
  export function fixedDepth(f: Family, y: number, z: number): Root {
    const { c, j }: ReturnType<typeof loop> = loop(f, y);
    const found: Root[] = [];
    for (const index of [0, 1]) {
      const hit: ReturnType<typeof monotoneRoot> = monotoneRoot(
        c[index]!,
        z,
        2,
      );
      if (hit === null) continue;
      const ct: M.V = B.value(B.tangent(c[index]!), hit.t),
        jy: M.V = B.value(j[index]!, hit.t);
      if (!(ct[2] > 0))
        throw new Error(
          "A trim root requires an increasing nonsingular depth chart",
        );
      found.push({
        r: index + hit.t,
        velocity: -jy[2] / ct[2],
        interval: hit.interval,
        quarter: index,
        depthDerivative: ct[2],
        residualMm: Math.abs(B.value(c[index]!, hit.t)[2] - z),
      });
    }
    if (
      found.length === 2 &&
      found[0]!.r === 1 &&
      found[1]!.r === 1 &&
      found[0]!.velocity === found[1]!.velocity
    )
      return found[0]!;
    if (found.length !== 1)
      throw new Error(
        "The owned inner branch has no unique fixed-depth trim root",
      );
    return found[0]!;
  }
  /** Restrict one original quarter and add Ct times the moving-endpoint velocity field to full-J. */
  export function piece(
    f: Family,
    y: number,
    a: number,
    b: number,
    da: number,
    db: number,
  ): Piece {
    const index: number = Math.floor((a + b) / 2);
    if (!(index <= a && a < b && b <= index + 1))
      throw new Error(
        "A restriction crosses an unpartitioned original quarter",
      );
    const { c, j }: ReturnType<typeof loop> = loop(f, y);
    const cp: B.Poly = B.restrict(c[index % 4]!, a - index, b - index);
    const fixed: B.Poly = B.restrict(j[index % 4]!, a - index, b - index);
    const ct: B.Poly = B.restrict(
      B.tangent(c[index % 4]!),
      a - index,
      b - index,
    );
    return {
      controls: cp,
      fullJ: B.add(fixed, B.productV([da, db], ct)),
      phase: [a, b],
      velocities: [da, db],
    };
  }
  /** Partition a trim at original quarter boundaries and named moving roots without bridging across charts. */
  export function partition(
    f: Family,
    y: number,
    start: Root,
    end: Root,
    extra: readonly Root[] = [],
  ): Piece[] {
    const nodes: Map<number, number> = new Map([
      [start.r, start.velocity],
      [end.r, end.velocity],
    ]);
    for (let i: number = Math.floor(start.r) + 1; i < Math.ceil(end.r); i++)
      nodes.set(i, 0);
    for (const p of extra)
      if (start.r < p.r && p.r < end.r) nodes.set(p.r, p.velocity);
    const ordered: number[] = [...nodes.keys()].sort(
      (a: number, b: number): number => a - b,
    );
    return ordered
      .slice(1)
      .map(
        (b: number, i: number): Piece =>
          piece(f, y, ordered[i]!, b, nodes.get(ordered[i]!)!, nodes.get(b)!),
      );
  }
}
