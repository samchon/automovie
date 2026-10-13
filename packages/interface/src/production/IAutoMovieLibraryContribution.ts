import { IAutoMovieEnvironmentContext } from "../analysis/IAutoMovieEnvironmentContext";
import { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * What one library source owner hands back to the builder.
 *
 * Completion is branch-specific: maps publish contexts, models publish models, and spaces publish built environments. Each completed owner supplies at least one result in its own carrier; material, instance, motion and system owners currently have no standalone result carrier and are refused.
 *
 * Omitted contexts and an empty list both mean no adopted context, preserving older environment/model sources. A map owner with no context still fails completion.
 *
 * @evidence contracts/common.md#principled-implementation Branch admission checks a nonempty own semantic carrier, domain validation and unique published identities; the materialized library retains accepted contribution provenance for observation and review.
 * @evidence contracts/common.md#clear-and-simple-design Three existing semantic carriers share one owner return shape, with branch validation preventing nested data from being mistaken for another branch's completed output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty and cross-branch completion refuse, unsupported standalone carriers refuse explicitly, and optional contexts preserves older model/space source shape without letting an empty map pass.
 * @evidence contracts/common.md#meaningful-documentation States supported branch-to-carrier ownership, nonempty completion, unsupported carriers and context omission; arrays preserve authored order.
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
