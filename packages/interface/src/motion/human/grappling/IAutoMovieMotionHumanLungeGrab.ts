import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";

/**
 * A sudden lunge that closes both hands on a victim's region, as a shambler
 * breaks from its walk: the front foot steps long, the trunk pitches forward
 * and the hands close on the region through the stage-fight grab.
 */
export namespace IAutoMovieMotionHumanLungeGrab {
  /** Parameters. */
  export interface IParams {
    /** The victim. */
    partner: string;

    /**
     * The victim's region the hands close on; `shoulderLeft` and
     * `shoulderRight` together when absent.
     */
    region?: AutoMovieHumanoidRegion;

    /** The leg that steps into the lunge; the right when absent. */
    side?: AutoMovieHumanSide;
  }
}
