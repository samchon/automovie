import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Team ball skills. The original dribble, dig, set and throw-in describe
 * implied-ball motion, and the throw-in can release a held ball. The court
 * releases publish the real spherical ball through the common prop flight
 * owner. An independently placed `stageCatch` can take custody at a realized
 * interception, including after a bounce. The high-hand contest and the
 * volleyball stroke variants have their own support and hand timing.
 *
 * The court kinds (`dribbleRelease`, `chestPass`, `bouncePass`, `setShot`,
 * `handballThrow`, `highHandContest`) and the volleyball kinds keep the feet
 * planted. `ballSport` is not an overlay law: it is refused over a walk, a run
 * or a jump, and a planted contest follows a run cut by `until`, or a stand. It
 * is cut by `stand`, `walk` and another `ballSport`, and by a staged catch once
 * the ball has left the hands. A court release needs the held ball in `prop`
 * and a spherical collision shape, and a pass needs `at`.
 *
 * - Dribble: the knees give a twentieth of the stature (provisional), the palm
 *   faces down at the hand's side ahead of the hip, pushes down a quarter of
 *   the arm and rises again `count` times at 2 bounces a second (provisional).
 * - Dig: in a crouch, both arms reach from the displayed shoulders, nearly
 *   straight, to a platform pointing 40 degrees below the horizontal, the palms
 *   together; the platform lifts 10 degrees at the contact.
 * - Set: in a crouch, both hands stand above the forehead, palms up and forward;
 *   at the contact the legs extend and the hands rise overhead.
 * - Throw-in: both feet stay on the ground (the Laws of the Game), both hands are
 *   drawn behind the head while the trunk arches back about the hips, and they
 *   come over the head and forward as the trunk flexes, along a line rising at
 *   30 degrees, the distance-best release angle (Linthorne and Everett 2006),
 *   to where it meets the arms' reach about the flexed shoulders.
 *
 * The existing implied phrases use a ready position, stroke and return. The
 * court and volleyball variants define support and arm timings for their
 * respective skills.
 */
export namespace IAutoMovieMotionHumanBallSport {
  /** Parameters. */
  export interface IParams {
    /** The skill. */
    kind: IAutoMovieMotionHumanBallSport.Kind;

    /** Dribbling or throwing hand; `right` when absent. */
    hand?: "left" | "right";

    /**
     * Bounces of the implied `dribble` only, a whole number of at least 1; 4
     * when absent, at 2 bounces a second (`ballSport.BOUNCES`, provisional): a
     * 2 s dribble. A `dribbleRelease` pushes the ball once and ignores it.
     */
    count?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;

    /**
     * The previously held ball. Optional for throw-in, required for court
     * releases, and unused for an implied skill or a contest.
     */
    prop?: string;

    /**
     * World metres. The throw-in, chest pass, set shot and handball throw aim
     * through this centre. A bounce pass aims at this floor position. A contest
     * uses it as a gaze target.
     */
    at?: IAutoMovieVector3;

    /**
     * Seconds, positive, from the release to the ball passing `at` for a chest
     * pass, a set shot or a handball throw, or to a bounce pass's first impact;
     * each court skill's own provisional time when absent: a chest pass 0.42 s,
     * a bounce pass 0.28 s, a set shot 0.88 s, a handball throw 0.33 s. A
     * `dribbleRelease` and a contest have none.
     */
    flightSeconds?: number;

    /**
     * The volleyball stroke's authored palm or forearm surface position, world
     * metres. Omitted to use the stroke's fitted default.
     */
    contactAt?: IAutoMovieVector3;
  }

  /** The supported legacy, court and volleyball phrases. */
  export type Kind =
    | "dribble"
    | "dig"
    | "set"
    | "throwIn"
    | "dribbleRelease"
    | "chestPass"
    | "bouncePass"
    | "setShot"
    | "handballThrow"
    | "highHandContest"
    | "volleyballServe"
    | "volleyballSpike"
    | "volleyballBlock"
    | "volleyballReceive"
    | "volleyballSet";
}
