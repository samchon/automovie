import type { IAutoMovieHumanBodyHumeralHead } from "../../index";

/**
 * The source of a humeral head that carries no tomographic observation.
 *
 * A prior, target or measured radius has no observation record; only an
 * observed head carries one.
 *
 * @author Samchon
 */
export interface IConnectedBodyUnobservedHeadSource {
  /** Any head source other than an observed acquisition. */
  source: Exclude<IAutoMovieHumanBodyHumeralHead["source"], "observed">;
}
