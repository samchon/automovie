import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One member-local deviation from the unit that member stands in.
 *
 * A group cue moves every member alike. This is what one named member does
 * differently: whether it is there at all, how far it has come off the place
 * its layout put it, and how far it has turned out of the heading its unit
 * holds. The offset and the heading are stated in the unit's own frame, so a
 * member that steps left keeps stepping left after its unit turns.
 */
export interface IAutoMovieFormationSlotState {
  /**
   * Whether this member is drawn, measured and counted at all.
   *
   * False is the whole of removal: the member stops being rendered, stops being
   * measured against the ground its shot staged, and stops being counted among
   * the drawn. Its unit's designed count, bounds and centroid are unchanged,
   * because those describe the unit that was designed rather than the members
   * standing at one instant.
   */
  present: boolean;

  /** Displacement from the member's designed place, in unit-local meters. */
  offset: IAutoMovieVector3;

  /** Heading added to the member's placed heading, in degrees. */
  facingOffsetDeg: number;
}
