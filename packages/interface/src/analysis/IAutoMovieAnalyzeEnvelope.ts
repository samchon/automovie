import type { IAutoMovieAnalysisRun } from "./IAutoMovieAnalysisRun";
import type { IAutoMovieEnvelopeRequest } from "./IAutoMovieEnvelopeRequest";

/**
 * Inputs and paired heat/moisture artifacts for the steady-state envelope
 * analysis.
 */
export namespace IAutoMovieAnalyzeEnvelope {
  /**
   * One borrowed envelope study for analyzeEnvelope.
   * resolveEnvelopeRequest performs request admission before
   * arithmetic. Malformed requests and nonfinite computed metrics throw;
   * positive finite inputs alone do not exclude numeric overflow, underflow or
   * dew-point singularities.
   *
   * Series resistance is Rsi+sum(thickness/conductivity)+Rse, U=1/R, and
   * interior surface temperature is Ti-U_Rsi_(Ti-Te). Fabric and linear bridge
   * heat losses are sum(U_A)_(Ti-Te) and sum(psi_L)_(Ti-Te). Surface moisture
   * compares that temperature to the Magnus dew point; its approximate -45..60
   * degrees Celsius fitted range is not an admission bound.
   */
  export type IProps = {
    /**
     * Study read without mutation; request admission checks its assemblies,
     * environment references and settings before solving.
     */
    request: IAutoMovieEnvelopeRequest;
  };

  /**
   * Separately sealed thermal and moisture runs over the same request and
   * settings digest. Both are not-run when no exterior air temperature
   * resolves. Otherwise each owns its metric/sample/warning arrays; both runs
   * share the analyzer-created solver record, and copied warning arrays may
   * share warning records. Returned records are mutable, so changing covered
   * content can invalidate their digests.
   */
  export type IResult = {
    /**
     * Run id request.id+".thermal", with transmittance, heat-loss and related
     * thermal metrics, or a not-run outcome for missing exterior temperature.
     */
    thermal: IAutoMovieAnalysisRun;

    /**
     * Run id request.id+".moisture", with interior surface/dew-point margins
     * and explicit unsupported interstitial-condensation scope, or the same
     * missing-boundary not-run reason.
     */
    moisture: IAutoMovieAnalysisRun;
  };
}
