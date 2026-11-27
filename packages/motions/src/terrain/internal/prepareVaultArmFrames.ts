import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * Prepare the preceding support's arm frames across a fixed named vault. Keep
 * every published stance event as an exact interpolation knot. Sample two wrist
 * axes and reconstruct their basis to remain stable through turns.
 */
export function prepareVaultArmFrames(
  body: IAutoMovieMotionHumanBody,
  supported: IAutoMovieMotionHumanActionPlan,
): (
  seconds: number,
) => (side: AutoMovieHumanSide) => prepareVaultArmFrames.IFrame {
  const select: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    ARMS,
  );
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const duration: number = supported.duration;
  const read: (seconds: number) => number[] = prepareHumanSampledCourse({
    from: 0,
    to: duration,
    marks: supported.events.map((event): number => event.share * duration),
    sample: (seconds: number): number[] => {
      const raw: IAutoMovieMotionHumanPosture = supported.posture(
        seconds,
        undefined,
        resolution,
      );
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = select(
        resolveHumanPosture.seeded(
          body,
          raw,
          undefined,
          undefined,
          resolution,
          ARMS,
        ).pose,
        resolution(),
      );
      const frame = (side: AutoMovieHumanSide): number[] => {
        const wrist: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
        return [
          ...components(wrist.worldPosition),
          ...components(bones.get(`${side}LowerArm`)!.worldPosition),
          ...components(AutoMovieEngineQuaternion.rotateVector(wrist.worldRotation, X)),
          ...components(AutoMovieEngineQuaternion.rotateVector(wrist.worldRotation, Y)),
        ];
      };
      return [...frame("left"), ...frame("right")];
    },
    step: AutoMovieMotionHumanArmCourse.STEP,
    tolerance: { kind: "absolute", absolute: 0.00025 },
  });
  return (
    seconds: number,
  ): ((side: AutoMovieHumanSide) => prepareVaultArmFrames.IFrame) => {
    const sample: number[] = read(seconds);
    return (side: AutoMovieHumanSide): prepareVaultArmFrames.IFrame => {
      const index: number = side === "left" ? 0 : 12;
      const x: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(at(sample, index + 6));
      const z: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
        AutoMovieEngineVector3.cross(x, at(sample, index + 9)),
      );
      const y: IAutoMovieVector3 = AutoMovieEngineVector3.cross(z, x);
      return {
        wrist: at(sample, index),
        elbow: at(sample, index + 3),
        rotation: AutoMovieEngineMath.quaternionFromBasis(x, y, z),
      };
    };
  };
}

/*
 * Frames read by the vault's reaching and peeling wrist goals.
 */
export namespace prepareVaultArmFrames {
  /*
   * The displayed arm frame, in world metres and unit quaternion axes.
   */
  export interface IFrame {
    /*
     * The displayed wrist position.
     */
    wrist: IAutoMovieVector3;
    /*
     * The bend goal's reference at the displayed elbow.
     */
    elbow: IAutoMovieVector3;
    /*
     * The displayed wrist orientation.
     */
    rotation: IAutoMovieQuaternion;
  }
}

/*
 * World frames of the wrists and elbows at one prepared support sample.
 */
const ARMS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "leftHand",
  "leftLowerArm",
  "rightHand",
  "rightLowerArm",
]);

/*
 * Axis pair used to sample orientation without quaternion sign changes.
 */
const X: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/*
 * The other measured axis of each wrist's orthonormal frame.
 */
const Y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * Flatten a vector into this prepared curve's contiguous sample.
 */
function components(v: IAutoMovieVector3): [number, number, number] {
  return [v.x, v.y, v.z];
}

/*
 * Read one vector from a prepared curve's sample.
 */
function at(sample: readonly number[], i: number): IAutoMovieVector3 {
  return { x: sample[i]!, y: sample[i + 1]!, z: sample[i + 2]! };
}
