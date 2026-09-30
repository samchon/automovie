/**
 * Where the iris of one eye lies on its globe, found from the globe's own
 * geometry by `locateHumanFaceIrisDisc` and consumed by the iris texel
 * rasterizer and pigment rule. Lengths are metres in the basis frame,
 * angles radians from the optical axis; the limbus and pupil are the
 * population's absolute sizes on this globe.
 *
 * @evidence contracts/common.md#principled-implementation The fields are the minimum that fix a circular disc on a sphere: its centre and radius, the optical axis, an azimuth reference and the limbal, pupillary and painted half-angles, so a texel's polar coordinates against them classify it as pupil, iris or beyond.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of eight fields produced by one function and consumed by the rasterizer and the pigment rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and names no subject or asset.
 * @evidence contracts/common.md#meaningful-documentation Each field states its meaning, unit and reference, and the record states its producer, its consumers and its frame.
 * @evidence contracts/modeling.md#spatial-conventions Lengths are metres in the basis frame and angles are radians from the axis, and the azimuth reference is a unit vector perpendicular to the axis, each stated on its field.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record describes a disc on a globe and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record holds the result; the population lengths behind the limbus, pupil and painted angles are cited on `locateHumanFaceIrisDisc`, which owns them.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits or bounds no value; the producer derives every field.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is derived data and no caller input shapes a face through it.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisDisc {
  /** Sclera sphere centre, metres. */
  centre: [number, number, number];

  /** Sclera sphere radius, metres. */
  radius: number;

  /** Unit optical axis, from the centre through the corneal apex. */
  axis: [number, number, number];

  /** Unit azimuth reference perpendicular to `axis`. */
  reference: [number, number, number];

  /** Limbal half-angle from the axis, radians. */
  limbus: number;

  /** Pupillary half-angle from the axis, radians. */
  pupil: number;

  /**
   * Half-angle at which the asset's own texture ends its painted iris,
   * radians: the population ratio of iris to globe, which the painting
   * follows whatever the globe's size.
   */
  painted: number;
}
