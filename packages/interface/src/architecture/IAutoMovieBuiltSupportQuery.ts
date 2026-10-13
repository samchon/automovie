import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";
import { AutoMovieBuiltPlacementSupportLocator } from "./AutoMovieBuiltPlacementSupportLocator";

/**
 * One project-authored claim about how a placed building body is supported.
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
   * deterministic placement epsilon; a negative or non-finite value is refused
   * rather than defaulted, because it withdraws the meaning of contact instead
   * of adjusting it.
   */
  tolerance?: number;
}
