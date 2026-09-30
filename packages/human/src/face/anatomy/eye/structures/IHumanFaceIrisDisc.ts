/**
 * Where the iris of one eye lies on its globe, found from the globe's own
 * geometry by `locateHumanFaceIrisDisc` and consumed by the iris texel
 * rasterizer and pigment rule. Lengths are metres in the basis frame,
 * angles radians from the optical axis; the limbus and pupil are the
 * population's absolute sizes on this globe.
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
