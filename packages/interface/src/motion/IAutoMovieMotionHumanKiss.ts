import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * A kiss while standing: the lips brought to a partner's region (a cheek, the
 * forehead, the crown, the lips, the back of a hand) by leaning the body from
 * the hips and flexing the neck, the head turned to one side for a cheek or the
 * lips so the noses stay clear.
 *
 * The lean and the neck's flexion are solved at plan time so the mouth region
 * of the leaned posture lands on the target as it stands at the kiss's start: a
 * grid of pitch and flexion at 5 degree steps, then 1 degree steps about the
 * best, then a lean of up to 10 degrees to the side the target lies on, and,
 * when the mouth is still short, a rise onto the toes of up to 35 degrees of
 * heel (both provisional). The head turns 30 degrees for a cheek or the lips
 * (provisional), to the right unless `side` says otherwise; Guntürkün 2003
 * observed a two-to-one rightward bias, which Sedgewick et al. 2019 did not
 * find, so the side is a parameter. The approach is the free-space transport of
 * the mouth's travel, the kiss holds 0.6 s (provisional) and the return takes
 * the approach's time. Standing, the hips move back by the static balance's
 * shift at the solved lean (`HumanBalance.shift`, as a bow's do), so the centre
 * stays over the feet, and the lean is solved again with them there. The feet
 * stay where they stand; a difference the lean, the neck and the toes cannot
 * close is left as a miss the verdict reports, and a step in is not drafted
 * yet.
 *
 * Events: the phrase instants, with `contact` at `ready` and `part` at `relax`.
 */
export namespace IAutoMovieMotionHumanKiss {
  /** Which participant writes a jointly timed hand kiss. */
  export type HandRole = "kisser" | "presenter";

  /** Parameters. */
  export interface IParams {
    /** The partner. */
    partner: string;

    /** The partner's region. */
    region: AutoMovieHumanoidRegion;

    /**
     * The participant in a shared hand kiss. When absent, a kiss reads an
     * already presented hand or the named region of the other person.
     */
    handRole?: HandRole;

    /** Which way the head turns for a cheek or the lips; `right` when absent. */
    side?: "left" | "right";

    /** Seconds the lips stay; `HOLD` when absent. */
    hold?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** A solved kiss: how the body brings the mouth to the point. */
  export interface ISolved {
    /** The lean forward from the hips, degrees. */
    pitch: number;

    /** The lean toward the body's right from the hips, degrees. */
    roll: number;

    /** The neck's and the head's flexion, degrees. */
    flexion: number;

    /**
     * An individually presented hand may require a turn toward the staged skin
     * point, degrees.
     */
    twist?: number;

    /** The heels' raise, degrees. */
    raise: number;

    /**
     * The descent over planted feet from the tilted body, metres; zero when
     * absent.
     */
    sink?: number;

    /** Sideways pelvis displacement over the two planted supports, metres. */
    shift?: number;

    /** Forward pelvis displacement, metres in the planted stance frame. */
    advance?: number;

    /** Pelvis turn about the vertical over the two fixed feet, degrees. */
    bearing?: number;

    /** The mouth's distance to the point, metres. */
    miss: number;
  }
}
