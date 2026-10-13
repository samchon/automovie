import type { IAutoMovieHumanFaceBasis } from "../../index";
import type { IAutoMovieHumanFaceConstructionProgress } from "../structures/IAutoMovieHumanFaceConstructionProgress";

/**
 * The admitted face basis one resident worker evaluates for preview and export.
 * The runtime owns compilation and document parsing; callers supply its basis.
 *
 * @evidence contracts/common.md#principled-implementation A caller-supplied numerical basis and optional actual construction-boundary callback configure resident compilation without a timer-based progress estimate.
 * @evidence contracts/common.md#clear-and-simple-design Basis ownership and observation are the only inputs; parsing and per-operation flags belong to the runtime/request owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress reports do not turn refused admission into success, and this schema supplies no bundled person's asset or estimated completion schedule.
 * @evidence contracts/common.md#meaningful-documentation Members state resident numerical compilation and actual owner boundaries, including refused admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The props declaration performs no compilation or progress algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It supplies the basis but defines no compilation equivalence or cached state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns its basis/callback and the resident worker lifetime; this type opens no worker handle.
 *
 * @author Samchon
 */
export interface IConnectedFaceRuntimeProps {
  /** Numerical basis compiled once by the resident runtime. */
  basis: IAutoMovieHumanFaceBasis;

  /**
   * Actual completed owner boundaries, including refused admission; no timer or guessed progress.
   *
   * @evidence contracts/common.md#principled-implementation The resident builder calls this observer at completed construction-owner boundaries with its actual progress record, including refused admission.
   * @evidence contracts/common.md#clear-and-simple-design One optional void callback observes construction without modifying the basis or returning admission decisions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The signature supplies no guessed timer progress or success-only fallback, and an observer cannot certify an unobserved render.
   * @evidence contracts/common.md#meaningful-documentation The argument owner identifies the actual boundary fields; absence means no progress observer.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This function type declares an observer and performs no progress calculation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It specifies event delivery without caching construction work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Callback retention and resident worker disposal belong to the runtime caller, not this signature.
   */
  progress?: (progress: IAutoMovieHumanFaceConstructionProgress) => void;
}
