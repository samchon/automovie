import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";
import { AutoMovieBuiltPlacementSupportLocator } from "./AutoMovieBuiltPlacementSupportLocator";

/**
 * One project-authored claim about how a placed building body is supported.
 *
 * A `bearing` claim is measured: the subject's world box is probed against the
 * support's bearing face and the signed gap is compared with the tolerance. A
 * `suspended` claim is accepted once both sides resolve; no hanging geometry is
 * measured. The answer is a visual placement check, not a structural load
 * analysis.
 *
 * @evidence contracts/common.md#principled-implementation `builtEnvironmentSupportStatus` delegates to `propSupportGap`'s subject footprint corners/centre and face ring corners, taking the minimum sampled underside-minus-height. Missing edge-intersection probes can miss thin overlap or a deeper planar point, and curved relief between probes is unread; this finite static proxy measurement does not prove continuous mesh contact.
 * @evidence contracts/common.md#clear-and-simple-design A claim is subject, support, kind, and optional tolerance; the query reuses the prop placement kernel's support gap rather than carrying a building-specific probe rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A negative or non-finite tolerance throws a `RangeError` instead of being replaced by the default, and `suspended` is accepted without measurement as the documented limit rather than faked with a hanging test.
 * @evidence contracts/common.md#meaningful-documentation States what each kind measures, that the result is not structural analysis, the metre unit and default of the tolerance, and that an invalid tolerance throws.
 * @author Samchon
 */
export interface IAutoMovieBuiltSupportQuery {
  /** The element or compact population whose placement is being reviewed. */
  subject: AutoMovieBuiltPlacementBodyLocator;

  /** The named body or surface claimed to support the subject. */
  support: AutoMovieBuiltPlacementSupportLocator;

  /**
   * `bearing` when the subject rests on the support and is measured, and
   * `suspended` when it intentionally hangs from it and is only resolved.
   */
  kind: "bearing" | "suspended";

  /**
   * Finite, non-negative contact tolerance in metres: how far off the support
   * a member may sit and still count as resting. Omission uses the engine's
   * placement epsilon, `1e-9` metres. A negative or non-finite value throws a
   * `RangeError` instead of being defaulted, because it would make every
   * distance read as `floating` or `sunk`.
   */
  tolerance?: number;
}
