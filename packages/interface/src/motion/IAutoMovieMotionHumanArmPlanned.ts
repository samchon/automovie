import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanArmTrajectory } from "./IAutoMovieMotionHumanArmTrajectory";
import type { IAutoMovieMotionHumanArmAngles } from "./IAutoMovieMotionHumanArmAngles";
import type { IAutoMovieMotionHumanArmCarry } from "./IAutoMovieMotionHumanArmCarry";

/**
 * An arm's whole action planned as one trajectory (`HumanArmTrajectory`): its
 * reach from rest, its hold on the goal's site and its return, read off the
 * posture so far and solved once, alone or with the other arm of the same
 * span.
 */
export namespace IAutoMovieMotionHumanArmPlanned {
  /**
   * The instants of an action an arm is planned over, seconds since the
   * action's start.
   */
  export interface ISpan {
    /** The arm leaves its rest. */
    start: number;

    /** The hand is on its site. */
    ready: number;

    /**
     * The hand leaves its site; `end` itself for a hand that stays on it to the
     * end.
     */
    relax: number;

    /**
     * The arm is back at rest, or, for a hand that stays on its site, the span
     * ends with it there.
     */
    end: number;

    /**
     * Instants within the span that carry a pose constraint (a touch, a contact
     * event), seconds since the action's start; each is a waypoint of the
     * course, so the hand meets its goal there exactly, not by the
     * interpolation between two waypoints. None when absent.
     */
    knots?: number[];
  }

  /**
   * Arms moved over one span as one trajectory problem: each carry that names
   * the group joins it, and the first to be written solves it for all.
   */
  export interface ITogether {
    /** The carries of the group, in the order they joined. */
    carries: IAutoMovieMotionHumanArmCarry.ICarry[];

    /**
     * Each arm's trajectory, once solved, with its hand's finger state as the
     * plan plays it.
     */
    solved?: Map<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Played>;

    /**
     * Whether the group is being solved, so a member asked during the solve is
     * refused instead of solved twice.
     */
    solving?: boolean;

    /**
     * The refusal the group's solve ended in, kept as the solution is: every
     * later read of a member throws it again, so a problem no trajectory meets
     * is solved once, not again at each read.
     */
    refused?: Error;

    /**
     * The solutions an earlier plan of this same action reached (`last` of that
     * plan's group), by the arms solved together (`IWarm`'s key): given by
     * whoever plans the action again, each is the first start of the matching
     * solve. Absent, every solve starts from its course.
     */
    warm?: ReadonlyMap<string, IWarm>;

    /**
     * The solutions this plan's optimiser reached, by the arms solved together,
     * written as each is solved: what a replan of the same action hands to its
     * group's `warm`. A problem whose laid course was admitted is not optimised
     * and writes none.
     */
    last?: Map<string, IWarm>;

    /**
     * The group's place among the groups its action's plan makes, from 0, in
     * the order the law makes them, which a replan of the same law repeats: it
     * keys the group's handover with its arms, so two groups of one action that
     * move the same arms (two strokes) do not read each other's solutions.
     * Absent for a group made outside an action's plan.
     */
    ordinal?: number;

    /**
     * Whether the group's span is its law's own, which a replan at a slower
     * tempo lengthens (`HumanPerformanceTempo`); unset for a span an end of
     * which another performer or a cue fixes (a meeting). Only such a span is
     * handed back for a longer one before an optimisation
     * (`HumanArmTrajectory.solve`).
     */
    stretches?: boolean;

    /**
     * The elapsed-time multiplier applied by the action's explicit replan:
     * above 1 the arm takes longer (`HumanPerformanceTempo` replans an action
     * into the time its motion needs); 1 when absent. A production does not set
     * it.
     */
    tempo?: number;
  }

  /** One arm of `planned`: the carry's own members, and the arm it returns to. */
  export interface IPlanned extends Pick<
    IAutoMovieMotionHumanArmCarry.ICarry,
    | "side"
    | "rest"
    | "goal"
    | "perceived"
    | "weight"
    | "rests"
    | "grasp"
    | "skinDistance"
    | "disc"
    | "on"
    | "span"
    | "hold"
  > {
    /**
     * The arm at the end of the span, where it returns to another arm than it
     * left; `rest` when absent.
     */
    back?: IAutoMovieMotionHumanArmAngles.IAngles;
  }

  /**
   * An optimised arm trajectory as plan data, handed from one plan of an action
   * to the next plan of the same action (an alignment trial and its placement,
   * a replan over a longer span). Its key in a group's `warm` and `last` is the
   * sides of the arms solved together, in the group's order, joined by `+`
   * (`right`, `left+right`).
   */
  export interface IWarm {
    /** The span the solution was reached on. */
    span: IAutoMovieMotionHumanArmPlanned.ISpan;

    /** The solver's state (`HumanArmTrajectory.ISolved.state`). */
    state: IAutoMovieMotionHumanArmTrajectory.IState;
  }
}
