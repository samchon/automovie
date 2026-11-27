import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { GymnasticsFlight } from "../../sport/GymnasticsFlight";
import { floorEntry } from "./floorEntry";

/**
 * The release from a standing entry's first phase into the second
 * (`floorEntry.between`): from the frozen posture placed at the first phase's
 * end to the posture placed at the second's; none for an entry already down.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `release`.
 */
export function lieDownRelease(
  prepared: lieDownRelease.IPrepared,
): lieDownRelease.Release | undefined {
  const {
    entered,
    body,
    placed,
    readAtPlan,
    projectAtPlan,
  }: lieDownRelease.IPrepared = prepared;
  return entered === null
    ? floorEntry.between(
        body,
        GymnasticsFlight.frozen(
          body,
          placed(0, 1, readAtPlan, projectAtPlan),
          readAtPlan,
          projectAtPlan,
        ),
        placed(1, 1, readAtPlan, projectAtPlan),
      )
    : undefined;
}

/** The `release` of `lieDown.plan`, built from what that plan prepared. */
export namespace lieDownRelease {
  /** The first unplanted phase begins at its actual released joints. */
  export type Release = ReturnType<typeof floorEntry.between> | undefined;

  /** What `lieDown.plan` prepared for its `release`. */
  export interface IPrepared {
    /** The `entered` `lieDown.plan` prepared. */
    entered: floorEntry.IStart["entered"];

    /** The `body` `lieDown.plan` prepared. */
    body: IAutoMovieMotionHumanBody;

    /** The `placed` `lieDown.plan` prepared. */
    placed: (
      index: number,
      u: number,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ) => IAutoMovieMotionHumanPosture;

    /** The `readAtPlan` `lieDown.plan` prepared. */
    readAtPlan: ReturnType<typeof prepareHumanPoseResolution>;

    /** The `projectAtPlan` `lieDown.plan` prepared. */
    projectAtPlan: ReturnType<typeof prepareHumanPostureProjection>;
  }
}
