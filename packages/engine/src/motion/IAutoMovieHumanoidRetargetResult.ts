import { IAutoMovieMotion, IAutoMovieValidation } from "@automovie/interface";

import { IAutoMovieHumanoidRetargetCharacterization } from "./IAutoMovieHumanoidRetargetCharacterization";

/**
 * Result of retargeting. `motion` and `characterization` are present only when
 * every structural, scale, and target-ROM check passed.
 * Contact residual warnings preserve both outputs and remain in validation;
 * errors return both payloads as null. The output clip borrows unchanged pose
 * and expression data from the source, so consumers treat it as immutable.
 *
 * @evidence contracts/development/design.md#principled-representation Couples the admitted target motion with the rig interpretation needed to play its clinical angles, returning null payloads for errors while retaining usable results when contact preservation reports plausibility warnings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A validation envelope and two nullable payloads let production convert findings to diagnostics before publishing an admitted motion and its characterization.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unreachable contact is exposed as a residual warning rather than a false success certificate, and failed structural or ROM admission supplies no partially accepted clip.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes error-null outputs from usable warning outputs, identifies the paired playback characterization and documents shallow source aliasing.
 */
export interface IAutoMovieHumanoidRetargetResult {
  /** Validation envelope containing field-located failures. */
  validation: IAutoMovieValidation;

  /** Retargeted clip, or `null` when validation failed. */
  motion: IAutoMovieMotion | null;

  /** The rig characterization required to play the clip on the target. */
  characterization: IAutoMovieHumanoidRetargetCharacterization | null;
}
