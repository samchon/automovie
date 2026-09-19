import { IAutoMovieEnvironmentContext } from "../analysis/IAutoMovieEnvironmentContext";
import { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * What one library source owner hands back to the builder.
 *
 * Every payload is one a consumer already reads. A built environment becomes
 * the compiled topology the required observation population is derived from, a
 * model becomes the compiled recipe a canonical turntable is judged against,
 * and an adopted environment context becomes the world a map owner is measured
 * against. Completion is branch-specific: a map owner returns at least one
 * context, a model owner at least one model, and a space owner at least one
 * environment, without borrowing another branch's carrier. Material, instance,
 * motion, and system sources remain valid authoring populations, but cannot be
 * materialized as standalone library results until their own public carrier
 * exists.
 *
 * `contexts` is optional where the other two are required, and the asymmetry is
 * the upgrade rather than a preference: every library source written before it
 * existed returns the two, and a project that has not been touched since is not
 * in error. An absent list and an empty one say the same thing here -- this
 * owner adopted no world at the DTO boundary. The builder nevertheless
 * refuses an empty map-owner completion, because absence is not delivery.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Fixes the exact result a library source revision is allowed to produce.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types the derived library state one executed source revision is allowed to produce.
 * @author Samchon
 */
export interface IAutoMovieLibraryContribution {
  /** Structured built environments a `spaces` owner publishes, in author order. */
  environments: IAutoMovieBuiltEnvironment[];

  /** Reusable models a `models` owner publishes, in author order. */
  models: IAutoMovieModel[];

  /**
   * Adopted environment contexts this owner publishes, in author order.
   *
   * A map owner adopts the world its work is designed against -- the north it
   * is oriented to, the ground its elevations are measured from, and the
   * instants it is answered at. Until this existed the production design
   * carried exactly one context for the whole production and no owner
   * contributed it, so no map owner could be measured against anything: the
   * derived population was empty and an empty population passes every check
   * that compares against it.
   * Only a `maps` owner may use this carrier as its completed result.
   */
  contexts?: IAutoMovieEnvironmentContext[];
}
