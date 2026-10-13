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
 * @evidence contracts/common.md#principled-implementation A bearing query reuses the prop kernel's two-sided footprint probes between the subject box and the support face, taking the deepest probe as the gap; a suspended query only checks that both locators resolve.
 * @evidence contracts/common.md#clear-and-simple-design A query names subject, support and relation kind and leaves measurement to the engine, so the authored claim and the measured answer stay separate records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A negative or non-finite tolerance throws instead of defaulting; the 1e-9 metre default is declared as a separate constant in each support module rather than imported from one shared definition.
 * @evidence contracts/common.md#meaningful-documentation States the tolerance unit, default and refusal, and the difference between bearing and suspended, including that suspension is not measured.
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
