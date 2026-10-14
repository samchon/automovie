import type { AutoMovieHumanBodyExteriorGapReason } from "./AutoMovieHumanBodyExteriorGapReason";

/**
 * A surface target of the numerical body request that the exterior cannot answer yet, with the dependency it lacks.
 *
 * A path appears either here or in `HUMAN_BODY_EXTERIOR_TARGETS`, never in both: a gap is not approximated by another instrument, and the editor lists it disabled with its detail.
 *
 * @evidence contracts/common.md#principled-implementation A request path, closed dependency reason and explanation represent an authored unsupported surface quantity without manufacturing an approximation.
 * @evidence contracts/common.md#clear-and-simple-design Gap metadata stays separate from answerable target bindings and lets the editor show a disabled quantity with its cause.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Binding/gap exclusivity belongs to the authored tables and admission; this unconstrained path string alone cannot prove their disjointness.
 * @evidence contracts/common.md#meaningful-documentation Members define anatomy-relative path ownership and the missing landmark, rule or tissue explanation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A gap record chooses no substitute measurement or source-availability search algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Unsupported-request metadata coordinates no evaluated measurement result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Readonly path/reason/detail fields retain no instrument state or source geometry handle.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorGap {
  /** Document path below `anatomy`, such as `surface.leftUpperLimb.hand.length`. */
  readonly path: string;

  /** The kind of dependency the path lacks. */
  readonly reason: AutoMovieHumanBodyExteriorGapReason;

  /** One sentence naming the missing landmark, rule or tissue. */
  readonly detail: string;
}
