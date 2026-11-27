/**
 * How long an effector takes to travel a distance.
 *
 * Two rules, and which one a movement takes:
 *
 * - {@link motionHumanTiming.transport}: a movement in free space (a
 *   gesture's preparation, a hand to a rest place, a retraction) lasts `0.25 +
 *   0.5 D` seconds for `D` metres. Provisional: a gesture's preparation lasts a
 *   few tenths of a second and reaching time grows with distance (Fitts 1954).
 * - {@link motionHumanTiming.aimed}: a movement that must stop on a
 *   target of a given width lasts `a + b lg A + c W` for an amplitude `A` in
 *   millimetres and a width `W`, the two-factor model McIntosh, Mon-Williams
 *   and Tresilian (2018, J. Exp. Psychol. Hum. Percept. Perform. 44:1022, table
 *   1) fitted to reach-to-grasp times, with a = -306.07 ms, b = 297.27 ms per
 *   decade and c = 0.65 ms per millimetre (r^2 = 0.97). Amplitudes below the
 *   study's shortest (170 mm) take its value, since the fit is not valid
 *   there.
 *
 * {@link motionHumanTiming.of} chooses: a place that is solid and has a
 * width is aimed at, any other is travelled to.
 */
export namespace IAutoMovieMotionHumanTiming {
  /** A named length of a pause or of a short phase. */
  export type Pause = (readonly ["none", "brief", "beat", "long"])[number];

  /** A movement whose time follows from how far it goes. */
  export interface ITravel {
    /** Metres travelled. */
    distance: number;

    /**
     * The width of the target the movement stops on, metres; a free movement
     * when absent.
     */
    width?: number;
  }

  /**
   * The length of a phase on one of three rungs: a named pause or a travel, a
   * pause with a scale in [0.5, 1.5], or explicit seconds with their source.
   */
  export type Span =
    | IAutoMovieMotionHumanTiming.Pause
    | IAutoMovieMotionHumanTiming.ITravel
    | {
        /** The pause scaled. */
        pause: IAutoMovieMotionHumanTiming.Pause;

        /** The factor, in [0.5, 1.5]. */
        scale: number;
      }
    | {
        /** The seconds. */
        seconds: number;

        /** A citation, or `provisional: <capture case name>`. */
        source: string;
      };

  /** The lengths of a phrase's phases, each by its role. */
  export interface IRoles {
    /** The preparation, from `start` to `ready`. */
    prepare: IAutoMovieMotionHumanTiming.Span;

    /** The wait before the stroke; none when absent. */
    wait?: IAutoMovieMotionHumanTiming.Span;

    /** The stroke up to its decisive instant. */
    attack: IAutoMovieMotionHumanTiming.Span;

    /** The stroke after it; none when absent. */
    follow?: IAutoMovieMotionHumanTiming.Span;

    /** The hold after the stroke; none when absent. */
    hold?: IAutoMovieMotionHumanTiming.Span;

    /** The retraction, from `relax` to `end`. */
    retract: IAutoMovieMotionHumanTiming.Span;
  }

  /**
   * The time of a movement to a place, by the rule the place asks for. Input
   * place of motionHumanTiming.of. Whether the place is solid, and its
   * width when it has one.
   */
  export type IOfPlace = {
    /**
     * Whether the target is a physical contact, selecting contact timing rather
     * than a free-space pause.
     */
    solid: boolean;
    /**
     * Target width in metres when known; omitted uses the timing law's
     * unmeasured-target case.
     */
    width?: number | undefined;
  };
}
