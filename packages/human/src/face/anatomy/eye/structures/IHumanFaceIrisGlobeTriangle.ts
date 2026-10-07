/**
 * One triangle of an eye's textured globe: its three neutral corner positions
 * and the matching three corner texture coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Corner positions and corner UVs stay paired per triangle, so a texel's barycentric weights address the same surface point the texture shows.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the globe's anonymous triangle element.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The triangle is copied from the basis and names no subject or asset.
 * @evidence contracts/common.md#meaningful-documentation States corner order, units and the pairing of positions with UVs.
 * @evidence contracts/modeling.md#spatial-conventions Positions are neutral basis metres in the Y-up head frame; UVs are normalized texture coordinates.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record copies one globe triangle and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive; it is read to locate texels.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The painted texture is observed under the pigment rule that consumes it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries basis geometry, not an anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived basis data, not a caller input.
 * @author Samchon
 */
export interface IHumanFaceIrisGlobeTriangle {
  /** Three neutral corner positions, metres. */
  positions: [number, number, number][];

  /** Three corner texture coordinates, in the same order. */
  uvs: [number, number][];
}
