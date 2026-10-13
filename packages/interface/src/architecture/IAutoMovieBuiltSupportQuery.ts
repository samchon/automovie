import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";
import { AutoMovieBuiltPlacementSupportLocator } from "./AutoMovieBuiltPlacementSupportLocator";

/**
 * One project-authored claim about how a placed building body is supported.
 *
 * A `bearing` claim is measured: the subject's box is probed against the
 * support's bearing face and the signed gap is compared with the tolerance. A
 * `suspended` claim is accepted once both sides resolve; no hanging geometry is
 * measured.
 *
 * @author Samchon
 */
export interface IAutoMovieBuiltSupportQuery {
  /** The element or compact population whose placement is being reviewed. */
  subject: AutoMovieBuiltPlacementBodyLocator;

  /** The named body or surface claimed to support the subject. */
  support: AutoMovieBuiltPlacementSupportLocator;

  /** Whether the subject bears on the support or intentionally hangs from it. */
  kind: "bearing" | "suspended";

  /**
   * Finite, non-negative contact tolerance in metres: how far off the support
   * a member may sit and still count as resting. Omission uses the engine's
   * deterministic placement epsilon, `1e-9` metres; a negative or non-finite
   * value is refused rather than defaulted, because it withdraws the meaning of
   * contact instead of adjusting it.
   */
  tolerance?: number;
}
