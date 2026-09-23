/**
 * Where the iris of one eye lies on its globe, found from the globe's own
 * geometry by `locateHumanFaceIrisDisc` and consumed by the iris texel
 * rasterizer and pigment rule. Lengths are metres in the basis frame,
 * angles radians from the optical axis.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Describes where the iris of one eye lies on its globe, independent of any person's texture.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Carries the sclera sphere, optical axis, azimuth reference and anatomical half-angles the iris rule paints within.
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
}
