import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairInput,
} from "../../index";

/**
 * Admit the complete closed resident pair before any image-sized allocation.
 * Calibration, provenance and rigidity remain caller assertions. All numeric
 * operating points and loop limits must be finite and explicit; representable
 * supplied pixel charts are constructed once for the later numerical phases.
 */

export namespace IAutoMovieRecoveryCameraPairAdmissionOperation {
  /**
   * Admit the complete closed resident pair before any image-sized allocation.
   * Calibration, provenance and rigidity remain caller assertions. All numeric
   * operating points and loop limits must be finite and explicit; representable
   * supplied pixel charts are constructed once for the later numerical phases.
   */

  export type Operation = (input: IAutoMovieRecoveryCameraPairInput) => {
    /** The two admitted intrinsic camera charts in input-view order. */
    charts: [
      ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
      ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    ];

    /**
     * Total admitted image pixel population, used for work and retention
     * bounds.
     */
    pixels: number;
  };
}
