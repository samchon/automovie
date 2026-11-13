import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { normalizeJointAxes } from "./normalizeJointAxes";

/**
 * The frame a ball joint's swing and twist are read in: its unit axes, the
 * great circle (azimuth) a direction lies on, the direction a swing along a
 * circle reaches, and the angle arithmetic the reading shares.
 *
 * `swingTwistRange` reads and bounds a rotation, and the region's radius table
 * is built in the same frame (`swingTwistRegion`); both take it from here so
 * the frame is written once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, its members and their units.
 * @evidence contracts/development/design.md#principled-representation The rest direction, the flexion axis and their cross product span the planes the great circles lie in; angles are degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The frame, the circle of a direction, the direction of a circle and three angle functions, each read by both owners of the swing-twist range.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint is named; the axes are the caller's.
 */
export namespace swingTwistBasis {
  /** Degrees per radian. */
  export const DEG: number = 180 / Math.PI;

  /** The great circles from the rest direction the swing region's radius is read on. */
  export const RAYS: number = 360;

  /**
   * A joint's unit axes and the two axes of the great circles through its
   * rest direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each axis and the circles' two axes.
   * @evidence contracts/development/design.md#principled-representation The clinical axes with the plane the circles lie in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five axes, all read by the reading, the region and the projection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint is named.
   */
  export interface IBasis {
    /** The limb's rest direction, the twist axis. */
    u: IAutoMovieVector3;

    /** The flexion axis. */
    f: IAutoMovieVector3;

    /** The abduction axis. */
    a: IAutoMovieVector3;

    /** The first axis of the great circles, the flexion axis again. */
    e1: IAutoMovieVector3;

    /** The second axis of the great circles, the rest direction turned by `e1`. */
    e2: IAutoMovieVector3;
  }

  /**
   * The frame of a joint's axes.
   *
   * @param axes The joint's clinical axes.
   * @returns The unit axes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the members of the result.
   * @evidence contracts/development/implementation.md#principled-implementation The axes are admitted and normalized by the engine's own owner, then the second circle axis is the rest direction crossed with the first.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One admission and one cross product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An invalid basis throws.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `normalizeJointAxes`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(axes: IAutoMovieJointAxes): IBasis {
    const normal: IAutoMovieJointAxes = normalizeJointAxes(
      axes,
      "swingTwistRange axes",
    );
    const u: IAutoMovieVector3 = normal.twist;
    const e1: IAutoMovieVector3 = normal.flexion;
    return {
      u,
      f: normal.flexion,
      a: normal.abduction,
      e1,
      e2: Vector3.cross(u, e1),
    };
  }

  /**
   * The great circle a direction lies on.
   *
   * @param basis The frame.
   * @param direction A unit direction in the rest frame.
   * @returns Degrees about the rest direction from `e1`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the circle's reference and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The direction's parts along the circle axes give its angle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arctangent.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function azimuth(basis: IBasis, direction: IAutoMovieVector3): number {
    return (
      Math.atan2(
        Vector3.dot(direction, basis.e2),
        Vector3.dot(direction, basis.e1),
      ) * DEG
    );
  }

  /**
   * The direction a swing of some degrees along a great circle reaches.
   *
   * @param basis The frame.
   * @param swing Degrees from the rest direction.
   * @param azimuthDegrees The circle, degrees about the rest direction from `e1`.
   * @returns The unit direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, their units and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The rest direction turned toward the circle's direction by the swing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sum of three scaled axes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function direction(
    basis: IBasis,
    swing: number,
    azimuthDegrees: number,
  ): IAutoMovieVector3 {
    const s: number = swing / DEG;
    const t: number = azimuthDegrees / DEG;
    return Vector3.add(
      Vector3.scale(basis.u, Math.cos(s)),
      Vector3.add(
        Vector3.scale(basis.e1, Math.sin(s) * Math.cos(t)),
        Vector3.scale(basis.e2, Math.sin(s) * Math.sin(t)),
      ),
    );
  }

  /**
   * An angle's full-turn alias nearest an interval, the one inside it when
   * any is.
   *
   * @param angle Degrees.
   * @param range The interval.
   * @returns The alias, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the alias chosen.
   * @evidence contracts/development/implementation.md#principled-implementation The alias nearest the interval's middle, then its neighbours when that one lies outside and another lies inside.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rounding and one scan of two neighbours.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function alias(angle: number, range: IAutoMovieAngleRange): number {
    const middle: number = (range.min + range.max) / 2;
    const near: number = angle - 360 * Math.round((angle - middle) / 360);
    if (near >= range.min && near <= range.max) return near;
    for (const other of [near - 360, near + 360])
      if (other >= range.min && other <= range.max) return other;
    return near;
  }

  /**
   * An angle wrapped to (-180, 180].
   *
   * @param degrees Degrees.
   * @returns The wrapped angle, 180 for a half turn either way.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the interval and the end it keeps.
   * @evidence contracts/development/implementation.md#principled-implementation Whole turns are taken off by rounding.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rounding.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function wrap(degrees: number): number {
    const turned: number = degrees - 360 * Math.round(degrees / 360);
    return turned === -180 ? 180 : turned;
  }

  /**
   * A value held within an interval.
   *
   * @param value The value.
   * @param min The least.
   * @param max The greatest.
   * @returns The value, or the end it passes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation The least with the greatest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
