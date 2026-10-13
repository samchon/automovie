import { AutoMovieHumanoidBone } from "@automovie/interface";

/** Why an arm chain cannot be solved by the analytic arm IK. */
export interface IAutoMovieArmChainFault {
  /** Which arm the fault was found on. */
  side: "left" | "right";

  /** The mid joint whose hinge cannot bend the chain. */
  bone: AutoMovieHumanoidBone;

  /**
   * The fault in the engine's own words, phrased so a correction round can act
   * on it: which bone, what is parallel to what, and what that costs.
   */
  reason: string;
}
