/**
 * Crossing on an anchored rope: climbing it hand over hand with a foot lock,
 * descending it in a rappel or a fast-rope slide, traversing a horizontal
 * rope hanging or in a monkey crawl, and swinging on it to a named landing.
 * Register `HumanRope.rope` to use it.
 *
 * The rope is a fixed prop's `bar` affordance, a taut line between its two
 * ends: upright for a climb, a descent or a swing, whose upper end is the
 * anchor, and level for a traverse. Every hand and foot contact lies on that
 * line. A rope too short for the request, or a descent faster than its
 * bound, is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four crossings, the rope's representation and the refusals.
 * @evidence contracts/development/design.md#principled-representation A discriminated union on kind; each names the rope prop and line and the few controls its crossing takes, in metres and metres per second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registered vocabulary entry; planRope in motions is the only consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The line's ends and length come from the prop.
 */
export namespace IAutoMovieMotionHumanRope {
  /**
   * How a descent holds the rope: a rappel brakes with one hand, the feet
   * locked; a fast-rope slides with both hands and the feet on the rope.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both styles.
   * @evidence contracts/development/design.md#principled-representation A closed choice of technique.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the descent.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted values are declared here directly.
   */
  export type Descent = "rappel" | "fastRope";

  /**
   * How a traverse hangs: from the hands alone, or with the legs hooked over
   * the rope, a monkey crawl.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both styles.
   * @evidence contracts/development/design.md#principled-representation A closed choice of which limbs bear.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the traverse.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted values are declared here directly.
   */
  export type Traverse = "hang" | "monkey";

  /**
   * Climb an upright rope hand over hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and unit.
   * @evidence contracts/development/design.md#principled-representation The rope and the rise of the hands, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the climb reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The rope's length bounds the rise at runtime.
   */
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

  /**
   * Descend an upright rope to the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, unit and default.
   * @evidence contracts/development/design.md#principled-representation The rope, the technique and the speed bound, metres per second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the descent reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The descent's speed is held to the bound.
   */
  export interface IDescend {
    /** Discriminant: a rope descent. */
    kind: "descend";

    /** Subject of the fixed rope prop. */
    rope: string;

    /** Id of its upright `bar` affordance. */
    line: string;

    /** The technique; `rappel` when absent. */
    style?: Descent;

    /** The fastest the hands may move down the rope, metres per second; 1 when absent. A move takes the larger of one beat (0.6 s, `ropeSupport.BEAT`) and twice the 0.45 arm length step (`ropeSupport.STEP`) over this speed: a faster bound than the beat allows changes nothing, a slower one stretches the descent. A controlled descent, not a slide. */
    speed?: number;
  }

  /**
   * Cross a level rope hand over hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, unit and default.
   * @evidence contracts/development/design.md#principled-representation The rope, the distance along it, metres, and the hang.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the traverse reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The rope's ends bound the distance at runtime.
   */
  export interface ITraverseRope {
    /** Discriminant: a rope traverse. */
    kind: "traverse";

    /** Subject of the fixed rope prop. */
    rope: string;

    /** Id of its level `bar` affordance. */
    line: string;

    /** How far the hands travel along the rope, metres; positive toward its positive axis. */
    along: number;

    /** The hang; `hang` when absent. */
    style?: Traverse;
  }

  /**
   * Swing on an upright rope from its anchor and let go onto a landing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The rope and the named level surface to land on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the swing reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The release follows from the pendulum and the landing; an unreachable landing is refused.
   */
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

  /**
   * Parameters: one of the four rope crossings.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; planRope owns the geometry and speed refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the variants and the admission owners.
   * @evidence contracts/development/design.md#principled-representation A closed discriminated union on kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The variants planRope dispatches on.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are separated by kind rather than optional fields.
   */
  export type IParams = IClimb | IDescend | ITraverseRope | ISwing;
}
