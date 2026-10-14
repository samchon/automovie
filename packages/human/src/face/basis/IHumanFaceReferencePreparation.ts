import type { IHumanFaceOpticalAssembly } from "../anatomy/eye/structures/IHumanFaceOpticalAssembly";
import type { IHumanFaceNativePose } from "./IHumanFaceNativePose";

/** Source reference and its optical support, completed at the assembly's existing stage boundary.
 *
 * @evidence contracts/common.md#principled-implementation prepareHumanFaceReference seats independent rest optics/lids on the source shape, snapshots material-guide registration, then completes persistent relief and final source replay in the shared assembly order.
 * @evidence contracts/common.md#clear-and-simple-design Intermediate shaped/optical/material-reference states remain available to their actual consumers while one completion boundary owns the final reference.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Completion commits only after all replay/observer work succeeds and can retry without double relief; this partial source stage certifies no generated whole-model admission.
 * @evidence contracts/common.md#meaningful-documentation Members separate pre-relief source state, material-guide snapshot and final owned head-metre arrays.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no seating/replay; the preparation owner carries source/optical costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type schedules no calls; the completion owner reuses its committed result and original supplied native stage.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; preparation closures retain state/snapshots until their consumer releases them.
 *
 * @author Samchon
 */
export interface IHumanFaceReferencePreparation {
  /** Independent optics with the exact rest exterior used by source attachment metrics. */
  optics?: IHumanFaceOpticalAssembly[];

  /** Stage-owned shape-only arrays, initially lid-seated; successful completion commits persistent relief into them. */
  shaped?: IHumanFaceNativePose["shaped"];

  /** Same shape-only skin after lid seating, retained before persistent relief for material-guide registration. */
  materialReference?: ReadonlyMap<string, readonly number[]>;

  /**
   * Complete persistent relief and final source replay, returning head-metre arrays.
   * Successful repeats return the same reference; absent shape returns undefined.
   *
   * @evidence contracts/common.md#principled-implementation The producer applies identity relief to candidate arrays then replays every source before committing its final reference.
   * @evidence contracts/common.md#clear-and-simple-design One completion callback preserves reference/assembly ordering without duplicating source preparation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed replay or observer work commits no relieved reference, so retry does not apply relief twice; no whole-model or GPU acceptance follows.
   * @evidence contracts/common.md#meaningful-documentation The comment gives committed-repeat identity, head metres, optional absence and completion purpose.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no relief/replay; its producer owns those costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature schedules no work; prepareHumanFaceReference owns completion memoization.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no resource; the preparation closure owns retained snapshots/results.
   */
  complete(): Map<string, number[]> | undefined;
}
