import { IAutoMovieEnvironmentContext } from "../analysis/IAutoMovieEnvironmentContext";
import { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * What one library source owner hands back to the builder.
 *
 * Semantic completion is branch-specific: maps publish contexts, models publish models and spaces publish built environments, each with at least one result in its own carrier. Production-settings owners instead return an empty contribution so execution is attributable without claiming semantic artifacts. Material, instance, motion and system owners currently have no standalone result carrier and are refused.
 *
 * Omitted contexts and an empty list both mean no adopted context, preserving older environment/model sources. A map owner with no context still fails completion.
 *
 * @evidence contracts/common.md#principled-implementation Semantic branches require a nonempty own carrier, domain validity and unique identities; admitAutoMovieLibrarySettingsContribution instead requires zero normalized environments, models and contexts. Materialized owners retain accepted provenance separately from payloads.
 * @evidence contracts/common.md#clear-and-simple-design Three existing semantic carriers share one owner return shape, with branch validation preventing nested data from being mistaken for another branch's completed output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty semantic branches and cross-branch completion refuse; settings-only emptiness is an explicit owner contract, and omitted contexts cannot make an empty map complete. Unsupported standalone carriers remain refused.
 * @evidence contracts/common.md#meaningful-documentation States branch carriers, the settings-only empty exception, unsupported carriers, authored array order and context omission.
 * @author Samchon
 */
export interface IAutoMovieLibraryContribution {
  /** Structured built environments a `spaces` owner publishes, in author order. */
  environments: IAutoMovieBuiltEnvironment[];

  /** Reusable models a `models` owner publishes, in author order. */
  models: IAutoMovieModel[];

  /**
   * Adopted environment contexts in author order; only a maps owner may publish this carrier as its completed result.
   */
  contexts?: IAutoMovieEnvironmentContext[];
}
