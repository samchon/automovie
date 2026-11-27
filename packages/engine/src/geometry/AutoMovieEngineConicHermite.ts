import type {
  IAutoMovieConicArc,
  IAutoMovieConicFieldJet,
  IAutoMovieConicHermite,
  IAutoMovieConicHermiteField,
  IAutoMoviePolarSector,
} from "@automovie/interface";

import { AutoMovieEngineConicArcField } from "./AutoMovieEngineConicArcField";
import { AutoMovieEngineConicFieldJet } from "./AutoMovieEngineConicFieldJet";
import { AutoMovieEngineConicHermiteField } from "./AutoMovieEngineConicHermiteField";
import { AutoMovieEngineConicPreparation } from "./AutoMovieEngineConicPreparation";

/**
 * Convex rational cubic G2 Hermite interpolation of a short conic end.
 *
 * Degree-elevating a rational quadratic gives weights [1,u0,u0,1]. For a fixed
 * control polygon, start curvature is proportional to v/u^2 and end curvature
 * to u/v^2. Thus [1,u0/tau^(2/3),u0/tau^(1/3),1] changes only the start
 * curvature by tau. This is the standard rational cubic osculatory problem
 * described by Habib and Sakai (2001, p341),
 * https://www.jams.or.jp/scm/contents/Vol-5-5/5-41.pdf .
 *
 * The original segment and this positive-weight convex cubic lie between its
 * chord and first tangent. For T<=1/2 their same-ray radial separation is at
 * most (a-x(T))/cos(phi(T)) <= 4_T^2_hypot(a,b). The chosen T is smaller than
 * the square root of that error budget. It also vanishes linearly with 1-tau.
 * Near tau=1, the radial correction is O((1-tau)*T^2), its phase derivative
 * O((1-tau)*T), and its second phase derivative O(1-tau). Scaling the compact
 * angular interval then makes all mixed derivatives of total order at most two
 * tend to zero. Away from that branch the positive regular rational inverse is
 * smooth.
 *
 * Small x deficits are stored separately from a, avoiding subtraction of nearly
 * equal world coordinates before differentiating.
 */
export namespace AutoMovieEngineConicHermite {
  /**
   * Prepare a convex G2 end approximation or an explicit finite-arithmetic
   * failure.
   */
  export function create(
    a: number,
    b: number,
    r: number,
    shared: number,
  ): IAutoMovieConicHermite.IPatch | string | null {
    return prepare(AutoMovieEngineConicFieldJet.NUMBER, a, b, r, shared);
  }

  /** Prepare the same rational G2 end in NUMBER or source-Hessian algebra. */
  export function prepare<T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
    a: T,
    b: T,
    r: T,
    shared: T,
  ): IAutoMovieConicHermite.IPatch<T> | string | null {
    const own: T = AutoMovieEngineConicArcField.curvature(ops, a, b, r);
    return AutoMovieEngineConicPreparation.end(ops, a, b, r, shared, own);
  }

  /** Cartesian point and two derivatives in this cubic's own unit parameter. */
  export function jet(
    patch: IAutoMovieConicHermite.IPatch,
    t: number,
  ): [number, number, number, number, number, number] {
    const s: number = 1 - t;
    const basis: number[][] = [
      [s ** 3, 3 * t * s * s, 3 * t * t * s, t ** 3],
      [-3 * s * s, 3 * s * s - 6 * t * s, 6 * t * s - 3 * t * t, 3 * t * t],
      [6 * s, 18 * t - 12, 6 - 18 * t, 6 * t],
    ];
    const d: [number, number, number] = [0, 0, 0];
    const n: [number, number][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    for (let order: number = 0; order < 3; order++)
      for (let i: number = 0; i < 4; i++) {
        const weight: number = basis[order]![i]! * patch.weights[i]!;
        d[order]! += weight;
        n[order]![0] += weight * patch.points[i]![0];
        n[order]![1] += weight * patch.points[i]![1];
      }
    const values: [number, number][] = [
      [n[0]![0] / d[0], n[0]![1] / d[0]],
      [0, 0],
      [0, 0],
    ];
    for (let coordinate: number = 0; coordinate < 2; coordinate++) {
      values[1]![coordinate] =
        (n[1]![coordinate]! - values[0]![coordinate]! * d[1]) / d[0];
      values[2]![coordinate] =
        (n[2]![coordinate]! -
          2 * values[1]![coordinate]! * d[1] -
          values[0]![coordinate]! * d[2]) /
        d[0];
    }
    return [
      patch.extent - patch.deficit * values[0]![0],
      patch.height * values[0]![1],
      -patch.deficit * values[1]![0],
      patch.height * values[1]![1],
      -patch.deficit * values[2]![0],
      patch.height * values[2]![1],
    ];
  }

  /** Polar jet on this admitted end's closed angular interval. */
  export function radius(
    patch: IAutoMovieConicHermite.IPatch,
    angle: number,
  ): IAutoMoviePolarSector.Jet {
    return locate(patch, angle)?.radial ?? [NaN, NaN, NaN];
  }

  /** Locate a G2 ray once, preserving explicit endpoint identities. */
  export function locate(
    patch: IAutoMovieConicHermite.IPatch,
    angle: number,
  ): IAutoMovieConicArc.IRay | null {
    const selected: Located | null = locateReading(patch, angle);
    return selected === null
      ? null
      : AutoMovieEngineConicHermiteField.ray(
          patch,
          selected.reading,
          selected.clock,
          selected.position,
        );
  }

  /** Same admitted ray inverse and projective point without full geometry. */
  export function point(
    patch: IAutoMovieConicHermite.IPatch,
    angle: number,
  ): readonly [number, number] | null {
    const selected: Located | null = locateReading(patch, angle);
    return selected !== null ? selected.reading.point : null;
  }

  /** Read only the radius of the same admitted projective source point. */
  export function value(
    patch: IAutoMovieConicHermite.IPatch,
    angle: number,
  ): number {
    const selected: Located | null = locateReading(patch, angle);
    if (selected === null) return NaN;
    const value: number =
      selected.position === "first"
        ? patch.extent
        : Math.hypot(...selected.reading.point);
    return value > 0 ? value : NaN;
  }

  /*
   * The original inverse, including its exact endpoint and residual policy.
   */
  function locateReading(
    patch: IAutoMovieConicHermite.IPatch,
    angle: number,
  ): Located | null {
    if (!(angle >= 0 && angle <= patch.angle)) return null;

    const ops: IAutoMovieConicFieldJet.IAlgebra<number> =
      AutoMovieEngineConicFieldJet.NUMBER;
    const weightLogs: number[] = patch.weights.map(Math.log);

    if (angle === 0 || angle === patch.angle) {
      const position: "first" | "last" = angle === 0 ? "first" : "last";
      const reading: IAutoMovieConicHermiteField.IProjective<number> =
        AutoMovieEngineConicHermiteField.projective(
          ops,
          patch,
          weightLogs,
          null,
          position,
        );
      return { reading, clock: null, position };
    }
    const span: number =
      Math.log(Number.MAX_VALUE) -
      Math.log(Number.MIN_VALUE) +
      Math.max(...weightLogs.map(Math.abs));
    let lo: number = -span;
    let hi: number = span;
    const below: IAutoMovieConicHermiteField.IProjective<number> =
      AutoMovieEngineConicHermiteField.projective(ops, patch, weightLogs, lo);
    const above: IAutoMovieConicHermiteField.IProjective<number> =
      AutoMovieEngineConicHermiteField.projective(ops, patch, weightLogs, hi);
    if (
      !(
        Math.atan2(below.point[1], below.point[0]) <= angle &&
        angle <= Math.atan2(above.point[1], above.point[0])
      )
    )
      return null;
    for (let i: number = 0; i < 64; i++) {
      const middle: number = (lo + hi) / 2;
      if (middle === lo || middle === hi) break;
      const reading: IAutoMovieConicHermiteField.IProjective<number> =
        AutoMovieEngineConicHermiteField.projective(ops, patch, weightLogs, middle);
      if (Math.atan2(reading.point[1], reading.point[0]) < angle) lo = middle;
      else hi = middle;
    }
    const clock: number = (lo + hi) / 2;
    const reading: IAutoMovieConicHermiteField.IProjective<number> =
      AutoMovieEngineConicHermiteField.projective(ops, patch, weightLogs, clock);
    const residual: number = Math.abs(
      Math.atan2(reading.point[1], reading.point[0]) - angle,
    );
    const floor: number =
      128 *
      Number.EPSILON *
      (1 + Math.abs(clock) + Math.max(...weightLogs.map(Math.abs))) *
      patch.angle;
    if (!(residual <= floor)) return null;

    return { reading, clock, position: "interior" };
  }
}

/** A final projective reading of the unchanged bounded numeric inverse. */
interface Located {
  /** Same final point/log probabilities. */ reading: IAutoMovieConicHermiteField.IProjective<number>;
  /** Null only for an explicit endpoint. */ clock: number | null;
  /** Explicit selected position. */ position: "first" | "interior" | "last";
}
