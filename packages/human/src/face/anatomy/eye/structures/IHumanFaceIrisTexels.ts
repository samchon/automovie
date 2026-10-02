/**
 * The texels of one eye texture that lie on an iris disc, produced by
 * `rasterizeHumanFaceIrisTexels` and painted by the iris pigment rule.
 * The three arrays are parallel, one entry per kept texel.
 *
 * @evidence contracts/common.md#principled-implementation Three parallel arrays indexed by kept texel hold exactly what the painting rule reads for each texel: where it is in the image and its exact polar coordinates on the surface it shows.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of three parallel arrays with one producer and one consumer, and no per-texel object allocation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and names no subject or asset.
 * @evidence contracts/common.md#meaningful-documentation Each array states its meaning and unit and the record states that the arrays are parallel.
 * @evidence contracts/modeling.md#spatial-conventions Angles are radians about the disc axis and the texel index is a row-major image index, each stated on its field.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record lists texels and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record holds texels and emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is derived index data that owns no part and displays nothing; the painted result is observed under the colour rule that consumes it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries positions on a globe and no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits or bounds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is derived data and no caller input shapes a face through it.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisTexels {
  /** Texel index `y * width + x`, one per kept texel. */
  index: number[];

  /** Polar angle from the optical axis, radians. */
  theta: number[];

  /** Azimuth about the optical axis in (-pi, pi], radians. */
  phi: number[];
}
