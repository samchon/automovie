import { IAutoMovieMotion, IAutoMovieValidation } from "@automovie/interface";

import { IAutoMovieHumanoidRetargetCharacterization } from "./IAutoMovieHumanoidRetargetCharacterization";

/**
 * Result of retargeting. `motion` and `characterization` are present only when
 * every structural, scale, and target-ROM check passed.
 * Contact residual warnings preserve both outputs and remain in validation;
 * errors return both payloads as null. The output clip borrows unchanged pose
 * and expression data from the source, so consumers treat it as immutable.
 *
 * @evidence contracts/common.md#principled-implementation Couples the admitted target motion with the rig interpretation needed to play its clinical angles, returning null payloads for errors while retaining usable results when contact preservation reports plausibility warnings.
 * @evidence contracts/common.md#clear-and-simple-design A validation envelope and two nullable payloads let production convert findings to diagnostics before publishing an admitted motion and its characterization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreachable contact is exposed as a residual warning rather than a false success certificate, and failed structural or ROM admission supplies no partially accepted clip.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes error-null outputs from usable warning outputs, identifies the paired playback characterization and documents shallow source aliasing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The result envelope executes no validation or retarget solve itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Borrowed unchanged source pose fields preserve existing data identity without defining cross-request retarget reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller retains findings, an optional motion and two rig descriptions; resource and keyframe allocation belong to their producer, not this type.
 */
export interface IAutoMovieHumanoidRetargetResult {
  /** Validation envelope containing field-located failures. */
  validation: IAutoMovieValidation;

  /** Retargeted clip, or `null` when validation failed. */
  motion: IAutoMovieMotion | null;

  /** The rig characterization required to play the clip on the target. */
  characterization: IAutoMovieHumanoidRetargetCharacterization | null;
}
