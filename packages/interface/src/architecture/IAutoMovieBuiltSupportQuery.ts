import type { IAutoMovieBuiltPlacementBodyLocator } from "./IAutoMovieBuiltPlacementBodyLocator";
import type { IAutoMovieBuiltPlacementSupportLocator } from "./IAutoMovieBuiltPlacementSupportLocator";

/**
 * One project-authored claim about how a placed building body is supported.
 *
 * A `bearing` claim is measured: the subject's world box is probed against the
 * support's bearing face and the signed gap is compared with the tolerance. A
 * `suspended` claim is accepted once both sides resolve; no hanging geometry is
 * measured. The answer is a visual placement check, not a structural load
 * analysis.
 */
export interface IAutoMovieBuiltSupportQuery {
  /** The element or compact population whose placement is being reviewed. */
  subject: IAutoMovieBuiltPlacementBodyLocator;

  /** The named body or surface claimed to support the subject. */
  support: IAutoMovieBuiltPlacementSupportLocator;

  /**
   * `bearing` when the subject rests on the support and is measured, and
   * `suspended` when it intentionally hangs from it and is only resolved.
   */
  kind: "bearing" | "suspended";

  /**
   * Finite, non-negative contact tolerance in metres: how far off the support a
   * member may sit and still count as resting. Omission uses the engine's
   * placement epsilon, `1e-9` metres. A negative or non-finite value throws a
   * `RangeError` instead of being defaulted, because it would make every
   * distance read as `floating` or `sunk`.
   */
  tolerance?: number;
}
