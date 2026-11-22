import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanStrikingAdvance } from "../striking/IAutoMovieMotionHumanStrikingAdvance";
import type { IAutoMovieMotionHumanStrikingBlade } from "../striking/IAutoMovieMotionHumanStrikingBlade";
import type { IAutoMovieMotionHumanStrikingHeld } from "../striking/IAutoMovieMotionHumanStrikingHeld";

/**
 * Blade work with the blade as the effector: the cut on the eight lines,
 * and what every blade action shares. `HumanSwordThrust` holds the thrust,
 * `HumanSwordGuard` the guards and `HumanSwordParry` the parry.
 *
 * The blade is a prop the hand already holds (`HumanObject.prop` of a sword,
 * then `pickUp` by its grip); the law reads its point and edge from the
 * prop's `point` and `edge` affordances as the hand holds them and aims
 * those. With no blade named the hand itself is aimed, and with no target a
 * place at the blade's reach ahead stands in, so every action also plays as a
 * solo drill.
 *
 * Cuts are named by the side they come from (Meyer's cutting diagram, 1570:
 * descending, rising, horizontal and vertical lines; #3202, decision 8).
 * `HumanBlade` names rows of these in a tradition's words.
 *
 * A cut or a thrust that a parry is to meet is declared `parried`: it stops
 * short of its target at its decisive instant, where the parry's blade meets
 * it. The outcome is the author's, never the geometry's.
 *
 * The attack is planned on the target as it stands at the start, and its
 * landing then follows a target that moves, as a punch's does: each film
 * frame's change of the target's predicted place at contact is superposed
 * on the landing one correction latency later (`HumanSwordFollow`).
 *
 * First pass: a body does not stop the blade; binds, winds and redirection
 * are not planned; every pose constant is provisional, from the treatises'
 * figures.
 *
 * @evidence contracts/development/common.md#meaningful-documentation blade: The held blade's prop subject id; the bare hand when absent. hand: The hand that holds it; `right` when absent. tip: The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent.
 * @evidence contracts/development/design.md#principled-representation blade: The held blade's prop subject id; the bare hand when absent. hand: The hand that holds it; `right` when absent. tip: The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSword.ts (HumanSword.setup, context); lexicon/HumanSword.ts (HumanSword.setup, return); lexicon/HumanSword.ts (HumanSword.aim, s); lexicon/HumanSwordParry.ts (HumanSwordParry.meet, s); lexicon/HumanSword.ts (HumanSword.setup, parts); lexicon/HumanSword.ts (HumanSword.aim, place).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, IAutoMovieMotionManner, IAutoMovieMotionTarget, IAutoMovieMotionHumanStrikingAdvance.Advance, IAutoMovieMotionHumanStrikingHeld.ITool, IAutoMovieMotionHumanStrikingBlade.ISupport identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSword {
  /**
   * What every blade action takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation blade: The held blade's prop subject id; the bare hand when absent. hand: The hand that holds it; `right` when absent. tip: The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent.
   * @evidence contracts/development/design.md#principled-representation blade: The held blade's prop subject id; the bare hand when absent. hand: The hand that holds it; `right` when absent. tip: The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSword.ts (HumanSword.setup, context); lexicon/HumanSword.ts (HumanSword.setup).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IWield {
    /** The held blade's prop subject id; the bare hand when absent. */
    blade?: string;

    /** The hand that holds it; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1. */
    hands?: 1 | 2;

    /** The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent. */
    tip?: string;

    /** See `tip`. */
    edge?: string;

    /** How it is performed: a tempo that stretches the clock; at its neutral the clock is the law's own (#3549). */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Where a cut comes from, as the performer sees it: `forehand` is the blade hand's side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Where a cut comes from, as the performer sees it: `forehand` is the blade hand's side.
   * @evidence contracts/development/design.md#principled-representation Closed choices "above", "aboveForehand", "forehand", "belowForehand", "below", "belowBackhand", "backhand", "aboveBackhand" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSword.ts (HumanSword.LINES).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanSword.LINES.
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
   * A direction or a place by its parts: away from the midline on the blade hand's side, up, and forward.
   *
   * @evidence contracts/development/common.md#meaningful-documentation out: Toward the blade hand's side. up: Up. forward: Forward.
   * @evidence contracts/development/design.md#principled-representation out: Toward the blade hand's side. up: Up. forward: Forward.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSword.ts (HumanSword.setup, parts); lexicon/HumanSword.ts (HumanSword.aim, place); lexicon/HumanSwordGuard.ts (HumanSwordGuard.GUARDS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanSword.setup.
   */
  export interface IParts {
    /** Toward the blade hand's side. */
    out: number;

    /** Up. */
    up: number;

    /** Forward. */
    forward: number;
  }

  /**
   * Parameters of a cut or a thrust.
   *
   * @evidence contracts/development/common.md#meaningful-documentation target: What it is aimed at; a place at the blade's reach ahead when absent. advance: How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm. outcome: Whether it lands or is stopped short for a parry to meet; `lands` when absent.
   * @evidence contracts/development/design.md#principled-representation target: What it is aimed at; a place at the blade's reach ahead when absent. advance: How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm. outcome: Whether it lands or is stopped short for a parry to meet; `lands` when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSword.ts (HumanSword.aim, context); lexicon/HumanSword.ts (HumanSword.stopped, params); lexicon/HumanSwordThrust.ts (HumanSwordThrust.thrust, context); lexicon/HumanSwordTiming.ts (HumanSwordTiming.timed, context); lexicon/HumanSword.ts (HumanSword.aim); lexicon/HumanSwordThrust.ts (HumanSwordThrust.thrust).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanStrikingAdvance.Advance identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IAttack extends IAutoMovieMotionHumanSword.IWield {
    /** What it is aimed at; a place at the blade's reach ahead when absent. */
    target?: IAutoMovieMotionTarget;

    /** How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm. */
    advance?: IAutoMovieMotionHumanStrikingAdvance.Advance;

    /** Whether it lands or is stopped short for a parry to meet; `lands` when absent. */
    outcome?: "lands" | "parried";

    /** A feint: the share of the stroke shown before it is withdrawn, in (0, 1); it then neither lands nor is parried.
     * Exclusive minimum: 0. Exclusive maximum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    feint?: number;
  }

  /**
   * Parameters of a cut.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: Where the cut comes from; `above` when absent.
   * @evidence contracts/development/design.md#principled-representation from: Where the cut comes from; `above` when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSword.ts (HumanSword.cut, context); lexicon/HumanSword.ts (HumanSword.cut).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSword.Line identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ICut extends IAutoMovieMotionHumanSword.IAttack {
    /** Where the cut comes from; `above` when absent. */
    from?: IAutoMovieMotionHumanSword.Line;
  }

  /**
   * The performer's axes and the held blade, read once per plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation support: Where the other hand holds the grip, or null for one hand. arm: The upper arm and the forearm together, metres. shoulder: The blade hand's shoulder joint at the entry, world metres.
   * @evidence contracts/development/design.md#principled-representation support: Where the other hand holds the grip, or null for one hand. arm: The upper arm and the forearm together, metres. shoulder: The blade hand's shoulder joint at the entry, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSword.ts (HumanSword.setup, return); lexicon/HumanSword.ts (HumanSword.aim, s); lexicon/HumanSwordParry.ts (HumanSwordParry.meet, s); lexicon/HumanSword.ts (HumanSword.cut); lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard); lexicon/HumanSwordParry.ts (HumanSwordParry.parry).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanStrikingHeld.ITool, IAutoMovieMotionHumanStrikingBlade.ISupport, IAutoMovieVector3, IAutoMovieMotionHumanSword.IParts identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
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
     * A direction by its parts as a world vector, about a heading in degrees; the entry's heading when absent.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSword.ISetup.world: A direction by its parts as a world vector, about a heading in degrees; the entry's heading when absent.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSword.ISetup.world is used through packages/motions/src/lexicon/HumanSword.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSword.ISetup.world is used through packages/motions/src/lexicon/HumanSword.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSword.ISetup.world is used through packages/motions/src/lexicon/HumanSword.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSword.ISetup.world is used through packages/motions/src/lexicon/HumanSword.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSword.ISetup.world is used through packages/motions/src/lexicon/HumanSword.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSword.ISetup.world is used through packages/motions/src/lexicon/HumanSword.ts.
     */
    world: (
      parts: IAutoMovieMotionHumanSword.IParts,
      yaw?: number,
    ) => IAutoMovieVector3;

    /**
     * A quantity between its novice and elite values at the performer's speed skill.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSword.ISetup.skill: A quantity between its novice and elite values at the performer's speed skill.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSword.ISetup.skill is used through packages/motions/src/lexicon/HumanSword.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSword.ISetup.skill is used through packages/motions/src/lexicon/HumanSword.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSword.ISetup.skill is used through packages/motions/src/lexicon/HumanSword.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSword.ISetup.skill is used through packages/motions/src/lexicon/HumanSword.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSword.ISetup.skill is used through packages/motions/src/lexicon/HumanSword.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSword.ISetup.skill is used through packages/motions/src/lexicon/HumanSword.ts.
     */
    skill: (pair: readonly [number, number]) => number;
  }

  /**
   * What an attack's target and advance give its geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation target: The point aimed at, world metres. yaw: That line's heading, degrees. travel: How far it carries the leading foot, metres: the least of its travel that brings the target within reach.
   * @evidence contracts/development/design.md#principled-representation target: The point aimed at, world metres. yaw: That line's heading, degrees. travel: How far it carries the leading foot, metres: the least of its travel that brings the target within reach.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSword.ts (HumanSword.aim, return); lexicon/HumanSword.ts (HumanSword.cut); lexicon/HumanSwordThrust.ts (HumanSwordThrust.thrust).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanStrikingAdvance.Advance, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IAim {
    /** The point aimed at, world metres. */
    target: IAutoMovieVector3;

    /** The horizontal unit line from the root to the target. */
    line: IAutoMovieVector3;

    /** That line's heading, degrees. */
    yaw: number;

    /** The advance taken. */
    advance: IAutoMovieMotionHumanStrikingAdvance.Advance;

    /** How far it carries the leading foot, metres: the least of its travel that brings the target within reach. */
    travel: number;

    /** The blade hand's shoulder at the decisive instant, world metres. */
    reach: IAutoMovieVector3;

    /** The body as the advance leaves it at the decisive instant. */
    posture: IAutoMovieMotionHumanPosture;
  }
}
