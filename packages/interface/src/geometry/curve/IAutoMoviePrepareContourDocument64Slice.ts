import type { IAutoMoviePrepareContourDocument64Observation } from "./IAutoMoviePrepareContourDocument64Observation";
/**
 * One retained saved horizontal cut in a prepared contour document. Preparation
 * creates this record and its loop list while borrowing each cubic declaration.
 * prepareAutoMovieContourDocument64 admits finite increasing cut coordinates.
 *
 * @evidence contracts/development/design.md#principled-representation A millimetre section coordinate and ordered loop observations preserve saved local incidence even when the loop list is empty.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The prepared document passes these cuts to sampling and slab planning after supported empty event cuts are filtered.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Retained empty cuts remain explicit; preparation does not fabricate a contour to fill a missing section.
 * @evidence contracts/development/common.md#meaningful-documentation Defines new versus borrowed storage, coordinate admission and retained loop ordering.
 */
export interface IAutoMoviePrepareContourDocument64Slice {
  /** Saved section coordinate in millimetres, strictly increasing across the document's retained slice list. */
  y: number;
  /** Loop observations in original section order, including an empty list when the cut is not removed as a supported empty event cut. Loop indices used by incidence refer to this local ordering. */
  loops: IAutoMoviePrepareContourDocument64Observation[];
}
