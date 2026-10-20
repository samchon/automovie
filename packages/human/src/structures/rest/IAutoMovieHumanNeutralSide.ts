import { IAutoMovieHumanNeutralLimb } from "./IAutoMovieHumanNeutralLimb";
import { IAutoMovieHumanNeutralOffset } from "./IAutoMovieHumanNeutralOffset";

/** Independent mechanical supports and chains for one side. */
export interface IAutoMovieHumanNeutralSide {
  /** Shoulder relative to the upper thoracic support. */
  shoulderOffset: IAutoMovieHumanNeutralOffset;

  /** Hip-joint proxy relative to the pelvis support. */
  hipOffset: IAutoMovieHumanNeutralOffset;

  /** Shoulder, elbow and wrist mechanical chain. */
  arm: IAutoMovieHumanNeutralLimb;

  /** Hip, knee and ankle mechanical chain. */
  leg: IAutoMovieHumanNeutralLimb;
}
