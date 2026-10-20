import { IAutoMovieHumanNeutralEnvelope } from "./IAutoMovieHumanNeutralEnvelope";

/** Bone-normal neck observations at the declared chord fractions. */
export interface IAutoMovieHumanNeutralNeck {
  /** Lower neck support at 0.2 of the neck-to-head chord. */
  lower: IAutoMovieHumanNeutralEnvelope;

  /** Middle neck support at 0.5 of the neck-to-head chord. */
  middle: IAutoMovieHumanNeutralEnvelope;
}
