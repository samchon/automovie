import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDive,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { dive } from "./dive";

/*
 * A foot's roll about its ball, toes down, by an angle: the foot's placement
 * turned about the axis across its heading through the ball.
 *
 * Part of `dive.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `roll`.
 */
export function diveFootRoll(
  prepared: diveFootRoll.IPrepared,
): (side: AutoMovieHumanSide) => dive.FootRoll {
  const { feet, body, up }: diveFootRoll.IPrepared = prepared;
  return (side: AutoMovieHumanSide): dive.FootRoll => {
    const foot: IAutoMovieMotionHumanFoot.IPlacement = feet[side];
    const local: IAutoMovieVector3 = HumanFoot.offset(body, side, "ball");
    const ball: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      foot.ankle,
      AutoMovieEngineQuaternion.rotateVector(foot.rotation, local),
    );
    const heading: number =
      HumanFoot.heading(foot.rotation) * AutoMovieEngineQuaternion.DEG2RAD;
    const along: IAutoMovieVector3 = {
      x: Math.sin(heading),
      y: 0,
      z: Math.cos(heading),
    };
    const axis: IAutoMovieVector3 = AutoMovieEngineVector3.cross(up, along);
    return (degrees: number): IAutoMovieMotionHumanFoot.IPlacement => {
      const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.fromAxisAngle(axis, degrees),
        foot.rotation,
      );
      return {
        ankle: AutoMovieEngineVector3.subtract(ball, AutoMovieEngineQuaternion.rotateVector(rotation, local)),
        rotation,
      };
    };
  };
}

/*
 * The `roll` of `dive.plan`, built from what that plan prepared.
 */
export namespace diveFootRoll {
  /*
   * What `dive.plan` prepared for its `roll`.
   */
  export interface IPrepared {
    /*
     * The `feet` `dive.plan` prepared.
     */
    feet: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDive.IParams>["entry"]["feet"];

    /*
     * The `body` `dive.plan` prepared.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The `entry` `dive.plan` prepared.
     */
    entry: IAutoMovieMotionHumanPosture;

    /*
     * The `up` `dive.plan` prepared.
     */
    up: IAutoMovieVector3;
  }
}
