/**
 * A part's rail at one fixed station for every phase: where a lofted part's first own section stands, beyond the curve's farthest reach along the part.
 *
 * Valid only as a part's width under the phase parameter; on a host, or under the angle or arc parameter, it is refused with a diagnostic, and a station on the wrong side of the curve leaves the join without a rail.
 *
 * @evidence contracts/common.md#principled-implementation Under the phase parameter the part's rail lies on its station lines, so one station is a rail whose blend edge is one of the part's own sections.
 * @evidence contracts/common.md#clear-and-simple-design One number names the section the part is cut at.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A station inside the host is reported, never moved out to the curve.
 * @evidence contracts/common.md#meaningful-documentation States the station's meaning, where it is valid and both failure effects.
 */
export interface IAutoMovieConstructionStationWidth {
  /** Discriminator. */
  type: "station";

  /** The part's station of its rail, metres along its axis. */
  value: number;
}
