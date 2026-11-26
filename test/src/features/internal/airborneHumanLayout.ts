import { AutoMovieEngineKinematics, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanFixture } from "./fixtures/IHumanFixture";

/**
 * The straight body of a layout: both arms lowered 80 degrees from the rig's
 * T-pose to the sides, and each arm raised sideways by a further angle.
 *
 * The sign of upper-arm abduction that lowers the left hand, and the sign that
 * mirrors the right arm across the sagittal plane, are read from the posed
 * hands rather than assumed, so a test does not rest on a sign convention.
 *
 * @param person The stored person whose rig is posed.
 * @returns The posed bones for an extra raise of the left and right arm,
 *   degrees.
 */
export const airborneHumanLayout: (
  person: IHumanFixture,
) => (
  left: number,
  right: number,
) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
  person: IHumanFixture,
): ((
  left: number,
  right: number,
) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>) => {
  const posed: (
    joints: IAutoMovieJointPose[],
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    joints: IAutoMovieJointPose[],
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(
      AutoMovieEngineKinematics.resolvePose(
        { skeleton: person.skeleton.id, root: null, joints },
        person.skeleton,
      ).map(
        (
          bone: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [bone.bone, bone],
      ),
    );
  const arms: (left: number, right: number) => IAutoMovieJointPose[] = (
    left: number,
    right: number,
  ): IAutoMovieJointPose[] => [
    { bone: "leftUpperArm", flexion: 0, abduction: left, twist: 0 },
    { bone: "rightUpperArm", flexion: 0, abduction: right, twist: 0 },
  ];
  const hand: (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
  ) => IAutoMovieVector3 = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
  ): IAutoMovieVector3 => bones.get(`${side}Hand`)!.worldPosition;
  const lower: number =
    hand(posed(arms(80, 0)), "left").y < hand(posed(arms(-80, 0)), "left").y
      ? 1
      : -1;
  const reference: IAutoMovieVector3 = hand(posed(arms(lower * 40, 0)), "left");
  const miss: (sign: number) => number = (sign: number): number =>
    Vector3.length(
      Vector3.subtract(hand(posed(arms(0, sign * lower * 40)), "right"), {
        x: -reference.x,
        y: reference.y,
        z: reference.z,
      }),
    );
  const mirror: number = miss(-1) < miss(1) ? -1 : 1;
  return (
    left: number,
    right: number,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    posed(arms(lower * (80 - left), mirror * lower * (80 - right)));
};
