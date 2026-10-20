import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one member of a unit really stands, and whether it is there at all.
 *
 * Produced by `placeFormationSlot`, which composes the unit's sampled cue with
 * the member's own cue; the ground gate, the overlap gate and geometry
 * measurement all read this one result.
 *
 * @evidence contracts/common.md#principled-implementation Composition order is fixed: the unit's sampled transform first, then the member's own offset rotated by the unit's current heading, so a member cue displaces inside the unit frame and turning the unit carries the offset with it.
 * @evidence contracts/common.md#clear-and-simple-design Three fields every consumer needs, presence, world position and heading, produced by `placeFormationSlot` so the ground gate, the overlap gate and geometry measurement read one composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent member keeps a computed position instead of a sentinel, so no consumer needs a special branch to read it, and the heading is left unwrapped rather than normalized for one consumer's range.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its readers, that an absent member still has a position, the world-space meter and degree units, the composition order, and that the heading is not wrapped.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Result record; `placeFormationSlot` computes it in constant time per member from two rotations, answered there.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh placement per member and time; no placement is cached because both the unit and member states vary with time.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One fresh position vector, one flag and one number owned by the caller; nothing references shared state.
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
