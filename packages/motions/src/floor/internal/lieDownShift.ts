import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { floorEntry } from "./floorEntry";
import { lieDownPelvis } from "./lieDownPelvis";

/*
 * The root's floor shift that keeps a standing entry's feet in place: the stood
 * pelvis less the pelvis at this posture through the first phase, and less the
 * landed pelvis after it; none for an entry already down.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `shift`.
 */
export function lieDownShift(
  prepared: lieDownShift.IPrepared,
): (
  index: number,
  posed: IAutoMovieMotionHumanPosture,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  project: ReturnType<typeof prepareHumanPostureProjection>,
  current?: lieDownPelvis.Feet,
) => IAutoMovieVector3 {
  const { entered, pelvisOf, landed, stood }: lieDownShift.IPrepared = prepared;
  return (
    index: number,
    posed: IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
    current?: lieDownPelvis.Feet,
  ): IAutoMovieVector3 => {
    if (entered !== null) return { x: 0, y: 0, z: 0 };
    const now: IAutoMovieVector3 =
      index === 0 ? pelvisOf(posed, read, project, current) : landed!;
    return { x: stood!.x - now.x, y: 0, z: stood!.z - now.z };
  };
}

/*
 * The `shift` of `lieDown.plan`, built from what that plan prepared.
 */
export namespace lieDownShift {
  /*
   * What `lieDown.plan` prepared for its `shift`.
   */
  export interface IPrepared {
    /*
     * The `entered` `lieDown.plan` prepared.
     */
    entered: floorEntry.IStart["entered"];

    /*
     * The `pelvisOf` `lieDown.plan` prepared.
     */
    pelvisOf: (
      posed: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
      current?: lieDownPelvis.Feet,
    ) => IAutoMovieVector3;

    /*
     * The `landed` `lieDown.plan` prepared.
     */
    landed: IAutoMovieVector3 | undefined;

    /*
     * The `stood` `lieDown.plan` prepared.
     */
    stood: IAutoMovieVector3 | undefined;
  }
}
