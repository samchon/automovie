import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanStrikingAdvance } from "./IAutoMovieMotionHumanStrikingAdvance";
import type { IAutoMovieMotionHumanStrikingBlade } from "./IAutoMovieMotionHumanStrikingBlade";
import type { IAutoMovieMotionHumanStrikingHeld } from "./IAutoMovieMotionHumanStrikingHeld";

/**
 * Blade work with the blade as the effector: the cut on the eight lines, and
 * what every blade action shares. `HumanSwordThrust` holds the thrust,
 * `HumanSwordGuard` the guards and `HumanSwordParry` the parry.
 *
 * The blade is a prop the hand already holds (`HumanObject.prop` of a sword,
 * then `pickUp` by its grip); the law reads its point and edge from the prop's
 * `point` and `edge` affordances as the hand holds them and aims those. With no
 * blade named the hand itself is aimed, and with no target a place at the
 * blade's reach ahead stands in, so every action also plays as a solo drill.
 *
 * Cuts are named by the side they come from (Meyer's cutting diagram, 1570:
 * descending, rising, horizontal and vertical lines; decision 8). `HumanBlade`
 * names rows of these in a tradition's words.
 *
 * A cut or a thrust that a parry is to meet is declared `parried`: it stops
 * short of its target at its decisive instant, where the parry's blade meets
 * it. The outcome is the author's, never the geometry's.
 *
 * The attack is planned on the target as it stands at the start, and its
 * landing then follows a target that moves, as a punch's does: each film
 * frame's change of the target's predicted place at contact is superposed on
 * the landing one correction latency later (`HumanSwordFollow`).
 *
 * Timing of every blade attack (`HumanSword.SPEED`, `HumanSwordTiming`): the
 * hand moves each path as one minimum-jerk unit, lasting 1.875 times the path
 * over the point's peak speed. The thrust's point peaks at 2.6 m/s at novice to
 * 3.2 m/s at elite (Chen et al. 2017); the cut's edge peaks at 6 to 10 m/s
 * (provisional, under the 9.89 m/s of a knife slash, Bleetman et al. 2003). The
 * performer's `speed` skill reads between them, so a thrust of 0.8 m takes 0.47
 * s at elite and 0.58 s at novice. The setting and the return take the recovery
 * skill's factor, 1.4 at novice to 1.0 at elite; `manner.pace` stretches the
 * whole clock. A parry's travel is timed the same.
 *
 * First pass: a body does not stop the blade; binds, winds and redirection are
 * not planned; every pose constant is provisional, from the treatises'
 * figures.
 */
export namespace IAutoMovieMotionHumanSword {
  /** What every blade action takes. */
  export interface IWield {
    /** The held blade's prop subject id; the bare hand when absent. */
    blade?: string;

    /** The hand that holds it; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /**
     * How many hands are on the grip; 2 for a blade whose grip declares a
     * two-hand grasp, else 1.
     */
    hands?: 1 | 2;

    /**
     * The affordance ids of the held thing's working point and of its edge, for
     * an implement that is no blade (a bat's `barrel`, a racket's `face`, a
     * club's `head`); `point` and `edge` when absent.
     */
    tip?: string;

    /** See `tip`. */
    edge?: string;

    /**
     * How it is performed: a tempo that stretches the clock; at its neutral the
     * clock is the law's own.
     */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Where a cut comes from, as the performer sees it: `forehand` is the blade
   * hand's side.
   */
  export type Line =
    | "above"
    | "aboveForehand"
    | "forehand"
    | "belowForehand"
    | "below"
    | "belowBackhand"
    | "backhand"
    | "aboveBackhand";

  /**
   * A direction or a place by its parts: away from the midline on the blade
   * hand's side, up, and forward.
   */
  export interface IParts {
    /** Toward the blade hand's side. */
    out: number;

    /** Up. */
    up: number;

    /** Forward. */
    forward: number;
  }

  /** Parameters of a cut or a thrust. */
  export interface IAttack extends IAutoMovieMotionHumanSword.IWield {
    /** What it is aimed at; a place at the blade's reach ahead when absent. */
    target?: IAutoMovieMotionTarget;

    /**
     * How the body goes with it; when absent, the least of none, a step and a
     * lunge that brings the target inside the arm.
     */
    advance?: IAutoMovieMotionHumanStrikingAdvance.Advance;

    /**
     * Whether it lands or is stopped short for a parry to meet; `lands` when
     * absent.
     */
    outcome?: "lands" | "parried";

    /**
     * A feint: the share of the stroke shown before it is withdrawn, in (0, 1);
     * it then neither lands nor is parried.
     */
    feint?: number;

    /**
     * Whether the parry that meets a `parried` attack takes its blade: the
     * attack then ends where it was stopped, not back in its entry hold, for
     * the parry to carry it aside and a following action to hold it there;
     * false when absent.
     */
    taken?: boolean;
  }

  /** Parameters of a cut. */
  export interface ICut extends IAutoMovieMotionHumanSword.IAttack {
    /** Where the cut comes from; `above` when absent. */
    from?: IAutoMovieMotionHumanSword.Line;
  }

  /** The performer's axes and the held blade, read once per plan. */
  export interface ISetup {
    /** The held blade in the hand's frame. */
    tool: IAutoMovieMotionHumanStrikingHeld.ITool;

    /** Where the other hand holds the grip, or null for one hand. */
    support: IAutoMovieMotionHumanStrikingBlade.ISupport | null;

    /** The upper arm and the forearm together, metres. */
    arm: number;

    /** The blade hand's shoulder joint at the entry, world metres. */
    shoulder: IAutoMovieVector3;

    /**
     * A direction by its parts as a world vector, about a heading in degrees;
     * the entry's heading when absent.
     */
    world: (
      parts: IAutoMovieMotionHumanSword.IParts,
      yaw?: number,
    ) => IAutoMovieVector3;

    /**
     * A quantity between its novice and elite values at the performer's speed
     * skill.
     */
    skill: (pair: readonly [number, number]) => number;
  }

  /** What an attack's target and advance give its geometry. */
  export interface IAim {
    /** The point aimed at, world metres. */
    target: IAutoMovieVector3;

    /** The horizontal unit line from the root to the target. */
    line: IAutoMovieVector3;

    /** That line's heading, degrees. */
    yaw: number;

    /** The advance taken. */
    advance: IAutoMovieMotionHumanStrikingAdvance.Advance;

    /**
     * How far it carries the leading foot, metres: the least of its travel that
     * brings the target within reach.
     */
    travel: number;

    /** The blade hand's shoulder at the decisive instant, world metres. */
    reach: IAutoMovieVector3;

    /** The body as the advance leaves it at the decisive instant. */
    posture: IAutoMovieMotionHumanPosture;
  }
}
