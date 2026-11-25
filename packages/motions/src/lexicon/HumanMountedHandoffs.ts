import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanLimbFit } from "../posture/HumanLimbFit";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** A limb's joints by bone, clinical degrees `[flexion, abduction, twist]`. */
type Joints = IAutoMovieMotionHumanPosture["joints"];

/** The four limbs a key may move by a goal. */
const LIMBS: readonly AutoMovieHumanLimb[] = [
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
];

/**
 * Each transfer's limb hand-offs: a limb a goal moves at one end of a transfer
 * and its joints at the other has the goal's end fitted once
 * (`resolveHumanPosture`), so the transfer blends joints to joints instead of
 * holding the goal and dropping it at an end.
 *
 * @param body The performer's body.
 * @param entry The entry posture, the first transfer's start.
 * @param keys Each figure's key posture.
 * @returns Per transfer, each handed-off limb's fitted joints by bone.
 */
export function HumanMountedHandoffs(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  keys: readonly IAutoMovieMotionHumanPosture[],
): Partial<Record<AutoMovieHumanLimb, Joints>>[] {
  // A limb a goal moves at one end of a transfer and its joints at the other: the goal's end fitted once here, so the transfer blends joints to joints instead of holding the goal and dropping it at an end.
  const handoff: (
    index: number,
  ) => Partial<Record<AutoMovieHumanLimb, Joints>> = (
    index: number,
  ): Partial<Record<AutoMovieHumanLimb, Joints>> => {
    const before: IAutoMovieMotionHumanPosture =
      index === 0 ? entry : keys[index - 1]!;
    const after: IAutoMovieMotionHumanPosture = keys[index]!;
    const out: Partial<Record<AutoMovieHumanLimb, Joints>> = {};
    const fitted: Map<IAutoMovieMotionHumanPosture, IAutoMoviePose> = new Map();
    for (const limb of LIMBS) {
      const a: IAutoMovieHumanLimbGoal | undefined = before.limbs[limb];
      const b: IAutoMovieHumanLimbGoal | undefined = after.limbs[limb];
      if ((a === undefined) === (b === undefined)) continue;
      const end: IAutoMovieMotionHumanPosture =
        a === undefined ? after : before;
      let pose: IAutoMoviePose | undefined = fitted.get(end);
      if (pose === undefined) {
        pose = resolveHumanPosture(body, end);
        fitted.set(end, pose);
      }
      const chain: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
      const joints: Joints = {};
      for (const joint of pose.joints)
        if (
          joint.bone === chain.upper ||
          joint.bone === chain.lower ||
          joint.bone === chain.effector
        )
          joints[joint.bone] = [
            joint.flexion ?? 0,
            joint.abduction ?? 0,
            joint.twist ?? 0,
          ];
      out[limb] = joints;
    }
    return out;
  };
  return keys.map(
    (
      _: IAutoMovieMotionHumanPosture,
      i: number,
    ): Partial<Record<AutoMovieHumanLimb, Joints>> => handoff(i),
  );
}
