import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { StrikingBody } from "../../striking/internal/StrikingBody";

/*
 * The pelvis's place that keeps a standing entry's bearing sockets where they
 * are: the mean of a posture's two bearing sockets at root zero, less the
 * pelvis's offset under its heading.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `pelvisOf`.
 */
export function lieDownPelvis(
  prepared: lieDownPelvis.IPrepared,
): (
  posed: IAutoMovieMotionHumanPosture,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  project: ReturnType<typeof prepareHumanPostureProjection>,
  current?: lieDownPelvis.Feet,
) => IAutoMovieVector3 {
  const { bearing, readFeet, body }: lieDownPelvis.IPrepared = prepared;
  return (
    posed: IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
    current?: lieDownPelvis.Feet,
  ): IAutoMovieVector3 => {
    // Read only for a standing entry, which prepared `bearing`.
    const bearer: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.Socket> =
      bearing!;
    const bones: lieDownPelvis.Feet = current ?? readFeet(posed, read, project);
    const socket = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      HumanFoot.sockets(body, bones, side).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          s.socket === bearer[side],
      )!.point;
    const contact: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(socket("left"), socket("right")),
      0.5,
    );
    // The bearing sockets' mean less the pelvis's offset, both at root zero.
    return Vector3.subtract(
      contact,
      Quaternion.rotateVector(
        humanPostureHeading(posed),
        body.rest.get("hips")!,
      ),
    );
  };
}

/*
 * The `pelvisOf` of `lieDown.plan`, built from what that plan prepared.
 */
export namespace lieDownPelvis {
  /*
   * The raw feet and knee-pole frames used by the first descent.
   */
  export type Feet = ReturnType<ReturnType<typeof StrikingBody.prepareTrunk>>;

  /*
   * What `lieDown.plan` prepared for its `pelvisOf`.
   */
  export interface IPrepared {
    /*
     * The `bearing` `lieDown.plan` prepared.
     */
    bearing:
      | Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.Socket>
      | undefined;

    /*
     * The `readFeet` `lieDown.plan` prepared.
     */
    readFeet: ReturnType<typeof StrikingBody.prepareTrunk>;

    /*
     * The `body` `lieDown.plan` prepared.
     */
    body: IAutoMovieMotionHumanBody;
  }
}
