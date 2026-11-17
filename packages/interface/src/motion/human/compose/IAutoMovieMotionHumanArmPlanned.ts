import type { IAutoMovieMotionHumanArmTrajectory } from "../posture/IAutoMovieMotionHumanArmTrajectory";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanArmAngles } from "./IAutoMovieMotionHumanArmAngles";
import type { IAutoMovieMotionHumanArmCarry } from "./IAutoMovieMotionHumanArmCarry";

/**
 * An arm's whole action planned as one trajectory (`HumanArmTrajectory`):
 * its reach from rest, its hold on the goal's site and its return, read off
 * the posture so far and solved once, alone or with the other arm of the
 * same span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation back: The arm at the end of the span, where it returns to another arm than it left; `rest` when absent.
 * @evidence contracts/development/design.md#principled-representation back: The arm at the end of the span, where it returns to another arm than it left; `rest` when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanArmFollow.ts (AutoMovieMotionHumanArmFollow.follower, span); compose/AutoMovieMotionHumanArmPlanned.ts (AutoMovieMotionHumanArmPlanned.stated, return); compose/AutoMovieMotionHumanArmPlanned.ts (AutoMovieMotionHumanArmPlanned.planned, span); everyday/gestureHands.ts (gestureHands.planned, span); everyday/sit.ts (sit.plan.span, return); compose/AutoMovieMotionHumanArmPlanned.ts (AutoMovieMotionHumanArmPlanned.together, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanArmCarry.ICarry, IAutoMovieMotionHumanHand.Side, IAutoMovieMotionHumanArmTrajectory.Trajectory, IAutoMovieMotionHumanArmAngles.IAngles identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanArmPlanned {
  /**
   * The instants of an action an arm is planned over, seconds since the
   * action's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each instant's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The reach, the hold and the return are bounded by four instants of the action's clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by `planned`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Seconds, not clock names, so a law without a clock (a gesture) fits.
   */
  export interface ISpan {
    /** The arm leaves its rest. */
    start: number;

    /** The hand is on its site. */
    ready: number;

    /** The hand leaves its site; `end` itself for a hand that stays on it to the end. */
    relax: number;

    /** The arm is back at rest, or, for a hand that stays on its site, the span ends with it there. */
    end: number;
  }

  /**
   * Arms moved over one span as one trajectory problem: each carry that
   * names the group joins it, and the first to be written solves it for all.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States who joins and who solves.
   * @evidence contracts/development/design.md#principled-representation Two arms whose paths are coupled are one problem (Erdmann and Lozano-Pérez 1987), so the group holds them and their one solution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members, the solution and the guard against re-entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The solution is kept so every member reads the same plan.
   */
  export interface ITogether {
    /** The carries of the group, in the order they joined. */
    carries: IAutoMovieMotionHumanArmCarry.ICarry[];

    /** Each arm's trajectory, once solved. */
    solved?: Map<
      IAutoMovieMotionHumanHand.Side,
      IAutoMovieMotionHumanArmTrajectory.Trajectory
    >;

    /** Whether the group is being solved, so a member asked during the solve is refused instead of solved twice. */
    solving?: boolean;
  }

  /**
   * One arm of `planned`: the carry's own members, and the arm it returns to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is taken from the carry and what is added.
   * @evidence contracts/development/design.md#principled-representation An arm's task: its rest, its goal, its weight and its declared contacts, and the arm it ends at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The carry's members `planned` reads, and `back`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The members are the carry's own by `Pick`, not restated.
   */
  export interface IPlanned extends Pick<
    IAutoMovieMotionHumanArmCarry.ICarry,
    | "side"
    | "rest"
    | "goal"
    | "perceived"
    | "weight"
    | "rests"
    | "grasp"
    | "disc"
    | "on"
  > {
    /** The arm at the end of the span, where it returns to another arm than it left; `rest` when absent. */
    back?: IAutoMovieMotionHumanArmAngles.IAngles;
  }
}
