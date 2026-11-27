import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import type { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";

/**
 * Test the available vertical leg travel above the two original ankle plants.
 *
 * @param body The measured leg lengths and knee domains.
 * @param keyed The candidate trunk before the additional downward shift.
 * @param stance The original ankle positions.
 * @param sink The required downward travel in metres.
 * @param resolution The call's FK reader.
 * @returns Whether both hips remain above reachable planted ankles.
 */
export function kissCanLower(
  body: IAutoMovieMotionHumanBody,
  keyed: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  sink: number,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
): boolean {
  const hips: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
    body,
    keyed,
    keyed.joints,
    resolution,
    new Set<AutoMovieHumanoidBone>(["leftUpperLeg", "rightUpperLeg"]),
  );
  return (["left", "right"] as const).every(
    (side: AutoMovieHumanSide): boolean => {
      const name: AutoMovieHumanoidBone = `${side}LowerLeg`;
      const range = AutoMovieEngineKinematics.getConstraint(
        name,
        readHumanBone(body, name)?.constraint ?? null,
      )?.flexion;
      if (range === null || range === undefined) return false;
      const hip: IAutoMovieVector3 = hips.get(`${side}UpperLeg`)!.worldPosition;
      const ankle: IAutoMovieVector3 = stance[side].ankle;
      const slack: number = lowerHumanPosture.short(
        body,
        hip,
        ankle,
        range.max,
      );
      return hip.y - sink >= ankle.y && sink <= slack;
    },
  );
}
