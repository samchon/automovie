import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import type { pickUpPosture } from "../../handling/internal/pickUpPosture";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { HumanTravelLeaf } from "./HumanTravelLeaf";

/**
 * The opening's posture at a second: the standing or lowered base, or the walk
 * round with the leaf, lowered further over a low handle.
 *
 * Part of `HumanTravelLeaf.openDoor`'s plan, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `shown`.
 */
export function HumanTravelLeafShown(
  prepared: HumanTravelLeafShown.IPrepared,
): IAutoMovieMotionHumanActionPlan["posture"] {
  const { body, walked, lowered, base }: HumanTravelLeafShown.IPrepared =
    prepared;
  const shown: IAutoMovieMotionHumanActionPlan["posture"] = (
    t: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture => {
    if (walked === null) return base(t, channels, resolution, projection);
    const walking: IAutoMovieMotionHumanPosture = walked.posture(
      Math.min(walked.duration, t),
      lowered === null ? channels : undefined,
      resolution,
      projection,
    );
    if (lowered === null) return walking;

    // The lean the low handle asks moves the pelvis down and back from
    // the walk's own, and the walk's swinging foot was planned for the
    // walk's pelvis: the pelvis is lowered further, as the walk's own
    // ground solve lowers it for a swinging leg's claim, until each leg,
    // planted or swinging, reaches its foot with the knee's least bend
    // (`resolveHumanPosture.lower` over both legs' goals).
    const leant: IAutoMovieMotionHumanPosture = lowered.lower(
      walking,
      AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, t / HumanTravelLeaf.TAKE)),
      resolution,
      projection,
    );
    const legs: IAutoMovieMotionHumanPosture["limbs"] = {
      ...leant.limbs,
    };
    for (const leg of ["leftLeg", "rightLeg"] as const) {
      const goal: IAutoMovieMotionHumanPosture["limbs"][typeof leg] =
        leant.limbs[leg];
      if (goal !== undefined && goal.planted !== true)
        legs[leg] = { ...goal, planted: true };
    }
    const reaching: IAutoMovieMotionHumanPosture = lowerHumanPosture(
      body,
      { ...leant, limbs: legs },
      undefined,
      resolution,
    );
    return { ...leant, root: reaching.root };
  };
  return shown;
}

/** The `shown` of `HumanTravelLeaf.openDoor`'s plan and what it reads. */
export namespace HumanTravelLeafShown {
  /** What `HumanTravelLeaf.openDoor`'s plan prepared for its `shown`. */
  export interface IPrepared {
    /** The plan's body. */
    body: IAutoMovieMotionHumanBody;

    /** The walk round with the leaf, or none when standing holds. */
    walked: IAutoMovieMotionHumanActionPlan | null;

    /** The lowered stance over a low handle, or none. */
    lowered: pickUpPosture.IStance | null;

    /** The standing or lowered base posture. */
    base: IAutoMovieMotionHumanActionPlan["posture"];
  }
}
