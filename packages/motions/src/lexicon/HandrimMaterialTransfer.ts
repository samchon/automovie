import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanMountRider } from "./HumanMountRider";

/** The material contact frame consumed by the rider's wrist fit. */
type Grip = Parameters<typeof HumanMountRider.hold>[3];

/**
 * A local transfer between a rim's material trajectory and a released hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the signed rim rate and transfer in the current chair frame.
 * @evidence contracts/development/design.md#principled-representation The admitted radial normal and tangent orient a rotation about the axle, with lengths in metres and rates in radians per second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handrim law supplies two samples in a common chair frame. The helper owns the local angle and transient continuation alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hand retains the rim's radius and axle during the continuation without adding a sample outside the material contact.
 */
export namespace HandrimMaterialTransfer {
  /**
   * Recover the signed angular rate from inward samples at a contact boundary.
   *
   * @param anchor The grip at the boundary, with its admitted tangent.
   * @param displaced The inward material sample transformed into the anchor's chair frame.
   * @param seconds The displaced sample second minus the anchor's, in seconds.
   * @returns The projected one-sided rate in radians per second, or zero when the clock cannot represent a finite difference.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, signed sample interval and unresolved rate.
   * @evidence contracts/development/implementation.md#principled-implementation Dot the displaced radial direction with the anchor's sine and cosine axes. Divide the signed angle by the signed time difference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A single angular projection followed by the finite-rate condition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The frame is supplied by the chair and no out-of-window callback is required.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed number of scalar and vector operations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The motion law computes this once per boundary and reuses its scalar result.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input.
   */
  export function rate(anchor: Grip, displaced: Grip, seconds: number): number {
    const angle: number = Math.atan2(
      Vector3.dot(anchor.axis!, displaced.normal),
      Vector3.dot(anchor.normal, displaced.normal),
    );
    const rate: number = angle / seconds;
    return Number.isFinite(rate) ? rate : 0;
  }

  /**
   * Continue the angular tangent briefly through approach or recovery.
   *
   * @param grip The boundary contact placed in the chair's current world frame.
   * @param radius The radius of the declared rim in metres.
   * @param rate The boundary angular rate in radians per second.
   * @param seconds The signed time from the boundary.
   * @param span The positive duration over which the continuation fades, in seconds.
   * @returns Contact goals with the carried radial and tangential directions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the offset, radius, time window and output goals.
   * @evidence contracts/development/implementation.md#principled-implementation The angular lead is time multiplied by the complement of minimum jerk. It starts with unit slope at zero seconds and reaches zero with zero slope at the fade boundary. Rotate the radial and tangent about the shared axle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Compute the angular lead, then rotate the two directions and translate the contact by their radial difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Use the declared radius and original axle for the tapered continuation. The handrim law supplies the unchanged grip before or after the continuation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant arithmetic per transfer sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the prepared contact and angular rate for the active hand.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one grip and retains no input.
   */
  export function advance(
    grip: Grip,
    radius: number,
    rate: number,
    seconds: number,
    span: number,
  ): Grip {
    const share: number = Math.min(1, Math.abs(seconds) / span);
    const lead: number = seconds * (1 - minimumJerk.share(share));
    if (lead === 0 || rate === 0) return grip;

    const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      Vector3.cross(grip.normal, grip.axis!),
      (lead * rate) / Quaternion.DEG2RAD,
    );
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(
      rotation,
      grip.normal,
    );
    return {
      ...grip,
      point: Vector3.add(
        grip.point,
        Vector3.scale(Vector3.subtract(normal, grip.normal), radius),
      ),
      normal,
      axis: Quaternion.rotateVector(rotation, grip.axis!),
    };
  }
}
