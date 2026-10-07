import type { IAutoMovieHumanBodyHumeralHead } from "@automovie/human";

/**
 * The source of a humeral head that carries no tomographic observation.
 *
 * A prior, target or measured radius has no observation record; only an
 * observed head carries one.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Labels a displayed head reading by where its radius came from.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Distinguishes unobserved head sources from an observed acquisition in the anatomy reading.
 * @author Samchon
 */
export interface IConnectedBodyUnobservedHeadSource {
  /** Any head source other than an observed acquisition. */
  source: Exclude<IAutoMovieHumanBodyHumeralHead["source"], "observed">;
}
