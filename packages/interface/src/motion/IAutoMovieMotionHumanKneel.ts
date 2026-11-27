import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";

/**
 * Kneeling from standing: on one knee (half kneel), on both knees upright, or
 * sitting back on the heels, held, then rising the way it went down.
 *
 * The goals are floor points, solved by {@link kneelKeys}. The kneeling leg
 * steps back onto its tucked toes while the hips run a course along the heading
 * that keeps the extrapolated centre of mass between the feet
 * ({@link AutoMovieMotionHumanCourse}; Hof, Gazendam and Sinke 2005): it goes
 * from where it stands to the middle between the two feet as the foot travels,
 * so the hips trail the foot and arrive after it lands. Through the step the
 * hips ride as high as the less extended leg reaches its foot, the reach going
 * from the standing leg's to `REACH` of its length, a reverse lunge, and the
 * pelvis tips forward by what keeps the leg behind inside the hip's extension
 * range (`kneelKeys.lean`). Then the hips lower until the knee touches the
 * floor straight under its hip joint with the thigh upright, the shin lying
 * back along the floor to the foot. For both knees the front leg then swings
 * back and its knee lands beside the first, and for sitting back the hips turn
 * about the knees toward the heels until the knees flex `kneelKeys.SIT`
 * degrees. Pollard, Porter and Redfern (2011, J Appl Biomech 27:233) give the
 * four kneeling postures. The hands rest on the thighs as the body settles.
 *
 * Each phase moves on minimum-jerk progress; its length is provisional, scaled
 * by the square root of the hip height (Alexander 1984) and by the manner's
 * tempo. The root is lowered wherever a planted leg could not reach its foot.
 * Events: `stepBack` at the start, `kneeContact`, `secondKnee` for both knees,
 * `seatOnHeels` for sitting back, `settled`, and when it rises `kneeOff` and
 * `stood`.
 */
export namespace IAutoMovieMotionHumanKneel {
  /** Parameters. */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** The kneeling posture; `one` when absent. */
    kind?: IAutoMovieMotionHumanKneel.Kind;

    /** The knee that goes down first; `right` when absent. */
    knee?: "left" | "right";

    /** Seconds held kneeling; 1.5 when absent. */
    hold?: number;

    /** Whether the body rises again at the end; `true` when absent. */
    rise?: boolean;

    /**
     * Where the first knee comes down, such as beside a lying person's chest:
     * its point on the floor, its height ignored. The kneeling leg steps there,
     * forward, aside or back, the hip coming down over it while the other foot
     * stays planted, and the kneel is refused when that foot would be out of
     * the other leg's reach. Absent, the reverse lunge places the knee about a
     * thigh behind the other foot.
     */
    at?: IAutoMovieMotionTarget;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** On one knee, on both knees upright, or sitting back on the heels. */
  export type Kind = "one" | "both" | "sitBack";
}
