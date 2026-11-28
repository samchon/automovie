/**
 * One native bridge endpoint's transformed values and physical-station
 * derivatives. All three rows have eight entries, with the four log extents
 * followed by four logit shoulders in source order.
 */
export interface IAutoMovieLoftSectionBoundaryControls {
  /** Four log extent values followed by four logit shoulder shares. */
  value: number[];

  /**
   * First derivative of each transformed value per millimetre of physical
   * station, in value order.
   */
  slope: number[];

  /**
   * Second derivative of each transformed value per squared millimetre of
   * physical station, in value order.
   */
  curvature: number[];
}
