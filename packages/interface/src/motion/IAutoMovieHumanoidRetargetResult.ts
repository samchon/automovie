import type { IAutoMovieValidation } from "../validation/IAutoMovieValidation";
import type { IAutoMovieHumanoidRetargetCharacterization } from "./IAutoMovieHumanoidRetargetCharacterization";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";

/**
 * Result of retargeting. `motion` and `characterization` are present only when
 * every structural, scale, and target-ROM check passed. Contact residual
 * warnings preserve both outputs and remain in validation; errors return both
 * payloads as null. The output clip borrows unchanged pose and expression data
 * from the source, so consumers treat it as immutable.
 */
export interface IAutoMovieHumanoidRetargetResult {
  /** Validation envelope containing field-located failures. */
  validation: IAutoMovieValidation;

  /** Retargeted clip, or `null` when validation failed. */
  motion: IAutoMovieMotion | null;

  /** The rig characterization required to play the clip on the target. */
  characterization: IAutoMovieHumanoidRetargetCharacterization | null;
}
