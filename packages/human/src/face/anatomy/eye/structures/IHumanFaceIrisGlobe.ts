import type { IHumanFaceIrisGlobeTriangle } from "./IHumanFaceIrisGlobeTriangle";

/**
 * One eye's textured globe on the neutral basis.
 *
 * The globe is the first textured, UV-bearing region whose triangles are fully
 * bound to the eye owner (weight one on all three vertices). `texture` is the
 * embedded PNG data URI of its material, `triangles` those bound triangles and
 * `positions` the distinct neutral positions of their vertices.
 *
 * @evidence contracts/common.md#principled-implementation Only triangles rigidly bound to the eye owner are kept, so the painted globe moves as that eye.
 * @evidence contracts/common.md#clear-and-simple-design One named record carries what the iris locator and rasterizer read for one eye.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The globe is found from attachment weights and textures, never from a named asset or vertex list.
 * @evidence contracts/common.md#meaningful-documentation States the selection rule, each field and its unit.
 * @evidence contracts/modeling.md#part-identity-and-grouping Identifies the globe region that belongs to one articulated eye owner.
 * @evidence contracts/modeling.md#spatial-conventions Positions are neutral basis metres in the Y-up head frame.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The painted texture is observed under the pigment rule that consumes it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries basis geometry and texture, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived basis data, not a caller input.
 * @author Samchon
 */
export interface IHumanFaceIrisGlobe {
  /** Eye owner the globe is bound to. */
  eye: string;

  /** ID of the globe region's material. */
  material: string;

  /** Embedded PNG data URI of that material's base colour texture. */
  texture: string;

  /** Region triangles fully bound to the eye owner. */
  triangles: IHumanFaceIrisGlobeTriangle[];

  /** Distinct neutral positions of those triangles' vertices, metres. */
  positions: [number, number, number][];
}
