import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";

/**
 * What a region's part resolver reads: the document's anatomy, if any, and the compiled source basis.
 *
 * Document admission preserves anatomical measurements and registered raw observations before this carrier reaches a region resolver. A consumer without anatomical input (the shape-weight body editor) omits `targets` and receives each part's source reason without inventing an age, stature or mass; completeness of a document stays with document admission. The basis lets a resolver state that a defining landmark or tissue boundary is absent from the source.
 *
 * @evidence contracts/common.md#principled-implementation Optional admitted anatomy and compiled basis supply region requests and actual landmark/tissue availability without invented demographic inputs.
 * @evidence contracts/common.md#clear-and-simple-design Document completeness remains admission-owned while region consumers receive only their generation context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted targets preserve source unavailable reasons rather than inventing age, stature, mass or anatomy.
 * @evidence contracts/common.md#meaningful-documentation Members state registered observations, anatomy omission and compiled exterior basis ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Region input records run no anatomical resolver or source availability algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Borrowed basis/targets describe dependencies without cached region completion.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The context type owns no source geometry allocation or observer task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyRegionPartsInput {
  /** Admitted document anatomy, including registered observations; omitted without anatomy. */
  readonly targets?: IAutoMovieHumanBodyAnatomicalMeasurements;

  /** The compiled source basis the exterior was built from. */
  readonly basis: IAutoMovieHumanBodyBasis;
}
