import type { IHumanFaceLipMarginPoint } from "./IHumanFaceLipMarginPoint";

/** The two ordered source contact trajectories read on one actual surface.
 *
 * @evidence contracts/common.md#principled-implementation The producer preserves the source's ordered upper/lower legacy or registered material contact trajectories on one actual position state.
 * @evidence contracts/common.md#clear-and-simple-design A paired result keeps the two fissure courses together while individual points carry their physical/source support.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native order and correspondence are admitted by the reader; the pair does not prove a seal or replace either course with nearest points.
 * @evidence contracts/common.md#meaningful-documentation Members identify upper/lower ordering and shared actual surface state; point documentation supplies basis-metre units and anchor meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record reads no course; readHumanFaceLipMarginPoints owns registration/interpolation costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no computation; consumers reuse this state's verified paired population.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; result arrays belong to their caller until released.
 *
 * @author Samchon
 */
export interface IHumanFaceLipMarginPoints {
  /** Original ordered upper trajectory. */
  upper: IHumanFaceLipMarginPoint[];

  /** Original ordered lower trajectory. */
  lower: IHumanFaceLipMarginPoint[];
}
