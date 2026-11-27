import type {
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSwivelArcs,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { abductionRange } from "../rom/internal/abductionRange";
import { swivelArcs } from "./swivelArcs";

/**
 * How a joint's three clinical angles read from its rotation as a swivel turns
 * it: for a bone-local rotation that is a fixed rotation turned about a fixed
 * axis by the swivel, every entry of its matrix on the clinical basis is `a + b
 * cos ψ + c sin ψ` (Rodrigues' formula between two fixed rotations), fitted
 * exactly from the rotation at 0, 90 and 180 degrees, and each clinical angle
 * is read from those entries as `decomposeJointRotationOnBasis` reads it: the
 * middle angle of the composition by its sine, an outer angle by the vector
 * `atan2` takes.
 */
export namespace swivelJointReadings {
  /** A clinical axis. */
  export type Axis = "flexion" | "abduction" | "twist";

  /**
   * How an axis is read: the middle angle's sine, or an outer angle's vector
   * and the sign its rest-relative angle takes.
   */
  export type IRead =
    | { sine: IAutoMovieSwivelArcs.ISinusoid }
    | {
        y: IAutoMovieSwivelArcs.ISinusoid;
        x: IAutoMovieSwivelArcs.ISinusoid;
        turn: 1 | -1;
      };

  /** The three clinical axes, in the order a constraint lists them. */
  export const AXES: readonly Axis[] = ["flexion", "abduction", "twist"];

  /**
   * Read a joint's three angles as sinusoids of the swivel.
   *
   * @param basis The joint's clinical basis, admitted and normalized
   *   (`normalizeJointAxes`).
   * @param rotation The joint's bone-local rotation at a swivel, degrees: a
   *   fixed rotation turned about a fixed axis by the swivel.
   * @returns Each axis's reading.
   */
  export function of(
    basis: IAutoMovieJointAxes,
    rotation: (swivel: number) => IAutoMovieQuaternion,
  ): Record<Axis, IRead> {
    const handed: 1 | -1 =
      Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >=
      0
        ? 1
        : -1;
    const axes: IAutoMovieVector3[] = [
      basis.flexion,
      basis.abduction,
      Vector3.scale(basis.twist, handed),
    ];

    // The entries R'[i][j] = axis_i · (R axis_j) at swivels 0, 90 and 180.
    const sampled: number[][][] = [0, 90, 180].map(
      (swivel: number): number[][] => {
        const q: IAutoMovieQuaternion = rotation(swivel);
        const turned: IAutoMovieVector3[] = axes.map(
          (axis: IAutoMovieVector3): IAutoMovieVector3 =>
            Quaternion.rotateVector(q, axis),
        );
        return axes.map((row: IAutoMovieVector3): number[] =>
          turned.map((column: IAutoMovieVector3): number =>
            Vector3.dot(row, column),
          ),
        );
      },
    );
    const entry = (i: number, j: number): IAutoMovieSwivelArcs.ISinusoid => {
      const [zero, quarter, half] = sampled.map(
        (m: number[][]): number => m[i]![j]!,
      ) as [number, number, number];
      return swivelArcs.fitted(zero, quarter, half);
    };
    // On the handed clinical basis, F·A·T is Rx(f)·Ry(a)·Rz(t).
    if (basis.rotationOrder === "flexion-abduction-twist")
      return {
        flexion: {
          y: swivelArcs.scaled(entry(1, 2), -1),
          x: entry(2, 2),
          turn: 1,
        },
        abduction: { sine: entry(0, 2) },
        twist: {
          y: swivelArcs.scaled(entry(0, 1), -1),
          x: entry(0, 0),
          turn: handed,
        },
      };
    return basis.twistPlacement === "distal"
      ? {
          flexion: { sine: swivelArcs.scaled(entry(1, 2), -1) },
          abduction: { y: entry(0, 2), x: entry(2, 2), turn: 1 },
          twist: { y: entry(1, 0), x: entry(1, 1), turn: handed },
        }
      : {
          flexion: { y: entry(2, 1), x: entry(2, 2), turn: 1 },
          abduction: { sine: swivelArcs.scaled(entry(2, 0), -1) },
          twist: { y: entry(1, 0), x: entry(0, 0), turn: handed },
        };
  }

  /**
   * A box's swing cone (`swingDeg`) as the swivel reads it: the cone holds
   * where `(1 + cos f)(1 + cos a) >= 2 (1 + cos swingDeg)`, since the cone
   * (`swingConeAngle`) is `2 acos(cos(f/2) cos(a/2))`.
   *
   * Of flexion `f` and abduction `a`, one is the composition's middle angle,
   * whose sine is a sinusoid `s` and whose cosine is `sqrt(1 - s²)`, and the
   * other an outer angle, whose vector `x` is that cosine times its own cosine
   * (the vector's length is the middle angle's cosine), so both cosines are
   * read off two sinusoids. The alternate chart's half turns negate both
   * cosines. The cone reads clinical angles, whose cosines are the
   * rest-relative ones' only where the rest frame's flexion and abduction
   * neutrals are zero; another frame gives none.
   *
   * @param constraint The joint's box.
   * @param frame The joint's rest frame; omitted, its angles are clinical.
   * @param reading The joint's reading (`of`).
   * @returns The cone's reading; null without a cone, under a frame with a
   *   nonzero flexion or abduction neutral, or for a reading whose flexion and
   *   abduction are not one middle and one outer angle, which no composition
   *   order gives.
   */
  export function cone(
    constraint: IAutoMovieJointConstraint,
    frame: IAutoMovieRestFrame | undefined,
    reading: Record<Axis, IRead>,
  ): ICone | null {
    if (typeof constraint.swingDeg !== "number") return null;
    if ((frame?.flexion?.neutral ?? 0) !== 0) return null;
    if ((frame?.abduction?.neutral ?? 0) !== 0) return null;
    const flexion: IRead = reading.flexion;
    const abduction: IRead = reading.abduction;
    const held: number =
      2 * (1 + Math.cos(constraint.swingDeg * Quaternion.DEG2RAD));
    if ("x" in flexion && "sine" in abduction)
      return { middle: abduction.sine, outer: flexion.x, held };
    if ("x" in abduction && "sine" in flexion)
      return { middle: flexion.sine, outer: abduction.x, held };
    return null;
  }

  /**
   * Whether a swing cone is certainly exceeded by more than `margin` radians at
   * every swivel from `low` to `high` degrees, in one chart.
   *
   * Over the interval each sinusoid's range is read in closed form (its two
   * ends, and its peak or trough where the interval holds one). The middle
   * cosine `ρ = sqrt(1 - s²)` then lies in the range the sine's square gives,
   * and the outer cosine `x / ρ`, monotone in each of `x` and `ρ` for a
   * positive `ρ`, at the corners of their ranges. The product `(1 ± cos f)(1 ±
   * cos a)` of two non-negative factors is at most the product of their
   * greatest values, so the cone is at least `2 acos(sqrt(that) / 2)` over the
   * whole interval.
   *
   * @param cone The cone's reading (`cone`).
   * @param low The interval's start, degrees.
   * @param high Its end, degrees.
   * @param alternate Whether the chart is the alternate one, whose cosines are
   *   negated.
   * @param margin Radians the cone must exceed its limit by.
   * @returns Whether the cone is certainly exceeded; false where the middle
   *   cosine may vanish, which leaves the outer cosine unbounded.
   */
  export function coneExceeded(
    cone: ICone,
    low: number,
    high: number,
    alternate: boolean,
    margin: number,
  ): boolean {
    const range: IConeRange | null = coneRange(cone, low, high);
    if (range === null) return false;
    const { rhoLow, rhoHigh, xLow, xHigh }: IConeRange = range;
    const sign: number = alternate ? -1 : 1;
    // The greatest of `1 + sign · cos` for the outer cosine `x / ρ` and for
    // the middle cosine `ρ`, each at the end of its range the sign favours.
    const outer: number = Math.max(
      1 + (sign * xLow) / rhoLow,
      1 + (sign * xLow) / rhoHigh,
      1 + (sign * xHigh) / rhoLow,
      1 + (sign * xHigh) / rhoHigh,
    );
    const middle: number = 1 + sign * (alternate ? rhoLow : rhoHigh);
    const most: number = Math.max(0, outer) * Math.max(0, middle);
    if (!(most < cone.held)) return false;
    const least: number = 2 * Math.acos(Math.min(1, Math.sqrt(most) / 2));
    const limit: number = 2 * Math.acos(Math.min(1, Math.sqrt(cone.held) / 2));
    return least - limit > margin;
  }

  /**
   * Whether a swing cone certainly stays within its limit plus `margin` radians
   * at every swivel from `low` to `high` degrees, in one chart: the counterpart
   * of `coneExceeded`, which then refuses no part of the interval.
   *
   * The middle cosine `ρ` and the outer cosine `x / ρ` lie in the ranges
   * `coneExceeded` reads, and the product `(1 ± cos f)(1 ± cos a)` of two
   * non-negative factors is at least the product of their least values, so the
   * cone is at most `2 acos(sqrt(that) / 2)` over the whole interval. Every
   * part's `coneExceeded` bound reads the product at its greatest there, no
   * less than this least, so none of them exceeds the limit by more than
   * `margin` either.
   *
   * @param cone The cone's reading (`cone`).
   * @param low The interval's start, degrees.
   * @param high Its end, degrees.
   * @param alternate Whether the chart is the alternate one, whose cosines are
   *   negated.
   * @param margin Radians the cone may exceed its limit by.
   * @returns Whether the cone certainly stays within; false where the middle
   *   cosine may vanish, which leaves the outer cosine unbounded.
   */
  export function coneWithin(
    cone: ICone,
    low: number,
    high: number,
    alternate: boolean,
    margin: number,
  ): boolean {
    const range: IConeRange | null = coneRange(cone, low, high);
    if (range === null) return false;
    const { rhoLow, rhoHigh, xLow, xHigh }: IConeRange = range;
    const sign: number = alternate ? -1 : 1;
    // The least of `1 + sign · cos` for the outer cosine `x / ρ` and for the
    // middle cosine `ρ`, each at the end of its range the sign disfavours.
    const outer: number = Math.min(
      1 + (sign * xLow) / rhoLow,
      1 + (sign * xLow) / rhoHigh,
      1 + (sign * xHigh) / rhoLow,
      1 + (sign * xHigh) / rhoHigh,
    );
    const middle: number = 1 + sign * (alternate ? rhoHigh : rhoLow);
    const least: number = Math.max(0, outer) * Math.max(0, middle);
    const widest: number = 2 * Math.acos(Math.min(1, Math.sqrt(least) / 2));
    const limit: number = 2 * Math.acos(Math.min(1, Math.sqrt(cone.held) / 2));
    return widest - limit <= margin;
  }

  /** A swing cone as the swivel reads it (`cone`). */
  export interface ICone {
    /** The sine of whichever of flexion and abduction is the middle angle. */
    middle: IAutoMovieSwivelArcs.ISinusoid;

    /** The vector `x` of the other, its cosine times the middle angle's cosine. */
    outer: IAutoMovieSwivelArcs.ISinusoid;

    /**
     * `2 (1 + cos swingDeg)`: the least `(1 + cos f)(1 + cos a)` inside the
     * cone.
     */
    held: number;
  }

  /**
   * The interval a swivel analysis reads an axis of a three-angle box by: the
   * axis's own interval, and for an abduction ceiling that rises with flexion
   * (`abductionRange`) the highest ceiling the coupling reaches, which bounds
   * it at every flexion since the coupled ceiling is at least the neutral one
   * (`validateJointConstraint`).
   *
   * @param constraint The joint's box.
   * @param axis The axis.
   * @returns The clinical interval, degrees; null for an axis without one.
   */
  export function interval(
    constraint: IAutoMovieJointConstraint,
    axis: Axis,
  ): IAutoMovieAngleRange | null {
    return axis === "abduction"
      ? abductionRange(constraint, constraint.abductionFlexed?.flexion ?? null)
      : constraint[axis];
  }

  /**
   * The sinusoids positive where one chart's reading of an axis lies past its
   * rest-relative interval `[lo, hi]`, any full-turn alias of the angle
   * considered (`nearestAngleAlias`); none where the analysis cannot tell.
   *
   * The middle angle of the composition (`atan2(s, cos)` with a non-negative
   * cosine, so `asin(s)`) lies past a bound `q` where `s - sin q` is positive;
   * an outer angle `atan2(y, x)` lies past the upper end `β` of an interval no
   * wider than a half turn where `y cos β - x sin β` (the vector's length times
   * `sin(δ - β)`) is positive, and past the lower end `α` where `x sin α - y
   * cos α` is. The alternate chart (`alternateRigJointAngles`) turns each outer
   * angle by a half turn, negating its vector, and reflects the middle angle
   * about its right angle. An interval of a full turn or more, an outer
   * interval wider than a half turn (whose outside is an intersection, not a
   * union, of two arcs) and a middle interval met twice by the half turn the
   * middle angle covers give none.
   *
   * @param read How the axis reads from the swivel (`of`).
   * @param bounds The rest-relative interval (`rig`), degrees.
   * @param alternate Whether the reading is the alternate chart's.
   * @returns The sinusoids, each positive exactly past one end.
   */
  export function bounds(
    read: IRead,
    [lo, hi]: [number, number],
    alternate: boolean,
  ): IAutoMovieSwivelArcs.ISinusoid[] {
    if (hi - lo >= 360) return [];
    if ("sine" in read) {
      // The middle angle is asin(s), or in the alternate chart 180 - asin(s),
      // which lies in [lo, hi] exactly where asin(s) lies in [180 - hi, 180 - lo].
      const [from, to] = alternate ? [180 - hi, 180 - lo] : [lo, hi];
      const first: number = Math.ceil((-90 - to) / 360);
      const last: number = Math.floor((90 - from) / 360);
      if (last < first) return [{ a: 1, b: 0, c: 0 }];
      if (last > first) return [];
      const p: number = Math.max(from + 360 * first, -90);
      const q: number = Math.min(to + 360 * first, 90);
      const out: IAutoMovieSwivelArcs.ISinusoid[] = [];
      if (q < 90)
        out.push({
          ...read.sine,
          a: read.sine.a - Math.sin(q * Quaternion.DEG2RAD),
        });
      if (p > -90)
        out.push(
          swivelArcs.scaled(
            { ...read.sine, a: read.sine.a - Math.sin(p * Quaternion.DEG2RAD) },
            -1,
          ),
        );
      return out;
    }
    // An outer angle δ = atan2(y, x) reads `turn · δ`, or a half turn more in
    // the alternate chart, where the vector is negated.
    if (hi - lo > 180) return [];
    const ends: number[] = [lo * read.turn, hi * read.turn];
    const alpha: number = Math.min(...ends) * Quaternion.DEG2RAD;
    const beta: number = Math.max(...ends) * Quaternion.DEG2RAD;
    const sign: number = alternate ? -1 : 1;
    return [
      swivelArcs.scaled(
        swivelArcs.combined(read.y, Math.cos(beta), read.x, -Math.sin(beta)),
        sign,
      ),
      swivelArcs.scaled(
        swivelArcs.combined(read.x, Math.sin(alpha), read.y, -Math.cos(alpha)),
        sign,
      ),
    ];
  }

  /**
   * A clinical interval as rest-relative degrees, ordered (the inverse of
   * `toClinicalAngle`).
   *
   * @param range The clinical interval, degrees.
   * @param frame The axis's rest frame; omitted, the interval is already
   *   rest-relative.
   * @returns Its two ends, the lesser first.
   */
  export function rig(
    range: IAutoMovieAngleRange,
    frame: IAutoMovieAxisFrame | undefined,
  ): [number, number] {
    const sign: number = frame?.sign ?? 1;
    const neutral: number = frame?.neutral ?? 0;
    const ends: number[] = [
      (range.min - neutral) * sign,
      (range.max - neutral) * sign,
    ];
    return [Math.min(...ends), Math.max(...ends)];
  }
}

/*
 * The ranges a swing cone's two cosines read over an interval of swivels: the
 * middle cosine `ρ = sqrt(1 - s²)` from the range of its sine `s`, and the
 * outer vector `x`, each sinusoid's range read in closed form.
 */
interface IConeRange {
  /*
   * The least middle cosine.
   */
  rhoLow: number;

  /*
   * The greatest middle cosine.
   */
  rhoHigh: number;

  /*
   * The least outer vector.
   */
  xLow: number;

  /*
   * The greatest outer vector.
   */
  xHigh: number;
}

/*
 * A swing cone's cosine ranges over the swivels from `low` to `high` degrees;
 * none where the middle cosine may vanish, which leaves the outer cosine
 * unbounded.
 */
function coneRange(
  cone: swivelJointReadings.ICone,
  low: number,
  high: number,
): IConeRange | null {
  const sLow: number = swivelArcs.lowest(cone.middle, low, high);
  const sHigh: number = -swivelArcs.lowest(
    swivelArcs.scaled(cone.middle, -1),
    low,
    high,
  );
  const squared: number =
    sLow <= 0 && sHigh >= 0 ? 0 : Math.min(sLow * sLow, sHigh * sHigh);
  const rhoHigh: number = Math.sqrt(Math.max(0, 1 - squared));
  const rhoLow: number = Math.sqrt(
    Math.max(0, 1 - Math.max(sLow * sLow, sHigh * sHigh)),
  );
  if (!(rhoLow > 1e-9)) return null;
  return {
    rhoLow,
    rhoHigh,
    xLow: swivelArcs.lowest(cone.outer, low, high),
    xHigh: -swivelArcs.lowest(swivelArcs.scaled(cone.outer, -1), low, high),
  };
}
