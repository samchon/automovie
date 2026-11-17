import type {
  IAutoMovieJointAxes,
  IAutoMovieSwingTwistBasis,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { normalizeJointAxes } from "./normalizeJointAxes";

/**
 * The frame a ball joint's swing and twist are read in: its unit axes, the
 * great circle (azimuth) a direction lies on, the direction a swing along a
 * circle reaches, and the clamp the reading shares; angles wrap and alias by
 * the engine's `wrapDegrees` and `nearestAngleAlias`.
 *
 * `swingTwistRange` reads and bounds a rotation, and the region's radius table
 * is built in the same frame (`swingTwistRegion`); both take it from here so
 * the frame is written once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, its members and their units.
 * @evidence contracts/development/design.md#principled-representation The rest direction, the flexion axis and their cross product span the planes the great circles lie in; angles are degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The frame, the circle of a direction, the direction of a circle and a clamp, each read by both owners of the swing-twist range.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint is named; the axes are the caller's.
 */
export namespace swingTwistBasis {
  /** Degrees per radian. */
  export const DEG: number = 180 / Math.PI;

  /** The great circles from the rest direction the swing region's radius is read on. */
  export const RAYS: number = 360;

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
   * @returns A fresh swing frame borrowing its axes and owning its circle cross product.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States prior admission, unchanged-basis lifetime and which returned vectors are borrowed or fresh.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same admitted twist/flexion axes and their cross product as of; normalization remains with normalizeJointAxes before this entry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This one assembly serves of and explicit operation preparation without copying the frame convention.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Performs no repair or alternative normalization; callers must supply the already admitted orthonormal basis, as the engine's other OnBasis entries require.
   * @evidence contracts/development/implementation.md#efficient-algorithms One cross product and one fixed-size frame replace repeated raw-axis admission comparisons for an explicitly prepared operation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work of delegates after its original admission, while explicit preparation shares its same successful normalized basis with composition and inverse consumers; each frame assembly still computes its actual cross product.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh frame with a fresh cross vector and borrowed admitted axes; retains no state or resource.
   */
  export function fromNormalized(basis: IAutoMovieJointAxes): IAutoMovieSwingTwistBasis.IBasis {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the circle's reference and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The direction's parts along the circle axes give its angle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arctangent.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * @param azimuthDegrees The circle, degrees about the rest direction from `e1`.
   * @returns The unit direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, their units and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The rest direction turned toward the circle's direction by the swing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private direction owner turns three scalar weights into a vector, retaining the original outer rest-axis product plus the grouped two circle-axis products; prepareRay shares that same formula.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the same trigonometric weights and per-component multiplication/addition grouping, without approximation, normalization or changed angular bounds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work creates one result vector instead of three scaled vectors and two summed vectors; all region-ray, projection and chart-inversion queries remain, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same deterministic sin(swing) value supplies both circle weights and each weight supplies all three components; no direction or quaternion result is cached.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh caller-owned vector and retains no input, intermediate vector, reader or handle.
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
   * Prepare one great circle's azimuth for its repeated swing readings.
   * The region's scan and bisection release this reader after that ray.
   *
   * @param basis The admitted frame, whose current vectors each reading borrows.
   * @param azimuthDegrees The fixed great circle, degrees from e1 about the rest axis.
   * @returns A reader producing a fresh direction for each supplied swing in degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed azimuth, degree-valued swing queries, borrowed frame vectors, fresh results and one-ray release scope.
   * @evidence contracts/development/implementation.md#principled-implementation Retains only the fixed azimuth's sine and cosine; every swing still uses the same directionOnRay trigonometric weights and component grouping as direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One small reader connects actual region scan/bisection queries to the same direction owner used by ordinary projection and chart inversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No ray, scan step, bisection, direction normalization or angular bound changes; no sampled direction or approximate trigonometric table is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms One azimuth conversion and two trigonometric values serve the ray; each query retains the original swing sine/cosine and one result vector, avoiding two repeated azimuth trig calls per reach test. One extra closure per ray is the setup cost, and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual region loop fixes one numeric azimuth while testing many swings; only those two invariant scalar values are shared, and the basis vectors and every current swing still feed the common numerical owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader owns two azimuth scalars and a borrowed basis until the ray loop ends; it retains no constraint, direction population, table, quaternion or global cache.
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
