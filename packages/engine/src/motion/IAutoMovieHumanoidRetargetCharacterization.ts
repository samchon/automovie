import { AutoMovieHumanoidBone } from "@automovie/interface";

import { AutoMovieRetargetContactPolicy } from "./AutoMovieRetargetContactPolicy";
import { AutoMovieRetargetFacing } from "./AutoMovieRetargetFacing";
import { AutoMovieRetargetRomPolicy } from "./AutoMovieRetargetRomPolicy";
import { IAutoMovieHumanoidRigCharacterization } from "./IAutoMovieHumanoidRigCharacterization";

/**
 * The source-target decision record for a retargeted humanoid clip.
 * Heights and rootScale describe the same model-unit ratio used for root
 * translation and mapped contacts. Tables contain only slots present on each
 * rig; callers keep them paired with the returned motion during playback.
 *
 * @evidence contracts/common.md#principled-implementation Records both characterized rigs, the positive root multiplier and the actual facing, ROM and contact decisions taken by retargetHumanoidMotion; requiredBones is the union of hips, articulated slots and explicitly required slots.
 * @evidence contracts/common.md#clear-and-simple-design A decision record accompanies the clip instead of hiding clinical axis and rest-frame mappings in a renderer-specific adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source and target identities remain explicit and contact correction is recorded separately from unchanged facing, so a successful clip does not imply an unperformed conversion.
 * @evidence contracts/common.md#meaningful-documentation States shared scale semantics, per-rig slot filtering, playback table pairing and the meaning of each decision field.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This retarget receipt executes no rig characterization or contact solve itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source and target tables are reused within one retarget operation; this result defines no mutable-rig cache across operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns two rig descriptions and a required-slot array bounded by the humanoid slot domain, with no solver handles retained.
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

  /** Root facing convention: authored root rotations remain unchanged. */
  facing: AutoMovieRetargetFacing;

  /** Effective ROM priority for the target validation pass. */
  romPolicy: AutoMovieRetargetRomPolicy;

  /** Whether source contacts were re-pinned on the target rig. */
  contactPolicy: AutoMovieRetargetContactPolicy;

  /** Bones that had to exist in both rigs for this retarget operation. */
  requiredBones: AutoMovieHumanoidBone[];
}
