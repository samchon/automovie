import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one member of a unit really stands, and whether it is there at all.
 *
 * Produced by `placeFormationSlot`, which composes the unit's sampled cue with
 * the member's own cue; the ground gate, the overlap gate and geometry
 * measurement all read this one result.
 *
 * @author Samchon
 */
export interface IAutoMovieFormationSlotPlacement {
  /**
   * Whether this member is drawn, measured and counted at this time, copied
   * from the member's sampled state; a member that is not present still has a
   * position.
   */
  present: boolean;

  /**
   * World-space position in meters: the rest position moved by the unit cue,
   * then by the member's own offset rotated into the unit's current heading.
   */
  position: IAutoMovieVector3;

  /**
   * World-space heading in degrees: the rest heading plus the unit's and the
   * member's facing offsets, not wrapped to any range.
   */
  facingDeg: number;
}
