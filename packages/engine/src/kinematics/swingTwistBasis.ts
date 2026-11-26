import type {
  IAutoMovieJointAxes,
  IAutoMovieSwingTwistBasis,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { normalizeJointAxes } from "./internal/normalizeJointAxes";

/**
 * The frame a ball joint's swing and twist are read in: its unit axes, the
 * great circle (azimuth) a direction lies on, the direction a swing along a
 * circle reaches, and the clamp the reading shares; angles wrap and alias by
 * the engine's `wrapDegrees` and `nearestAngleAlias`.
 *
 * `swingTwistRange` reads and bounds a rotation, and the region's radius table
 * is built in the same frame (`swingTwistRegion`); both take it from here so
 * the frame is written once.
 */
export namespace swingTwistBasis {
  /** Degrees per radian. */
  export const DEG: number = 180 / Math.PI;

  /**
   * The great circles from the rest direction the swing region's radius is read
   * on.
   */
  export const RAYS: number = 360;

  /**
   * The frame of a joint's axes.
   *
   * @param axes The joint's clinical axes.
   * @returns The unit axes.
   */
  export function of(
    axes: IAutoMovieJointAxes,
  ): IAutoMovieSwingTwistBasis.IBasis {
    const normal: IAutoMovieJointAxes = normalizeJointAxes(
      axes,
      "swingTwistRange axes",
    );
    return fromNormalized(normal);
  }

  /**
   * Assemble the swing frame on axes already admitted by normalizeJointAxes.
   * The caller keeps that frozen normalized basis unchanged for its operation.
   *
   * @param basis The admitted orthonormal clinical axes.
   * @returns A fresh swing frame borrowing its axes and owning its circle cross
   *   product.
   */
  export function fromNormalized(
    basis: IAutoMovieJointAxes,
  ): IAutoMovieSwingTwistBasis.IBasis {
    const u: IAutoMovieVector3 = basis.twist;
    const e1: IAutoMovieVector3 = basis.flexion;
    return {
      u,
      f: basis.flexion,
      a: basis.abduction,
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
   */
  export function azimuth(
    basis: IAutoMovieSwingTwistBasis.IBasis,
    direction: IAutoMovieVector3,
  ): number {
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
   * @param azimuthDegrees The circle, degrees about the rest direction from
   *   `e1`.
   * @returns The unit direction.
   */
  export function direction(
    basis: IAutoMovieSwingTwistBasis.IBasis,
    swing: number,
    azimuthDegrees: number,
  ): IAutoMovieVector3 {
    const s: number = swing / DEG;
    const t: number = azimuthDegrees / DEG;
    return directionOnRay(basis, s, Math.cos(t), Math.sin(t));
  }

  /**
   * Prepare one great circle's azimuth for its repeated swing readings. The
   * region's scan and bisection release this reader after that ray.
   *
   * @param basis The admitted frame, whose current vectors each reading
   *   borrows.
   * @param azimuthDegrees The fixed great circle, degrees from e1 about the
   *   rest axis.
   * @returns A reader producing a fresh direction for each supplied swing in
   *   degrees.
   */
  export function prepareRay(
    basis: IAutoMovieSwingTwistBasis.IBasis,
    azimuthDegrees: number,
  ): (swing: number) => IAutoMovieVector3 {
    const angle: number = azimuthDegrees / DEG;
    const cosine: number = Math.cos(angle);
    const sine: number = Math.sin(angle);
    return (swing: number): IAutoMovieVector3 =>
      directionOnRay(basis, swing / DEG, cosine, sine);
  }

  /**
   * A value held within an interval.
   *
   * @param value The value.
   * @param min The least.
   * @param max The greatest.
   * @returns The value, or the end it passes.
   */
  export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}

/** The shared swing weights and original per-component direction grouping. */
function directionOnRay(
  basis: IAutoMovieSwingTwistBasis.IBasis,
  swingRadians: number,
  azimuthCosine: number,
  azimuthSine: number,
): IAutoMovieVector3 {
  const c: number = Math.cos(swingRadians);
  const sine: number = Math.sin(swingRadians);
  const f: number = sine * azimuthCosine;
  const a: number = sine * azimuthSine;
  return {
    x: basis.u.x * c + (basis.e1.x * f + basis.e2.x * a),
    y: basis.u.y * c + (basis.e1.y * f + basis.e2.y * a),
    z: basis.u.z * c + (basis.e1.z * f + basis.e2.z * a),
  };
}
