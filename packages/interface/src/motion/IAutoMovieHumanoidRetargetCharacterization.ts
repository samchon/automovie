import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieRetargetContactPolicy } from "./AutoMovieRetargetContactPolicy";
import type { AutoMovieRetargetFacing } from "./AutoMovieRetargetFacing";
import type { AutoMovieRetargetRomPolicy } from "./AutoMovieRetargetRomPolicy";
import type { IAutoMovieHumanoidRigCharacterization } from "./IAutoMovieHumanoidRigCharacterization";

/**
 * The source-target decision record for a retargeted humanoid clip. Heights and
 * rootScale describe the same model-unit ratio used for root translation and
 * mapped contacts. Tables contain only slots present on each rig; callers keep
 * them paired with the returned motion during playback.
 */
export interface IAutoMovieHumanoidRetargetCharacterization {
  /** Source rig the clip was authored against. */
  source: IAutoMovieHumanoidRigCharacterization;

  /** Target rig the clip now plays on. */
  target: IAutoMovieHumanoidRigCharacterization;

  /** Root translation multiplier (`target.height / source.height` by default). */
  rootScale: number;

  /** Root facing convention: authored root rotations remain unchanged. */
  facing: AutoMovieRetargetFacing;

  /** Effective ROM priority for the target validation pass. */
  romPolicy: AutoMovieRetargetRomPolicy;

  /** Whether source contacts were re-pinned on the target rig. */
  contactPolicy: AutoMovieRetargetContactPolicy;

  /** Bones that had to exist in both rigs for this retarget operation. */
  requiredBones: AutoMovieHumanoidBone[];
}
