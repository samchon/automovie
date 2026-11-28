import type { IAutoMoviePrepareContourDocument64Observation } from "./IAutoMoviePrepareContourDocument64Observation";

/**
 * One retained saved horizontal cut. The record owns its copied loop list and
 * borrows the cubic declarations. The source supplies finite increasing cut
 * coordinates.
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
