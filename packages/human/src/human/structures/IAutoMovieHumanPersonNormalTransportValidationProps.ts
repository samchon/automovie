import type { IAutoMovieHumanPersonNormalTransportHalf } from "./IAutoMovieHumanPersonNormalTransportHalf";
import type { IAutoMovieHumanPersonSourcePartitionPlan } from "./IAutoMovieHumanPersonSourcePartitionPlan";

/**
 * What admitting fixed source normal cells reads: the admitted source
 * partition plan and both complementary skin halves.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportValidationProps {
  /** The admitted source partition plan. */
  plan: IAutoMovieHumanPersonSourcePartitionPlan;

  /** The face's skin half. */
  face: IAutoMovieHumanPersonNormalTransportHalf;

  /** The body's skin half. */
  body: IAutoMovieHumanPersonNormalTransportHalf;
}
