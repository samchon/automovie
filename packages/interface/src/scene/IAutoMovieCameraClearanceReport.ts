import type { IAutoMovieCameraClearanceFinding } from "./IAutoMovieCameraClearanceFinding";

/**
 * Reproducible physical-clearance result for one realized camera take.
 *
 * The evaluator reports the ordered base-clock-plus-key sample plan and its
 * verdict; differing supplied revision identities yield stale before geometry
 * inspection. The performing producer admits only clear results from its
 * supplied current-revision runtime. A stored report contains no revision pair,
 * so structural artifact admission cannot independently establish that its
 * geometry is still current or that evaluation occurred.
 *
 * The compared revision identities remain evaluation inputs rather than report
 * fields, separating freshness admission from stable compiled report bytes.
 */
export interface IAutoMovieCameraClearanceReport {
  /** Scene camera identity evaluated. */
  camera: string;

  /** Endpoint-inclusive inspection samples per second. */
  sampleRate: number;

  /** Exact ordered fixed-clock and causal sample instants evaluated. */
  sampleTimes: number[];

  /** Exact number of adjacent carried sample intervals evaluated. */
  intervals: number;

  /**
   * Verdict for the evaluated sampled bounds and interval premises: clear,
   * blocked or stale; no unrestricted continuous-mesh collision certificate.
   */
  status: "clear" | "blocked" | "stale";

  /** Stable interval-ordered contacts; empty for clear and stale reports. */
  findings: IAutoMovieCameraClearanceFinding[];
}
