/**
 * Crossing on an anchored rope: climbing it hand over hand with a foot lock,
 * descending it in a rappel or a fast-rope slide, traversing a horizontal rope
 * hanging or in a monkey crawl, and swinging on it to a named landing. Register
 * `HumanRope.rope` to use it.
 *
 * The rope is a fixed prop's `bar` affordance, a taut line between its two
 * ends: upright for a climb, a descent or a swing, whose upper end is the
 * anchor, and level for a traverse. Every hand and foot contact lies on that
 * line. A rope too short for the request, or a descent faster than its bound,
 * is refused.
 */
export namespace IAutoMovieMotionHumanRope {
  /**
   * How a descent holds the rope: a rappel brakes with one hand, the feet
   * locked; a fast-rope slides with both hands and the feet on the rope.
   */
  export type Descent = "rappel" | "fastRope";

  /**
   * How a traverse hangs: from the hands alone, or with the legs hooked over
   * the rope, a monkey crawl.
   */
  export type Traverse = "hang" | "monkey";

  /** Climb an upright rope hand over hand. */
  export interface IClimb {
    /** Discriminant: a rope climb. */
    kind: "climb";

    /** Subject of the fixed rope prop. */
    rope: string;

    /** Id of its upright `bar` affordance. */
    line: string;

    /** How far the hands rise, metres. */
    rise: number;
  }

  /** Descend an upright rope to the floor. */
  export interface IDescend {
    /** Discriminant: a rope descent. */
    kind: "descend";

    /** Subject of the fixed rope prop. */
    rope: string;

    /** Id of its upright `bar` affordance. */
    line: string;

    /** The technique; `rappel` when absent. */
    style?: Descent;

    /**
     * The fastest the hands may move down the rope, metres per second; 1 when
     * absent. A move takes the larger of one beat (0.6 s, `ropeSupport.BEAT`)
     * and twice the 0.45 arm length step (`ropeSupport.STEP`) over this speed:
     * a faster bound than the beat allows changes nothing, a slower one
     * stretches the descent. A controlled descent, not a slide.
     */
    speed?: number;
  }

  /** Cross a level rope hand over hand. */
  export interface ITraverseRope {
    /** Discriminant: a rope traverse. */
    kind: "traverse";

    /** Subject of the fixed rope prop. */
    rope: string;

    /** Id of its level `bar` affordance. */
    line: string;

    /**
     * How far the hands travel along the rope, metres; positive toward its
     * positive axis.
     */
    along: number;

    /** The hang; `hang` when absent. */
    style?: Traverse;
  }

  /** Swing on an upright rope from its anchor and let go onto a landing. */
  export interface ISwing {
    /** Discriminant: a rope swing. */
    kind: "swing";

    /** Subject of the fixed rope prop. */
    rope: string;

    /** Id of its upright `bar` affordance. */
    line: string;

    /** Subject of the fixed prop landed on. */
    landing: string;

    /** Id of its level `surface` affordance. */
    surface: string;
  }

  /** Parameters: one of the four rope crossings. */
  export type IParams = IClimb | IDescend | ITraverseRope | ISwing;
}
