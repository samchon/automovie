import type {
  IAutoMovieLoftPhaseSource,
  IAutoMovieStationHermite,
  IAutoMovieViewConic,
} from "@automovie/interface";

import { AutoMovieSeamStation } from "./AutoMovieSeamStation";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";
import { AutoMovieViewConic } from "./AutoMovieViewConic";

/**
 * Candidate function-valued station interpolation of native polar sections.
 *
 * A natural spline is linear in its ordinate data. Applying its cardinal
 * weights to Q_i(t) = rho_i(t) [cos(t), sin(t)] therefore retains each native
 * principal section without projecting it into a finite Cartesian cubic. The
 * same weights apply to both analytic phase derivatives. Finite periodic C2
 * source functions and regular frames give a C2 regular chart; neither
 * convexity between layers, continuous original-view reproduction, nor a
 * singular pole's geometric regularity follows from this construction. This
 * candidate is deliberately disconnected from the production chain.
 */
export namespace AutoMovieLoftPhaseSource {
  /** Prepare a natural-coordinate operator without fitting any phase samples. */
  export function prepare(
    coordinates: readonly number[],
    curves: readonly IAutoMovieViewConic.ICurve[],
  ): IAutoMovieLoftPhaseSource.ISource | string {
    const n: number = coordinates.length;
    if (
      n < 2 ||
      curves.length !== n ||
      !coordinates.every(
        (value: number, i: number): boolean =>
          i === 0 || value > coordinates[i - 1]!,
      )
    )
      return "native phase source needs matching curves and at least two increasing coordinates";
    for (const curve of curves) {
      if (curve.failure !== null || curve.quarters.length !== 4)
        return `native phase source is not admitted: ${curve.failure ?? "four quarters required"}`;
      if (
        !curve.quarters.every(
          (quarter: IAutoMovieViewConic.IQuarter): boolean =>
            quarter.extents.every((value: number): boolean => value > 0) &&
            quarter.shoulder > 0 &&
            quarter.shoulder < 1,
        )
      )
        return "native phase source has malformed quarter data";
    }
    const identity: number[][] = coordinates.map(
      (_: number, i: number): number[] =>
        Array.from({ length: n }, (_unused: unknown, j: number): number =>
          i === j ? 1 : 0,
        ),
    );
    const curvatures: number[][] = AutoMovieSeamStation.curvatures(
      coordinates,
      identity,
    );
    const slopes: number[][] = AutoMovieSeamStation.slopes(
      coordinates,
      identity,
      curvatures,
    );
    return {
      coordinates: [...coordinates],
      curves: [...curves],
      slopes,
      curvatures,
    };
  }

  /** Prepare weights at q, optionally reexpressed by [dq/ds, d2q/ds2]. */
  export function station(
    source: IAutoMovieLoftPhaseSource.ISource,
    q: number,
    change?: readonly [number, number],
  ): IAutoMovieLoftPhaseSource.IStation {
    const t: readonly number[] = source.coordinates;
    const n: number = t.length;
    if (
      n < 2 ||
      source.curves.length !== n ||
      q < t[0]! ||
      q > t[n - 1]! ||
      change !== undefined
    )
      throw new Error(
        "native phase station has no finite in-domain coordinate 2-jet",
      );
    let lo: number = 0;
    let hi: number = n - 1;
    while (hi - lo > 1) {
      const middle: number = (lo + hi) >> 1;
      if (t[middle]! <= q) lo = middle;
      else hi = middle;
    }
    const endpoint: (index: number) => IAutoMovieStationHermite.IEnd = (
      index: number,
    ): IAutoMovieStationHermite.IEnd => {
      const slope: readonly number[] = source.slopes[index]!;
      const curvature: readonly number[] = source.curvatures[index]!;
      if (slope.length !== n || curvature.length !== n)
        throw new Error("native phase endpoint has malformed cardinal jets");
      return {
        value: Array.from({ length: n }, (_: unknown, j: number): number =>
          index === j ? 1 : 0,
        ),
        slope,
        curvature,
      };
    };
    const a: IAutoMovieStationHermite.IEnd = endpoint(lo);
    const b: IAutoMovieStationHermite.IEnd = endpoint(hi);
    const span: number = t[hi]! - t[lo]!;
    const raw: number[][] = [0, 1, 2].map((order: number): number[] =>
      AutoMovieStationHermite.combine(
        a,
        b,
        AutoMovieStationHermite.weights(
          (q - t[lo]!) / span,
          span,
          order as 0 | 1 | 2,
          true,
        ),
      ),
    );
    const weights: number[][] =
      change === undefined
        ? raw
        : [
            raw[0]!,
            raw[1]!.map((value: number): number => value * change[0]),
            raw[2]!.map(
              (value: number, k: number): number =>
                value * change[0] * change[0] + raw[1]![k]! * change[1],
            ),
          ];
    return { source, weights };
  }

  /** Planar point [x,z], millimetres, at the original polar phase in radians. */
  export function point(
    at: IAutoMovieLoftPhaseSource.IStation,
    phi: number,
  ): [number, number] {
    validate(at);
    let radius: number = 0;
    for (let i: number = 0; i < at.source.curves.length; i++) {
      const weight: number = at.weights[0]![i]!;
      if (weight !== 0) radius += weight * read(at.source.curves[i]!, phi)[0];
    }
    return [radius * Math.cos(phi), radius * Math.sin(phi)];
  }

  /** Three planar rows [x,z,x_t,z_t,x_tt,z_tt], for station orders 0,1,2. */
  export function jet(
    at: IAutoMovieLoftPhaseSource.IStation,
    phi: number,
  ): number[][] {
    validate(at);
    const cosine: number = Math.cos(phi);
    const sine: number = Math.sin(phi);
    const rows: number[][] = Array.from({ length: 3 }, (): number[] =>
      new Array<number>(6).fill(0),
    );
    for (let i: number = 0; i < at.source.curves.length; i++) {
      const radius: readonly number[] = read(at.source.curves[i]!, phi);
      const r: number = radius[0]!;
      const first: number = radius[1]!;
      const second: number = radius[2]!;
      const native: number[] = [
        r * cosine,
        r * sine,
        first * cosine - r * sine,
        first * sine + r * cosine,
        (second - r) * cosine - 2 * first * sine,
        (second - r) * sine + 2 * first * cosine,
      ];
      for (let order: number = 0; order < 3; order++)
        for (let k: number = 0; k < 6; k++)
          rows[order]![k] =
            rows[order]![k]! + at.weights[order]![i]! * native[k]!;
    }
    return rows;
  }
}

/**
 * Validate explicit prepared rows without selecting geometry by registration
 * identity.
 */
function validate(at: IAutoMovieLoftPhaseSource.IStation): void {
  const count: number = at.source.curves.length;
  if (
    count < 2 ||
    at.weights.length !== 3 ||
    !at.weights.every(
      (row: readonly number[]): boolean => row.length === count,
    ) ||
    at.source.curves.some(
      (curve: IAutoMovieViewConic.ICurve): boolean =>
        curve.failure !== null || curve.quarters.length !== 4,
    )
  )
    throw new Error("native phase station has malformed explicit source data");
}

/**
 * A broken present source is an error, never a request for legacy coefficient
 * geometry.
 */
function read(
  curve: IAutoMovieViewConic.ICurve,
  phi: number,
): readonly [number, number, number] {
  const radius: readonly [number, number, number] = AutoMovieViewConic.radius(
    curve,
    phi,
  );
  return radius;
}
