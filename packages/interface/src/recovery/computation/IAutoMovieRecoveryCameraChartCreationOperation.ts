import type { IAutoMovieRecoveryCameraPairInput } from "../../index";

/**
 * Build a supplied pinhole K and its analytic inverse in the resident pixel
 * chart. Check pixel-step round trips before any correspondence is normalized.
 * A large principal offset may destroy pixel differences even when each scalar
 * is finite. Such a chart refuses rather than being recentered with unknown
 * provenance.
 */

export namespace IAutoMovieRecoveryCameraChartCreationOperation {
  /**
   * Build a supplied pinhole K and its analytic inverse in the resident pixel
   * chart. Check pixel-step round trips before any correspondence is
   * normalized. A large principal offset may destroy pixel differences even
   * when each scalar is finite. Such a chart refuses rather than being
   * recentered with unknown provenance.
   */

  export type Operation = (
    view: IAutoMovieRecoveryCameraPairInput["views"][number],
  ) => {
    /**
     * Row-major 3 by 3 supplied pinhole intrinsic matrix K in the resident
     * pixel-centre chart.
     */
    matrix: number[];
    /**
     * Analytic inverse of the supplied pinhole K, mapping pixel homogeneous
     * coordinates to camera rays.
     */
    inverse: number[];
  };
}
