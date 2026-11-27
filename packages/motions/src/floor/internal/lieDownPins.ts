import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { floorEntry } from "./floorEntry";
import { prepareLieDownFootPins } from "./prepareLieDownFootPins";

/**
 * The feet's pins of a standing entry's first phase (`prepareLieDownFootPins`),
 * between the stand's feet and the feet where that phase ends; none for an
 * entry already down.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `plants`.
 */
export function lieDownPins(
  prepared: lieDownPins.IPrepared,
): lieDownPins.Pins | undefined {
  const {
    entered,
    body,
    readFeet,
    stoodPose,
    readAtPlan,
    projectAtPlan,
    posedAt,
  }: lieDownPins.IPrepared = prepared;
  return entered === null
    ? prepareLieDownFootPins(
        body,
        readFeet(stoodPose, readAtPlan, projectAtPlan),
        readFeet(posedAt(0, 1), readAtPlan, projectAtPlan),
      )
    : undefined;
}

/** The `plants` of `lieDown.plan`, built from what that plan prepared. */
export namespace lieDownPins {
  /** The pivot writer for the standing route. */
  export type Pins = ReturnType<typeof prepareLieDownFootPins> | undefined;

  /** What `lieDown.plan` prepared for its `plants`. */
  export interface IPrepared {
    /** The `entered` `lieDown.plan` prepared. */
    entered: floorEntry.IStart["entered"];

    /** The `body` `lieDown.plan` prepared. */
    body: IAutoMovieMotionHumanBody;

    /** The `readFeet` `lieDown.plan` prepared. */
    readFeet: ReturnType<typeof StrikingBody.prepareTrunk>;

    /** The `stoodPose` `lieDown.plan` prepared. */
    stoodPose: IAutoMovieMotionHumanPosture;

    /** The `readAtPlan` `lieDown.plan` prepared. */
    readAtPlan: ReturnType<typeof prepareHumanPoseResolution>;

    /** The `projectAtPlan` `lieDown.plan` prepared. */
    projectAtPlan: ReturnType<typeof prepareHumanPostureProjection>;

    /** The `posedAt` `lieDown.plan` prepared. */
    posedAt: (index: number, u: number) => IAutoMovieMotionHumanPosture;
  }
}
