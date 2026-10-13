import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Reach a hand to a target; engine: two-bone IK (`solveTwoBoneIK`). A
 * humanoid-rig verb (left/right arm); a quadruped pawing at something uses
 * `gesture` (`paw`) instead.
 */
export interface IAutoMovieReachAction extends IAutoMovieActionBase {
  /** Selects a reach as the action family. */
  verb: "reach";

  /** Side of the actor that reaches for the target. */
  hand: "left" | "right";

  /** Spatial target that the selected hand attempts to reach. */
  to: IAutoMovieActionTarget;
}
