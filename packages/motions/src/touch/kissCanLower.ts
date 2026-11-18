import { getConstraint } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanRise, IAutoMovieVector3 } from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
/** Both planted legs must span their original ankles at the lowered hip height. */
export function kissCanLower(
  body: IAutoMovieMotionHumanBody,
  keyed: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  sink: number,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
): boolean {
  const hips: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
    body, keyed, keyed.joints, resolution,
    new Set<AutoMovieHumanoidBone>(["leftUpperLeg", "rightUpperLeg"]),
  );
  return (["left", "right"] as const).every((side: AutoMovieHumanSide): boolean => {
    const name: AutoMovieHumanoidBone = `${side}LowerLeg`;
    const range = getConstraint(name, readHumanBone(body, name)?.constraint ?? null)?.flexion;
    if (range === null || range === undefined) return false;
    const hip: IAutoMovieVector3 = hips.get(`${side}UpperLeg`)!.worldPosition;
    const ankle: IAutoMovieVector3 = stance[side].ankle;
    const slack: number = lowerHumanPosture.short(body, hip, ankle, range.max);
    return hip.y - sink >= ankle.y && sink <= slack;
  });
}
