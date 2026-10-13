import { IAutoMovieMotion, IAutoMovieValidation } from "@automovie/interface";

import { IAutoMovieHumanoidRetargetCharacterization } from "./IAutoMovieHumanoidRetargetCharacterization";

/**
 * Result of retargeting. `motion` and `characterization` are present only when
 * every structural, scale, and target-ROM check passed.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanoidRetargetResult {
  /** Validation envelope containing field-located failures. */
  validation: IAutoMovieValidation;

  /** Retargeted clip, or `null` when validation failed. */
  motion: IAutoMovieMotion | null;

  /** The rig characterization required to play the clip on the target. */
  characterization: IAutoMovieHumanoidRetargetCharacterization | null;
}
