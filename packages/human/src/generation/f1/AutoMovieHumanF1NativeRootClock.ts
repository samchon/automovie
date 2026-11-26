import {
  AutoMovieSplineCurve as Spline,
  bracketedRoot,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPortLoop,
} from "@automovie/interface";

/** World-space target controls; physical dimensions are owned by RootTypes. */
type V = AutoMovieVector3Tuple;

/**
 * The native root's sole periodic-clock, radial reparameterization and
 * target-clock2 owner.
 */
export namespace AutoMovieHumanF1NativeRootClock {
  /**
   * A periodic new-P ordinate and a strictly monotone one-turn angular
   * coordinate.
   */
  export interface IGraph {
    /**
     * New periodic ordinate and strictly monotone unwrapped phase at clock
     * radians.
     */
    at: (clock: number) => readonly [number, number];
    /** Original-control clock recovered on the admitted one-turn phase branch. */
    clock: (phase: number) => number;
  }
  /**
   * One existing radial loop and the original target parameter used by each
   * emitted column.
   */
  export interface IReclock {
    /** Existing-pole radial controls, in public metres/radians. */
    loop: IAutoMovieConstructionPortLoop;
    /** Original target parameter recovered for each emitted radial column. */
    clocks: number[];
  }
  const turn: number = 2 * Math.PI;

  /** One unwrapped branch under the original increasing/decreasing winding. */
  export function unwrap(values: readonly number[], what: string): number[] {
    const result: number[] = [values[0]!];
    for (let k: number = 1; k < values.length; k++) {
      const d: number = values[k]! - values[k - 1]!;
      result.push(result[k - 1]! + d - turn * Math.round(d / turn));
    }
    if (!result.every(Number.isFinite)) throw new Error(what + " is nonfinite");
    return result;
  }

  /**
   * Actual periodic cubic plus a linear winding; derivative extrema certify its
   * clock before inversion.
   */
  export function phaseCurve(
    values: readonly (readonly [number, number])[],
    sense: 1 | -1,
    what: string,
  ): IGraph {
    const n: number = values.length;
    if (n < 4 || !values.flat().every(Number.isFinite))
      throw new Error(what + " needs complete finite controls");
    for (let k: number = 1; k <= n; k++)
      if (
        !(
          sense *
            ((k === n ? values[0]![1] + sense * turn : values[k]![1]) -
              values[k - 1]![1]) >
          0
        )
      )
        throw new Error(what + " phase is not a single monotone graph");
    const coefficients: number[] = Spline.interpolate(
      values.map(
        (
          [value, angle]: readonly [number, number],
          k: number,
        ): [number, number] => [value, angle - (sense * turn * k) / n],
      ),
    );
    function read(c: number): ReturnType<typeof Spline.jet> {
      return Spline.jet(coefficients, n, c);
    }
    for (let k: number = 0; k < n; k++) {
      const a: number = (turn * k) / n,
        b: number = (turn * (k + 1)) / n;
      const ja: ReturnType<typeof read> = read(a),
        jb: ReturnType<typeof read> = read(b);
      const checks: number[] = [
        sense * (sense + ja[3]),
        sense * (sense + jb[3]),
      ];
      if (ja[5] * jb[5] < 0)
        checks.push(
          sense * (sense + read(a - ((b - a) * ja[5]) / (jb[5] - ja[5]))[3]),
        );
      if (
        !checks.every(
          (value: number): boolean => Number.isFinite(value) && value > 0,
        )
      )
        throw new Error(
          what +
            " periodic clock derivative is not strictly positive in its declared direction",
        );
    }
    function at(c: number): readonly [number, number] {
      const row: ReturnType<typeof read> = read(c);
      return [row[0], sense * c + row[1]];
    }
    const base: number = at(0)[1];
    const maxDerivative: number =
      1 +
      (Math.max(
        ...coefficients
          .slice(n)
          .map((value: number, k: number): number =>
            Math.abs(coefficients[n + ((k + 1) % n)]! - value),
          ),
      ) *
        n) /
        turn;
    function clock(phase: number): number {
      if (!Number.isFinite(phase))
        throw new Error(what + " requested phase is nonfinite");
      const target: number =
        base + sense * ((((sense * (phase - base)) % turn) + turn) % turn);
      if (target === base) return 0;
      const c: number = bracketedRoot(
        (value: number): number => at(value)[1] - target,
        0,
        turn,
        1e-12,
        64,
      );
      const residual: number = Math.abs(at(c)[1] - target);
      const budget: number =
        maxDerivative * 1e-12 +
        256 * Number.EPSILON * Math.max(1, Math.abs(target));
      if (
        !(
          Number.isFinite(c) &&
          c >= 0 &&
          c <= turn &&
          Number.isFinite(residual) &&
          residual <= budget
        )
      )
        throw new Error(
          what + " angular inverse failed its numerical postcheck",
        );
      return c;
    }
    return { at, clock };
  }

  /**
   * Reclock around the original pole; positive radial coefficients and monotone
   * angular clock are admitted.
   */
  export function reclock(
    loop: IAutoMovieConstructionPortLoop,
    addresses: readonly (readonly [number, number])[],
  ): IReclock {
    const angles: number[] = unwrap(
      addresses.map(([s, phase]: readonly [number, number]): number =>
        Math.atan2(
          (phase - loop.centre[1]) / (loop.sense * loop.semi[1]),
          (s - loop.centre[0] * 1000) / (loop.semi[0] * 1000),
        ),
      ),
      "parent radial clock",
    );
    const values: [number, number][] = addresses.map(
      ([s, phase]: readonly [number, number], k: number): [number, number] => [
        Math.hypot(
          (s - loop.centre[0] * 1000) / (loop.semi[0] * 1000),
          (phase - loop.centre[1]) / (loop.sense * loop.semi[1]),
        ),
        angles[k]!,
      ],
    );
    const coefficients: number[] = Spline.interpolate(
      values.map(([r, angle]: [number, number]): [number, number] => [
        r,
        angle,
      ]),
    );
    if (
      !coefficients
        .slice(0, values.length)
        .every((value: number): boolean => Number.isFinite(value) && value > 0)
    )
      throw new Error(
        "parent original pole has no certified positive radial graph",
      );
    const curve: IGraph = phaseCurve(values, 1, "parent radial clock");
    const clocks: number[] = values.map(
      (_: [number, number], k: number): number =>
        curve.clock((turn * k) / values.length),
    );
    return {
      loop: {
        ...loop,
        shape: clocks.map((c: number): number => curve.at(c)[0]),
      },
      clocks,
    };
  }

  /**
   * The actual new periodic C2 target-control interpolant; it is not an exact
   * source-surface pullback.
   */
  export function vectorCurve(values: readonly V[]): (clock: number) => V {
    const xy: number[] = Spline.interpolate(
      values.map((point: V): [number, number] => [point[0], point[1]]),
    );
    const zz: number[] = Spline.interpolate(
      values.map((point: V): [number, number] => [point[2], 0]),
    );
    return (c: number): V => {
      const p: ReturnType<typeof Spline.jet> = Spline.jet(xy, values.length, c);
      return [p[0], p[1], Spline.jet(zz, values.length, c)[0]];
    };
  }
  /**
   * New periodic target clock2, in mm per radian and per squared radian of
   * original target clock.
   */
  export function vectorJet(
    values: readonly V[],
  ): (clock: number) => { p: V; first: V; second: V } {
    const xy: number[] = Spline.interpolate(
      values.map((point: V): [number, number] => [point[0], point[1]]),
    );
    const zz: number[] = Spline.interpolate(
      values.map((point: V): [number, number] => [point[2], 0]),
    );
    return (c: number): { p: V; first: V; second: V } => {
      const a: ReturnType<typeof Spline.jet> = Spline.jet(xy, values.length, c),
        b: ReturnType<typeof Spline.jet> = Spline.jet(zz, values.length, c);
      return {
        p: [a[0], a[1], b[0]],
        first: [a[2], a[3], b[2]],
        second: [a[4], a[5], b[4]],
      };
    };
  }
}
