import type { IAutoMovieAnalysisRun } from "./IAutoMovieAnalysisRun";
import type { IAutoMovieEnvelopeRequest } from "./IAutoMovieEnvelopeRequest";

/**
 * Inputs and paired heat/moisture artifacts for the steady-state envelope analysis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Inputs and paired heat/moisture artifacts for the steady-state envelope analysis. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation One envelope request and two canonical analysis runs keep thermal and moisture outcomes separate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface analyzeAutoMovieEnvelope and report consumers share the request/result names without copying run fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The request is not an admitted-result brand; missing exterior conditions remain not-run and unsupported physics stays explicit.
 */
export namespace IAutoMovieAnalyzeEnvelope {
  /**
   * One borrowed envelope study for analyzeAutoMovieEnvelope. resolveAutoMovieEnvelopeRequest performs request admission before arithmetic. Malformed requests and nonfinite computed metrics throw; positive finite inputs alone do not exclude numeric overflow, underflow or dew-point singularities.
   *
   * Series resistance is Rsi+sum(thickness/conductivity)+Rse, U=1/R, and interior surface temperature is Ti-U*Rsi*(Ti-Te). Fabric and linear bridge heat losses are sum(U*A)*(Ti-Te) and sum(psi*L)*(Ti-Te). Surface moisture compares that temperature to the Magnus dew point; its approximate -45..60 degrees Celsius fitted range is not an admission bound.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States request borrowing, admission owner, equations, numerical failure and fitted-range limits.
   * @evidence contracts/development/design.md#principled-representation The existing envelope request owns SI thickness, conductivity, area, bridge length and Celsius temperature fields; this wrapper introduces no alternate units or defaults.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One request supplies the thermal and moisture analyzer together so their settings digest refers to the same envelope study.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing exterior conditions produce not-run artifacts rather than a guessed climate; transient storage, vapor diffusion and solar gain are outside this model.
   */
  export type IProps = {
    /** Study read without mutation; request admission checks its assemblies, environment references and settings before solving. */
    request: IAutoMovieEnvelopeRequest;
  };

  /**
   * Separately sealed thermal and moisture runs over the same request and settings digest. Both are not-run when no exterior air temperature resolves. Otherwise each owns its metric/sample/warning arrays; both runs share the analyzer-created solver record, and copied warning arrays may share warning records. Returned records are mutable, so changing covered content can invalidate their digests.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines paired domains, missing-boundary status, shared nested records and digest mutation consequences.
   * @evidence contracts/development/design.md#principled-representation Canonical analysis runs preserve domain-specific outcomes and units rather than collapsing heat and condensation into one verdict.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The envelope analyzer returns the two report domains separately while reusing analysis-run sealing and metric contracts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Interstitial condensation and glazing solar gain remain explicit unsupported metrics; surface condensation is not a whole-envelope moisture certificate.
   */
  export type IResult = {
    /** Run id request.id+".thermal", with transmittance, heat-loss and related thermal metrics, or a not-run outcome for missing exterior temperature. */
    thermal: IAutoMovieAnalysisRun;

    /** Run id request.id+".moisture", with interior surface/dew-point margins and explicit unsupported interstitial-condensation scope, or the same missing-boundary not-run reason. */
    moisture: IAutoMovieAnalysisRun;
  };
}
