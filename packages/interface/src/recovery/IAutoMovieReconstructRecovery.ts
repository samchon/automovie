import type {
  IAutoMovieRecoveryAnalyticRealization,
  IAutoMovieRecoveryReconstruction,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "..";

/**
 * Callable source-independent reconstruction from saved curve and domain
 * coefficients.
 */

export namespace IAutoMovieReconstructRecovery {
  /**
   * Realize the saved contour, tensor and analytic owners and assemble their
   * retained parts and construction. Dispatch delegated groups only through
   * their admitted owner. Preserve unresolved incidences and available quality
   * diagnostics. Supply an existing analytic realization only to reuse that
   * completed result.
   */

  export type Operation = (
    bundle: IAutoMovieRecoveryTensorFamiliesInput,
    options?: {
      /**
       * Collect available execution timing observations when true. Omission
       * leaves timing disabled.
       */
      observeWork?: boolean;

      /**
       * Previously realized analytic result to reuse for this reconstruction
       * call.
       */
      analytic?: IAutoMovieRecoveryAnalyticRealization;
    },
  ) => IAutoMovieRecoveryReconstruction;
}
