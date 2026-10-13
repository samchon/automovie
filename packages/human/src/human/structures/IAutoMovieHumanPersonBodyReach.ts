import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisChannel } from "../../body/structures/shape/IAutoMovieHumanBodyBasisChannel";

/**
 * The body weights a paired person evaluator can read, without changing the
 * body's independent authoring envelopes. The copied solve basis intersects
 * available body endpoints with the actual head drivers of those endpoints.
 * Its dimensionless weights are interpolation support, not physiological limits.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBodyReach {
  /** A solve-only body view with the jointly evaluable channel envelopes. */
  basis: IAutoMovieHumanBodyBasis;

  /** Original channels with an unavailable direct body endpoint. */
  missing: IAutoMovieHumanBodyBasisChannel[];

  /** Named source reasons for each shortened channel, keyed by its body id. */
  limits: Map<string, string[]>;
}
