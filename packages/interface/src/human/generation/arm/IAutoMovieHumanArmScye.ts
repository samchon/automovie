import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLimbRootStrip } from "../IAutoMovieHumanLimbRootStrip";

/**
 * The shoulder opening's ring and downward physical-station derivatives in the
 * left frame.
 *
 * The interface package owns these declarations; AutoMovieHumanArmScye in Human
 * supplies their runtime values.
 */
export namespace IAutoMovieHumanArmScye {
  /** The ring's place, size, outline and jet. */
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
     * counted downward, read by one-sided differences of third order from above
     * the ring, since the chain ends there.
     */
    jets: IAutoMovieHumanLimbRootStrip.IJet[];
  }
}
