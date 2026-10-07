import type { IHumanFaceColourMesh } from "./IHumanFaceColourMesh";

/**
 * One resident face part's material lookup and mutable mesh colour payload.
 * The colour-fold owner changes only the colour buffer and corresponding
 * material channels; the source geometry and part identity stay with the caller.
 *
 * @evidence contracts/common.md#principled-implementation A material identity pairs the mesh's multiplier colours with the material they multiply.
 * @evidence contracts/common.md#clear-and-simple-design One lookup key and one existing mesh payload.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The colour-fold owner consumes the caller's real mesh and material.
 * @evidence contracts/common.md#meaningful-documentation States mutations and retained geometry ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The input identifies an existing part rather than constructing one.
 * @evidenceExclude contracts/modeling.md#parameter-channels The input defines no geometric channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The input emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The input transports the existing mesh frame without conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The input creates no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The colour-fold owner observes its consumer's output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The input introduces no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Material admission stays with the colour-fold owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This transport input authors no geometry.
 * @author Samchon
 */
export interface IHumanFaceColourPart {
  /** Existing material identity used by the part. */
  material: string;

  /** Caller-owned mesh and its colour multiplier buffer. */
  geometry: IHumanFaceColourMesh;
}
