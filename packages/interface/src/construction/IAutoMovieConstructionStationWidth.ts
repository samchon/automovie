/**
 * A part's rail at one fixed station for every phase: where a lofted part's
 * first own section stands, beyond the curve's farthest reach along the part.
 *
 * Valid only as a part's width under the phase parameter; on a host, or under
 * the angle or arc parameter, it is refused with a diagnostic, and a station on
 * the wrong side of the curve leaves the join without a rail.
 */
export interface IAutoMovieConstructionStationWidth {
  /** Discriminator. */
  type: "station";

  /** The part's station of its rail, metres along its axis. */
  value: number;
}
