import type { IHumanFaceLipMarginPoint } from "./IHumanFaceLipMarginPoint";

/** The two ordered source contact trajectories read on one actual surface.
 *
 * @evidence contracts/common.md#principled-implementation Both trajectories preserve the same native support and geometric interpolation definition.
 * @evidence contracts/common.md#clear-and-simple-design Two named point arrays describe the contact span.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no vertex approximation for material seats.
 * @evidence contracts/common.md#meaningful-documentation Names ordering and common source ownership.
 * @evidence contracts/modeling.md#shared-boundaries Upper/lower readers supply the boundaries consumed by contact and oral assembly.
 * @evidence contracts/modeling.md#spatial-conventions Actual points retain the caller's canonical head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Assemblies own rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Reads supplied source trajectories without a clinical protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range Contact consumers own limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal point field.
 * @author Samchon
 */
export interface IHumanFaceLipMarginPoints {
  /** Original ordered upper trajectory. */
  upper: IHumanFaceLipMarginPoint[];

  /** Original ordered lower trajectory. */
  lower: IHumanFaceLipMarginPoint[];
}
