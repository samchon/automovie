/**
 * What the solve of the trunk moves: the landmarks the courses own and the
 * half widths the tapes own. Saved, it replays a solved trunk without solving
 * again.
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

  /** The tapes' half widths: hip at the buttock point, high hip, waist, underbust at the fold and chest at the bust point. */
  widths: Record<"buttock" | "highHip" | "waist" | "fold" | "bust", number>;
}
