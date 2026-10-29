import type { AutoMovieHumanMonotoneCubic } from "../lofting/AutoMovieHumanMonotoneCubic";
import type { AutoMovieHumanBodyWarpField } from "./AutoMovieHumanBodyWarpField";

/** World-point and directional operations shared by retained-curve transport. */
export namespace AutoMovieHumanBodyWarpPoint {
  /** A world coordinate or direction, distinguished by its caller's units. */
  export type V = [number, number, number];

  /**
   * Source strip -> positive longitudinal map -> actual target-strip inverse.
   * Each family must be a positive chart; weights of a longitudinal convex
   * blend may depend on label, not on its mapped longitudinal coordinate.
   * This preserves local chart orientation, not global nonintersection.
   * Reusing the same strip and an identity longitudinal map is exact identity.
   */
  export function strip(
    q: number,
    z: number,
    source: (q: number) => AutoMovieHumanMonotoneCubic.ICoordinate | undefined,
    along: (label: number) => AutoMovieHumanMonotoneCubic.ICoordinate | undefined,
    target: (q: number) => AutoMovieHumanMonotoneCubic.ICoordinate | undefined,
  ): [number, number] | undefined {
    const chart: AutoMovieHumanMonotoneCubic.ICoordinate | undefined = source(q);
    if (chart === undefined) return undefined;
    const label: number = chart(z).value;
    const longitudinal: AutoMovieHumanMonotoneCubic.ICoordinate | undefined = along(label);
    if (longitudinal === undefined) return undefined;
    if (source === target && longitudinal.identity) return [q, z];
    const moved: number = longitudinal(q).value;
    const inverse: AutoMovieHumanMonotoneCubic.ICoordinate | undefined = target(moved);
    return inverse === undefined ? undefined : [moved, inverse.inverse(label).value];
  }

  /** Component sum. */
  export function add(a: readonly number[], b: readonly number[]): V {
    return [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
  }

  /** Component difference. */
  export function sub(a: readonly number[], b: readonly number[]): V {
    return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  }

  /** Scalar multiplication. */
  export function scale(v: readonly number[], k: number): V {
    return [v[0]! * k, v[1]! * k, v[2]! * k];
  }

  /** Euclidean scalar product. */
  export function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }

  /** Oriented cross product; a frame normal is v cross u. */
  export function cross(a: readonly number[], b: readonly number[]): V {
    return [
      a[1]! * b[2]! - a[2]! * b[1]!,
      a[2]! * b[0]! - a[0]! * b[2]!,
      a[0]! * b[1]! - a[1]! * b[0]!,
    ];
  }

  /** Unit direction; zero has no direction and remains zero. */
  export function normalize(v: readonly number[]): V {
    const length: number = Math.hypot(v[0]!, v[1]!, v[2]!);
    return length === 0 ? [0, 0, 0] : scale(v, 1 / length);
  }

  /**
   * Actual map direction along an explicit (stationRate, pointRate).
   * It differences displacement, then adds the original direction, so an
   * identity map preserves the input direction exactly. Section-angle
   * directions use stationRate zero; longitudinal directions change both.
   */
  export function direction(
    point: AutoMovieHumanBodyWarpField.IPointMap,
    chain: string,
    station: number,
    p: readonly [number, number, number],
    stationRate: number,
    pointRate: readonly [number, number, number],
  ): V {
    const speed: number = Math.max(
      Math.abs(stationRate), Math.hypot(...pointRate),
    );
    if (speed === 0) return [0, 0, 0];
    const h: number = 0.25 / speed;
    const before: V = sub(p, scale(pointRate, h));
    const after: V = add(p, scale(pointRate, h));
    const a: V = sub(point(chain, station - h * stationRate, before), before);
    const b: V = sub(point(chain, station + h * stationRate, after), after);
    return add(pointRate, scale(sub(b, a), 1 / (2 * h)));
  }
}
