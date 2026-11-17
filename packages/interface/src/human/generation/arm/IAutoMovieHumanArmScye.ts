import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLimbRootStrip } from "../IAutoMovieHumanLimbRootStrip";

/**
 * The shoulder opening's ring and downward physical-station derivatives in the left frame.
 *
 * The interface package owns these declarations; AutoMovieHumanArmScye in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The shoulder opening's ring and downward physical-station derivatives in the left frame. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IRing declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IRing separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanArmScye exchanges the named IRing contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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
