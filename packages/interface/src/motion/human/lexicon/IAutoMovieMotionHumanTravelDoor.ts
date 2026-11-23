import type { IAutoMovieMotionHumanGait } from "../next/IAutoMovieMotionHumanGait";

/**
 * Going through a doorway: travel that lines up with a named opening of one of
 * the performance's obstacles, passes through its middle and comes out beyond
 * it. Register `HumanTravelDoor.passThrough` to use it.
 *
 * The upright gait squares up on the opening's line and uses the ordinary
 * walk's clearance. Ducking, squeezing and a prone crawl fit the posed body
 * through the full depth of a fixed opening whose sill is at floor height, and
 * refuse with the width or headroom the posed body needs. Enter the crawl prone
 * and compose it with a floor transition and get-up.
 */
export namespace IAutoMovieMotionHumanTravelDoor {
  /**
   * How the body passes the opening: `upright` walks through, `duck` lowers the
   * pelvis and pitches the trunk under the lintel, `squeeze` turns side-on
   * between the jambs, and `crawl` travels prone on alternating palms from a
   * prone entry.
   */
  export type Mode = "upright" | "duck" | "squeeze" | "crawl";

  /** Parameters of a passage. */
  export interface IParams {
    /** The obstacle whose opening is passed: its subject id. */
    through: string;

    /** The opening's id within that obstacle; its only opening when absent. */
    aperture?: string;

    /** The posture fitted through the opening; `upright` when absent. */
    mode?: Mode;

    /**
     * The standing gait's walk pace (`IAutoMovieMotionHumanWalkParams.pace`
     * gives the speeds); `normal` upright and `slow` for duck and squeeze when
     * absent. The crawl ignores it.
     */
    pace?: IAutoMovieMotionHumanGait.WalkPace;
  }
}
