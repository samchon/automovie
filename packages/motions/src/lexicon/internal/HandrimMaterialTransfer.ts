import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanMountRider } from "./HumanMountRider";

/*
 * A local transfer between a rim's material trajectory and a released hand.
 */
export namespace HandrimMaterialTransfer {
  /*
   * Recover the signed angular rate from inward samples at a contact boundary.
   * Parameter anchor: The grip at the boundary, with its admitted tangent.
   * Parameter displaced: The inward material sample transformed into the anchor's
   * chair frame.
   * Parameter seconds: The displaced sample second minus the anchor's, in seconds.
   * Returns: The projected one-sided rate in radians per second, or zero when
   * the clock cannot represent a finite difference.
   */
  export function rate(anchor: Grip, displaced: Grip, seconds: number): number {
    const angle: number = Math.atan2(
      AutoMovieEngineVector3.dot(anchor.axis!, displaced.normal),
      AutoMovieEngineVector3.dot(anchor.normal, displaced.normal),
    );
    return seconds === 0 ? 0 : angle / seconds;
  }

  /*
   * Continue the angular tangent briefly through approach or recovery.
   * Parameter grip: The boundary contact placed in the chair's current world frame.
   * Parameter radius: The radius of the declared rim in metres.
   * Parameter rate: The boundary angular rate in radians per second.
   * Parameter seconds: The signed time from the boundary.
   * Parameter span: The positive duration over which the continuation fades, in
   * seconds.
   * Returns: Contact goals with the carried radial and tangential directions.
   */
  export function advance(
    grip: Grip,
    radius: number,
    rate: number,
    seconds: number,
    span: number,
  ): Grip {
    const share: number = Math.min(1, Math.abs(seconds) / span);
    const lead: number = seconds * (1 - AutoMovieEngineMotionSampling.minimumJerkShare(share));
    if (lead === 0 || rate === 0) return grip;

    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
      AutoMovieEngineVector3.cross(grip.normal, grip.axis!),
      (lead * rate) / AutoMovieEngineQuaternion.DEG2RAD,
    );
    const normal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      rotation,
      grip.normal,
    );
    return {
      ...grip,
      point: AutoMovieEngineVector3.add(
        grip.point,
        AutoMovieEngineVector3.scale(AutoMovieEngineVector3.subtract(normal, grip.normal), radius),
      ),
      normal,
      axis: AutoMovieEngineQuaternion.rotateVector(rotation, grip.axis!),
    };
  }
}

/*
 * The material contact frame consumed by the rider's wrist fit.
 */
type Grip = Parameters<typeof HumanMountRider.hold>[3];
