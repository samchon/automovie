import type {
  IAutoMovieRecoveryAnalyticRealization,
  IAutoMovieRecoveryReconstruction,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "../../index";

/**
 * Generate saved ordinary tensor families and retained curve-only event or
 * legacy domains. Delegated groups have one tensor owner and are not also tiled
 * by the contour operator. Shared analytic end-curve coefficients are admitted
 * before engine dispatch; their polygonal conformity and transverse continuity
 * remain independently unqualified. The contour engine shares each retained
 * generating boundary across incident slabs. Unmet fitting tolerances and
 * strip-quality failures remain visible and unqualified. An actual missing
 * incidence or unrepresentable primitive remains a local gap rather than a
 * quality warning. Optional work observation changes timing records only; saved
 * generating inputs are immutable.
 */

export namespace IAutoMovieReconstructRecovery {
  /**
   * Generate saved ordinary tensor families and retained curve-only event or
   * legacy domains. Delegated groups have one tensor owner and are not also
   * tiled by the contour operator. Shared analytic end-curve coefficients are
   * admitted before engine dispatch; their polygonal conformity and transverse
   * continuity remain independently unqualified. The contour engine shares each
   * retained generating boundary across incident slabs. Unmet fitting
   * tolerances and strip-quality failures remain visible and unqualified. An
   * actual missing incidence or unrepresentable primitive remains a local gap
   * rather than a quality warning. Optional work observation changes timing
   * records only; saved generating inputs are immutable.
   */

  export type Operation = (
    bundle: IAutoMovieRecoveryTensorFamiliesInput,
    options?: {
      /**
       * Optional request to collect execution timings; omission leaves timing
       * observation disabled.
       */
      observeWork?: boolean;

      /**
       * Previously realized analytic-domain result reused unchanged during
       * reconstruction.
       */
      analytic?: IAutoMovieRecoveryAnalyticRealization;
    },
  ) => IAutoMovieRecoveryReconstruction;
}
