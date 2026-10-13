import { AutoMovieHumanoidBone } from "@automovie/interface";

import { AutoMovieRetargetContactPolicy } from "./AutoMovieRetargetContactPolicy";
import { AutoMovieRetargetFacing } from "./AutoMovieRetargetFacing";
import { AutoMovieRetargetRomPolicy } from "./AutoMovieRetargetRomPolicy";
import { IAutoMovieHumanoidRigCharacterization } from "./IAutoMovieHumanoidRigCharacterization";

/**
 * The source-target decision record for a retargeted humanoid clip.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanoidRetargetCharacterization {
  /** Source rig the clip was authored against. */
  source: IAutoMovieHumanoidRigCharacterization;

  /** Target rig the clip now plays on. */
  target: IAutoMovieHumanoidRigCharacterization;

  /**
   * Root translation multiplier (`target.height / source.height` by default).
   */
  rootScale: number;

  /** Root facing convention: v1 preserves authored root rotations. */
  facing: AutoMovieRetargetFacing;

  /** Effective ROM priority for the target validation pass. */
  romPolicy: AutoMovieRetargetRomPolicy;

  /** Whether source contacts were re-pinned on the target rig. */
  contactPolicy: AutoMovieRetargetContactPolicy;

  /** Bones that had to exist in both rigs for this retarget operation. */
  requiredBones: AutoMovieHumanoidBone[];
}
