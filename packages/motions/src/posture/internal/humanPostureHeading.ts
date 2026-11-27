import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Compose the existing world-Y yaw, local-X pitch and local-Z roll using three
 * private fixed-axis readers. Angle reads and product grouping remain yaw, then
 * pitch, then roll, followed by the original final normalization.
 */
export function humanPostureHeading(
  posture: Pick<IAutoMovieMotionHumanPosture, HumanPostureHeadingPosture>,
): IAutoMovieQuaternion {
  return Quaternion.normalize(
    Quaternion.multiply(
      YAW(posture.yaw),
      Quaternion.multiply(PITCH(posture.pitch), ROLL(posture.roll)),
    ),
  );
}

/** Original numerical inverse of the shared heading convention. */
export namespace humanPostureHeading {
  /**
   * Read the original three world axes, then apply the same degree atan2/asin
   * formulas in order.
   */
  export function angles(
    rotation: IAutoMovieQuaternion,
  ): Pick<IAutoMovieMotionHumanPosture, HumanPostureHeadingAnglesResult> {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    const left: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const up: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const degrees: number = 180 / Math.PI;
    return {
      yaw: Math.atan2(forward.x, forward.z) * degrees,
      pitch: -Math.asin(Math.max(-1, Math.min(1, forward.y))) * degrees,
      roll: Math.atan2(left.y, up.y) * degrees,
    };
  }
}
/** Private world-up yaw geometry. */
const YAW: ReturnType<typeof Quaternion.prepareAxisAngle> =
  Quaternion.prepareAxisAngle({ x: 0, y: 1, z: 0 });

/** Private intrinsic left-axis pitch geometry. */
const PITCH: ReturnType<typeof Quaternion.prepareAxisAngle> =
  Quaternion.prepareAxisAngle({ x: 1, y: 0, z: 0 });

/** Private intrinsic forward-axis roll geometry. */
const ROLL: ReturnType<typeof Quaternion.prepareAxisAngle> =
  Quaternion.prepareAxisAngle({ x: 0, y: 0, z: 1 });
/** The alternatives of `HumanPostureHeadingPosture`'s site. */
type HumanPostureHeadingPosture = "yaw" | "pitch" | "roll";
/** The alternatives of `HumanPostureHeadingAnglesResult`'s site. */
type HumanPostureHeadingAnglesResult = "yaw" | "pitch" | "roll";
