import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one member of a unit really stands, and whether it is there at all.
 *
 * Produced by `placeFormationSlot`, which composes the unit's sampled cue with
 * the member's own cue; the ground gate, the overlap gate and geometry
 * measurement all read this one result.
 *
 * @evidence contracts/development/design.md#principled-representation Composition order is fixed: the unit's sampled transform first, then the member's own offset rotated by the unit's current heading, so a member cue displaces inside the unit frame and turning the unit carries the offset with it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three fields every consumer needs, presence, world position and heading, produced by `placeFormationSlot` so the ground gate, the overlap gate and geometry measurement read one composition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent member keeps a computed position instead of a sentinel, so no consumer needs a special branch to read it, and the heading is left unwrapped rather than normalized for one consumer's range.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer and its readers, that an absent member still has a position, the world-space meter and degree units, the composition order, and that the heading is not wrapped.
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
