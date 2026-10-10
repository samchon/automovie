/**
 * The channels the identity parameters are projected back from: each is read
 * through the inverse of its first term row, after the other rows naming that
 * channel are removed.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeIdentity {
  /** The channel `sex` is read from. */
  sex: string;

  /** The channel `ageYears` is read from. */
  ageYears: string;

  /** The channel `muscle` is read from. */
  muscle: string;
}
