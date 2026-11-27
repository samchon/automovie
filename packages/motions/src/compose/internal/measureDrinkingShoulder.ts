import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanDrinkingArm,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * The shoulder's flexion and abduction as Alt Murphy et al. 2006 measure them
 * for the drinking task, in whose definition `FLEXION` and `ABDUCTION` are
 * bounds: "for shoulder flexion/extension in sagittal plane and
 * abduction/adduction in frontal plane", the angle "between the vectors joining
 * the shoulder and elbow markers and the vertical vector from the shoulder
 * marker toward the hip". Each is the unsigned angle between the
 * shoulder-to-elbow vector and the shoulder-to-hip vector, both projected on
 * one plane through the body's heading: the sagittal one (forward and up) for
 * the flexion, the frontal one (to the side and up) for the abduction. What
 * still differs from the source: the planes are the body's heading's, where the
 * source's are the laboratory's; the points are the joints' centres, where the
 * source's are skin markers; and the source's own caution holds, that these
 * "are not the true joint angles".
 * Parameter bones: The posed body's bones.
 * Parameter side: The arm.
 * Parameter yaw: The body's heading, degrees.
 * Returns: The flexion and the abduction, degrees, unsigned.
 */
export function measureDrinkingShoulder(
  bones: ReadonlyMap<
    AutoMovieHumanoidBone,
    Pick<IAutoMovieResolvedBone, "worldPosition">
  >,
  side: AutoMovieHumanSide,
  yaw: number,
): IAutoMovieMotionHumanDrinkingArm.IMeasuredResult {
  const shoulder: IAutoMovieVector3 = bones.get(
    `${side}UpperArm`,
  )!.worldPosition;
  const arm: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    bones.get(`${side}LowerArm`)!.worldPosition,
    shoulder,
  );
  const hip: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    bones.get(`${side}UpperLeg`)!.worldPosition,
    shoulder,
  );
  const heading: number = (yaw * Math.PI) / 180;
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  // The unsigned angle between the two vectors projected on the plane
  // through the world's up and `along`.
  const between = (along: IAutoMovieVector3): number => {
    const a: [number, number] = [AutoMovieEngineVector3.dot(arm, along), AutoMovieEngineVector3.dot(arm, up)];
    const b: [number, number] = [AutoMovieEngineVector3.dot(hip, along), AutoMovieEngineVector3.dot(hip, up)];
    const lengths: number = Math.hypot(...a) * Math.hypot(...b);
    return lengths > 0
      ? (Math.acos(
          Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / lengths)),
        ) *
          180) /
          Math.PI
      : 0;
  };
  return {
    flexion: between({ x: Math.sin(heading), y: 0, z: Math.cos(heading) }),
    abduction: between({ x: Math.cos(heading), y: 0, z: -Math.sin(heading) }),
  };
}
