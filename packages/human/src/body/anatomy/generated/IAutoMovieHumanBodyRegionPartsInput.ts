import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";

/**
 * What a region's part resolver reads: the document's anatomy, if any, and the compiled source basis.
 *
 * Document admission preserves anatomical measurements and registered raw observations before this carrier reaches a region resolver. A consumer without anatomy omits targets and receives each region's unavailable reports without invented age, stature or mass; document completeness stays admission-owned. The basis supplies optional inspection context, but current fixed region reports do not inspect it or prove source landmarks or tissues absent.
 *
 * @evidence contracts/common.md#principled-implementation Optional admitted anatomy supplies region requests and the basis supplies source context; current fixed reports state registry limitations without inspecting source availability or inventing demographics.
 * @evidence contracts/common.md#clear-and-simple-design Document completeness remains admission-owned while region consumers receive only their generation context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted targets preserve region unavailable reports rather than inventing demographics, anatomy or an inspected source-absence claim.
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
