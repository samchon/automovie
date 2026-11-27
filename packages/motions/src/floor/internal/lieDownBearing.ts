import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { StrikingBody } from "../../striking/internal/StrikingBody";

/*
 * The sole socket each foot bears on at the first phase's end: the lowest of
 * its sockets there (the heels sitting down, the toes kneeling), chosen once so
 * the held point never switches.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `bearingOf`.
 */
export function lieDownBearing(
  prepared: lieDownBearing.IPrepared,
): () => Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.Socket> {
  const {
    readFeet,
    posedAt,
    readAtPlan,
    projectAtPlan,
    body,
  }: lieDownBearing.IPrepared = prepared;
  return (): Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.Socket> => {
    const end: ReturnType<ReturnType<typeof StrikingBody.prepareTrunk>> =
      readFeet(posedAt(0, 1), readAtPlan, projectAtPlan);
    const lowest: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanFoot.Socket = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanFoot.Socket =>
      HumanFoot.sockets(body, end, side).reduce(
        (
          a: IAutoMovieMotionHumanFoot.ISocket,
          b: IAutoMovieMotionHumanFoot.ISocket,
        ): IAutoMovieMotionHumanFoot.ISocket => (b.point.y < a.point.y ? b : a),
      ).socket;
    return { left: lowest("left"), right: lowest("right") };
  };
}

/*
 * The `bearingOf` of `lieDown.plan`, built from what that plan prepared.
 */
export namespace lieDownBearing {
  /*
   * What `lieDown.plan` prepared for its `bearingOf`.
   */
  export interface IPrepared {
    /*
     * The `readFeet` `lieDown.plan` prepared.
     */
    readFeet: ReturnType<typeof StrikingBody.prepareTrunk>;

    /*
     * The `posedAt` `lieDown.plan` prepared.
     */
    posedAt: (index: number, u: number) => IAutoMovieMotionHumanPosture;

    /*
     * The `readAtPlan` `lieDown.plan` prepared.
     */
    readAtPlan: ReturnType<typeof prepareHumanPoseResolution>;

    /*
     * The `projectAtPlan` `lieDown.plan` prepared.
     */
    projectAtPlan: ReturnType<typeof prepareHumanPostureProjection>;

    /*
     * The `body` `lieDown.plan` prepared.
     */
    body: IAutoMovieMotionHumanBody;
  }
}
