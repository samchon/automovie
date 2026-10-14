import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import type { IBodySimpleBody } from "./IBodySimpleBody";
import type { IConnectedBodyMeasurement } from "./IConnectedBodyMeasurement";

/**
 * The simple tier and the detailed measurement inverse, solved off the page's thread. Expansion and projection use the worker's loaded whole-person reader, while detailed measurement inversion uses the loaded body's declared channel reach. Rejections preserve numerical refusal; these operations do not themselves commit the body document.
 *
 * @evidence contracts/common.md#principled-implementation The simple-to-detailed and detailed-to-simple operations remain explicit and share declared whole-person measurement provenance, while a named channel inverse stays tied to the body's supported reach.
 * @evidence contracts/common.md#clear-and-simple-design One numerical service groups the body panel's off-thread shape operations without adding document history, DOM or renderer responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Loaded numerical authority determines supported inversions; no fixture measurements or clamped fallback shape is declared for an unreachable request.
 * @evidence contracts/common.md#meaningful-documentation The interface documents off-thread ownership, whole-person context, channel reach, refusal and the separation from document commitment.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Service signatures select no inverse sampling or full-body measurement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The service type declares no cross-request result cache; worker source residency and control-level input reuse belong to their implementations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The numerical service declaration acquires no worker or source data; transport implementations own connections and pending tasks.
 *
 * @author Samchon
 */
export interface IConnectedBodySimpleSolvers {
  /**
   * Expand simple values over the detailed base, preserving traits outside the simple tier and rejecting unreachable targets.
   *
   * @evidence contracts/common.md#principled-implementation Expansion takes the detailed base explicitly so simple authoring retains residual detailed traits the inverse does not control.
   * @evidence contracts/common.md#clear-and-simple-design The promise supplies canonical detailed weights while document assembly and publication remain parent operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreachable simple targets remain rejected rather than replaced with another body's measurements.
   * @evidence contracts/common.md#meaningful-documentation The member states detailed residue preservation and unreachable-target rejection.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This service expansion signature implements no sampling or channel inversion algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The expansion contract promises no memoized shape or shared effect across user intents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Request tasks and resident source data remain transport-owned behind the expansion promise.
   */
  expand: (
    simple: IAutoMovieHumanBodySimpleShape,
    over: Record<string, number>,
  ) => Promise<Record<string, number>>;

  /**
   * Read simple values after resolving the body's anatomy into effective weights; stature and mass use the declared whole-person reader.
   *
   * @evidence contracts/common.md#principled-implementation Projection includes anatomy because authored targets can change the effective body beyond its stored channel weights alone.
   * @evidence contracts/common.md#clear-and-simple-design The numerical reader returns simple values and leaves their precision-preserving display to the control owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Readback is measured from the resolved input instead of copied from an earlier simple authoring request.
   * @evidence contracts/common.md#meaningful-documentation The member identifies anatomy resolution and head-dependent whole-person stature and mass.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The service projection declaration selects no anatomical solve or measurement traversal strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Projection-result reuse belongs to the caller's complete input comparison, not this callback type.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The transport owns pending reads and loaded sources; this declaration exposes completion data only.
   */
  project: (body: IBodySimpleBody) => Promise<IAutoMovieHumanBodySimpleShape>;

  /**
   * Where stature and mass are read (the whole person and the head it is read with), shown beside those readings.
   */
  wholeSource: string;

  /**
   * Solve one channel for a target length in metres within the loaded body reach; return achieved readback or reject numerical refusal.
   *
   * @evidence contracts/common.md#principled-implementation A named physical measurement is inverted along one supported detailed channel with the starting shape supplied explicitly.
   * @evidence contracts/common.md#clear-and-simple-design The returned shape and achieved measurement serve the panel without exposing solver brackets or numerical source internals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Achieved readback remains distinct from the requested target, and unsupported inversions are not hidden by endpoint clamping.
   * @evidence contracts/common.md#meaningful-documentation The operation states metre units, loaded reach, achieved-result meaning and refusal propagation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This detailed inverse signature leaves bracket evaluation and body shaping to the Human solver owner.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No solved-channel cache or coalescing of effectful edit intents is specified here.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The numerical service provider owns the worker request lifetime behind this measurement promise.
   */
  solveMeasurement: (
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ) => Promise<IConnectedBodyMeasurement>;

  /**
   * Permanently retire the owned simple worker connection and reject pending numerical requests.
   *
   * @evidence contracts/common.md#principled-implementation Service closure ends its resident numerical connection and withdraws queued and active request promises before page retirement.
   * @evidence contracts/common.md#clear-and-simple-design One service lifetime entry complements its three numerical operations without exposing the worker adapter's request maps.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Shutdown rejects unfinished work rather than fabricating solved shapes or allowing the retired service to reconnect silently.
   * @evidence contracts/common.md#meaningful-documentation The member states permanent worker retirement and pending numerical-request rejection.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This service-close type chooses no pending-request traversal or native termination implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Closure is an ownership effect with no shareable numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The service provider owns the worker and queued promises whose release this member exposes.
   */
  close: () => void;
}
