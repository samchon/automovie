/**
 * What the solve of the trunk moves: the landmarks the courses own and the
 * half widths the tapes own. Saved, it replays a solved trunk without solving
 * again.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation What the solve of the trunk moves: the landmarks the courses own and the half widths the tapes own.
 * @evidence contracts/development/design.md#principled-representation `waist`: Natural waist height, mm. `bust`: Bust point height, mm. `shoulderZ`: The shoulder points' half breadth, mm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanTrunkClosure.girthAt, AutoMovieHumanTrunkClosure.tapes, AutoMovieHumanTrunkClosure.courses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `waist`, `bust`, `shoulderZ`, `anterior`, `groin`, `widths`, `projection`; callers supply the complete record.
 */
export interface IAutoMovieHumanTrunkState {
  /** Natural waist height, mm. */
  waist: number;

  /** Bust point height, mm. */
  bust: number;

  /** The shoulder points' half breadth, mm. */
  shoulderZ: number;

  /** Lateral share of the anterior axillary guide at the axilla. */
  anterior: number;

  /** The crotch key's half width, mm. */
  groin: number;

  /** The tapes' half widths: hip at the buttock point, high hip, waist, underbust at the fold and the chest wall at the bust point. */
  widths: Record<"buttock" | "highHip" | "waist" | "fold" | "bust", number>;

  /** The breasts' projection over the chest wall at the bust point, mm: what the chest tape closes over the wall. */
  projection: number;
}
