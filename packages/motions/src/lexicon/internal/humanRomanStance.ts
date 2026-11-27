import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A Roman ride's stance, one foot on each of two seats: the hips a hip height
 * above the seats' middle, heading along the seats' mean forward, each ankle an
 * ankle height above its seat and planted, each knee bending toward a point a
 * shank ahead of and above its foot.
 * Parameter measure: The body's heights and shank.
 * Parameter entry: The entry posture the stance keeps the rest of.
 * Parameter left: The left seat's frame.
 * Parameter right: The right seat's frame.
 * Returns: The standing posture.
 */
export function humanRomanStance(
  measure: Pick<IAutoMovieBodyMeasure, "ankleHeight" | "shank" | "hipHeight">,
  entry: IAutoMovieMotionHumanPosture,
  left: IAutoMovieRigidTransform,
  right: IAutoMovieRigidTransform,
): IAutoMovieMotionHumanPosture {
  const ahead: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    AutoMovieEngineQuaternion.rotateVector(left.rotation, { x: 0, y: 0, z: 1 }),
    AutoMovieEngineQuaternion.rotateVector(right.rotation, { x: 0, y: 0, z: 1 }),
  );
  const middle: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
    left.position,
    right.position,
    0.5,
  );
  const level: IAutoMovieVector3 = AutoMovieEngineVector3.normalize({
    x: ahead.x,
    y: 0,
    z: ahead.z,
  });
  const ankle = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    AutoMovieEngineVector3.add(p, { x: 0, y: measure.ankleHeight, z: 0 });
  const knee = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    AutoMovieEngineVector3.add(
      p,
      AutoMovieEngineVector3.add(AutoMovieEngineVector3.scale(level, measure.shank), {
        x: 0,
        y: measure.shank,
        z: 0,
      }),
    );
  return {
    ...entry,
    root: AutoMovieEngineVector3.add(middle, { x: 0, y: measure.hipHeight, z: 0 }),
    yaw: (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      leftLeg: {
        point: ankle(left.position),
        bend: knee(left.position),
        planted: true,
      },
      rightLeg: {
        point: ankle(right.position),
        bend: knee(right.position),
        planted: true,
      },
    },
  };
}

/*
 * The Roman ride's stance.
 */
export namespace humanRomanStance {
  /*
   * The seats' spacing the legs can stand across: at least the hips' own width,
   * at most both legs spread 30 degrees from the vertical beside it.
   * Parameter measure: The body's legs and hips.
   * Returns: The least and the greatest spacing, metres.
   */
  export function span(
    measure: Pick<IAutoMovieBodyMeasure, "thigh" | "shank" | "hipHalfWidth">,
  ): readonly [narrowest: number, widest: number] {
    return [
      2 * measure.hipHalfWidth,
      2 * (measure.thigh + measure.shank) * Math.sin(Math.PI / 6) +
        2 * measure.hipHalfWidth,
    ];
  }
}
