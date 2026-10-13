import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * Refresh entry returned by `renderBodySimpleControls` to the body panel. The mounted controls share an in-flight or accepted projection only for equal shape, anatomy and whole-person context. Completion may display a reading, discard a stale result or report a refusal; it does not certify a successful projection.
 *
 * @evidence contracts/common.md#principled-implementation A promise-returning refresh entry exposes completion of the controls' projection lifecycle without exposing their generation counters, edited fields or accepted-reading state.
 * @evidence contracts/common.md#clear-and-simple-design The panel receives only the refresh operation it calls after document changes; solver inputs and UI invalidation remain inside the mounted simple controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refresh completion is documented independently of numerical success, so stale or refused reads are not presented as accepted measurements.
 * @evidence contracts/common.md#meaningful-documentation The handle comment names all projection dependencies and distinguishes display, stale discard and refusal as possible completion outcomes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The handle type selects no equality or projection algorithm; the mounted refresh implementation owns their shape-dependent traversal and numerical costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The handle declares refresh access but does not implement its pending or accepted-result reuse policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This interface describes a borrowed operation reference, with retained reading state owned by the controls that created it.
 *
 * @author Samchon
 */
export interface IBodySimpleControlsHandle {
  /**
   * Refresh this body's simple reading, sharing equivalent pending or accepted work. Resolves after publication, discard or reported refusal.
   *
   * @evidence contracts/common.md#principled-implementation The body argument carries every rest-reading dependency, and the completion promise lets the caller observe the UI refresh path rather than infer it from a timer.
   * @evidence contracts/common.md#clear-and-simple-design A single asynchronous entry updates the mounted simple tier without exposing a numerical result that the panel would have to render again.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The signature does not promise a new solve for repeated inputs or encode a successful reading when its void completion settles.
   * @evidence contracts/common.md#meaningful-documentation The operation comment explains equivalent-work sharing and the three completion outcomes, including reported projection refusal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callable member declares a refresh contract; its implementation determines map comparison and projection cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work In-flight and completed projection sharing belong to the refresh closure, not to this function-valued type member.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Calling through this declaration transfers no worker ownership; the mounted control owner holds the pending promise and accepted reading.
   */
  refresh: (body: IBodySimpleBody) => Promise<void>;
}
