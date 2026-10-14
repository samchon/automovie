import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One head measurement read on a person's skin at rest: the value and the
 * points the instrument touched, so the reading can be marked on a render.
 *
 *
 * @evidence contracts/common.md#principled-implementation A reading pairs metre value with the actual instrument-contact points on rest skin; named roles come from the producing measurement and do not independently certify anatomical registration.
 * @evidence contracts/common.md#clear-and-simple-design Value and marker points travel together so render annotation does not rederive where the instrument touched.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected sample value or synthesized contact is imposed by the result; readers supply their actual source-derived measurements.
 * @evidence contracts/common.md#meaningful-documentation The comments give metre units, rest-skin origin and role-keyed marker meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The head-reading shape runs no instrument or marker-search algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This result record coordinates no cached measurement across changing skins.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no handles or tasks; its concrete point dictionary belongs to the receiving caller.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadReading {
  /** The measured value, metres. */
  metres: number;

  /** The points the instrument touched, by role (`vertex`, `euryon-right`, ...), metres. */
  points: Record<string, IAutoMovieVector3>;
}
