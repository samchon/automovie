import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbReference,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanLimbFit } from "./HumanLimbFit";

/**
 * A limb's reference solution read off a pose: the clinical angles of its
 * upper and lower bones. A law solves the limb once at the instant its action
 * is about (the grasp, the clasp, the placement) and hands the result to
 * every goal of the stroke as `HumanPosture.IGoal.reference`.
 *
 * @param pose The pose the limb was solved in.
 * @param limb The limb.
 * @returns The reference.
 */
export function humanLimbReference(
  pose: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
): IAutoMovieHumanLimbReference {
  const bones: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
  const read: (
    bone: AutoMovieHumanoidBone,
  ) => readonly [number, number, number] = (
    bone: AutoMovieHumanoidBone,
  ): readonly [number, number, number] => {
    const joint: IAutoMovieJointPose | undefined = pose.joints.find(
      (j: IAutoMovieJointPose): boolean => j.bone === bone,
    );
    return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
  };
  return { upper: read(bones.upper), lower: read(bones.lower) };
}
