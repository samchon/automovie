import type { IAutoMoviePrepareContourDocument64Observation } from "./IAutoMoviePrepareContourDocument64Observation";

/**
 * One retained saved horizontal cut in a prepared contour document. Preparation
 * creates this record and its loop list while borrowing each cubic declaration.
 * prepareAutoMovieContourDocument64 admits finite increasing cut coordinates.
 */
export interface IAutoMoviePrepareContourDocument64Slice {
  /**
   * Saved section coordinate in millimetres, strictly increasing across the
   * document's retained slice list.
   */
  y: number;
  /**
   * Loop observations in original section order, including an empty list when
   * the cut is not removed as a supported empty event cut. Loop indices used by
   * incidence refer to this local ordering.
   */
  loops: IAutoMoviePrepareContourDocument64Observation[];
}
