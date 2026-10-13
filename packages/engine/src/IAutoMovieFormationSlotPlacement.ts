import { IAutoMovieVector3 } from "@automovie/interface";

/**
 *
 * Where one member of a unit really stands, and whether it is there at all.
 *
 * Produced by `placeFormationSlot`, which composes the unit's sampled cue with
 * the member's own cue; the ground gate, the overlap gate and geometry
 * measurement all read this one result.
 *
 * @evidence contracts/common.md#principled-implementation One composed answer per member: the unit transform first, then the member's offset rotated by the unit's base heading plus its sampled facing offset, so member motion stays inside the unit's frame.
 * @evidence contracts/common.md#clear-and-simple-design Three fields every member-placement consumer needs; `present` travels beside the position so no consumer can place a removed member without seeing the flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Heading is summed without wrapping, so consumers treat degrees modulo 360; no consumer-specific adjustment is applied to any field.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the composition order, the meters and degrees units in world space, that heading is unwrapped, and that an absent member still has a position.
 * @evidenceExclude contracts/performance.md#cost-and-resources A three-field result allocated once per member for each placement call. Recomputed per member per sampled time, since both the unit cue and the member cue change with time. Holds a fresh position vector and two scalars owned by the caller; nothing is cached by the producer.
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
