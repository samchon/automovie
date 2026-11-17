import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLimbRootStrip } from "../IAutoMovieHumanLimbRootStrip";

/** Type contracts exchanged by AutoMovieHumanArmScye; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmScye {
  /** The ring's place, size, outline and jet.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The ring's place, size, outline and jet.
   * @evidence contracts/development/design.md#principled-representation `centre`: Mean of the arc's points, left frame, mm. `radius`: Mean distance of the arc's points from the centre, mm. `outline`: The arc's points as `[x, z]` in the level plane, closed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmScye.of. Read by AutoMovieHumanArmLaw.of. Also types AutoMovieHumanArmConstruction.ring.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `centre`, `radius`, `outline`, `points`, `jets`; callers supply the complete record.
   */
  export interface IRing {
    /** Mean of the arc's points, left frame, mm. */
    centre: AutoMovieVector3Tuple;

    /** Mean distance of the arc's points from the centre, mm. */
    radius: number;

    /** The arc's points as `[x, z]` in the level plane, closed. */
    outline: [number, number][];

    /** The arc's points, mm, the same as `outline` with their height. */
    points: AutoMovieVector3Tuple[];

    /**
     * The shoulders' chain's jet at each point down across the ring: its first
     * and second derivatives per millimetre of the chain's station (height),
     * counted downward, read by one-sided differences of third order from
     * above the ring, since the chain ends there.
     */
    jets: IAutoMovieHumanLimbRootStrip.IJet[];
  }
}
