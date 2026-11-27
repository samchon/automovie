import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanStrikingAdvance } from "./IAutoMovieMotionHumanStrikingAdvance";
import type { IAutoMovieMotionHumanStrikingHeld } from "./IAutoMovieMotionHumanStrikingHeld";

/**
 * The stroke of a held tool, shared by every blade and firearm action: the tool
 * is taken from where the hand holds it to a ready pose, carried along a path
 * to its decisive pose, kept there and returned, while the feet stay or the
 * leading foot steps or lunges under it.
 *
 * The action states only tool poses (hand frames built by
 * {@link StrikingHeld.hand}); this owns the time course and the body. The clock
 * is a phrase with the standard instants: the tool leaves the entry hold for
 * the ready pose by `ready`, runs its path from `strokeStart`, is at its
 * decisive pose at `stroke`, follows through to `strokeEnd`, stays until
 * `relax` and is back in the entry hold at `end`, or stays where the stroke
 * left it for an action that ends in its pose (a guard, a levelled aim).
 *
 * An advance carries the body with the stroke: the leading foot leaves the
 * floor at `strokeStart` and lands at `stroke`, the pelvis travels a share of
 * the foot's travel and sinks until both legs reach their feet, and the foot
 * and the pelvis come back from `relax` to `end` (`StrikingAdvance`).
 */
export namespace IAutoMovieMotionHumanStrikingBlade {
  /** The other hand's hold on a tool held in both hands. */
  export interface ISupport {
    /**
     * Its grip socket from the first hand's, metres: `x` along the tool's axis,
     * `y` along its edge, `z` along their cross product.
     */
    offset: IAutoMovieVector3;

    /**
     * Which of the tool's directions the handle it wraps runs along: a sword's
     * grip runs along the blade's axis, a pistol's along its sights' side.
     */
    handle: "axis" | "edge";
  }

  /** Plan a stroke. * A stroke. */
  export interface IStroke {
    /** The tool. */
    tool: IAutoMovieMotionHumanStrikingHeld.ITool;

    /** The clock, a phrase with the standard instants. */
    clock: IAutoMovieMotionClock;

    /**
     * The tool's pose along the stroke.
     *
     * @param progress 0 at the ready pose, 1 at the decisive pose, more than 1
     *   through the follow-through.
     * @param seconds Seconds since the action's start, for a path that follows
     *   something moving (an aim kept on a walking target); a path of a stroke
     *   ignores it.
     * @returns The hand's grip frame, world.
     */
    path(
      progress: number,
      seconds: number,
    ): IAutoMovieMotionHumanStrikingHeld.IHandFrame;

    /**
     * The point of the tool that must stay on its path where the wrist cannot
     * turn as asked, metres behind the working point.
     */
    back: number;

    /**
     * A displacement added to the path's hand point at a second since the
     * action's start, world metres: the landing's following of a target that
     * moves after the stroke is planned, or a blade carried aside by a parry
     * and the taken blade carried with it. The arm's reference at the decisive
     * pose is planned on the path alone, so two strokes that follow each other
     * never wait on each other's plan. None when absent.
     *
     * @param seconds Seconds since the action's start.
     * @returns The displacement, world metres.
     */
    follow?(seconds: number): IAutoMovieVector3;

    /** Where the other hand holds the tool, or null when one hand holds it. */
    support: IAutoMovieMotionHumanStrikingBlade.ISupport | null;

    /** The instant that is the action's decisive one; `stroke` when absent. */
    decisive?: string;

    /** How the body goes with it. */
    advance: IAutoMovieMotionHumanStrikingAdvance.Advance;

    /**
     * How far the advance carries the leading foot, metres; the advance's full
     * travel (`StrikingAdvance.travel`) when absent.
     */
    travel?: number;

    /** The horizontal unit line an advance travels. */
    line: IAutoMovieVector3;

    /**
     * Whether the tool stays in the pose the stroke left it in, instead of
     * returning to the entry hold.
     */
    stay: boolean;

    /**
     * The share of the path a stopped stroke is arrested at, in (0, 1]; 1 when
     * the stroke runs its path.
     */
    stop: number;

    /**
     * The trunk's twist while the tool is on its path, degrees, positive toward
     * the performer's left: a shouldered long gun turns the support shoulder
     * forward. 0 when absent.
     */
    turn?: number;

    /**
     * Whether the stroke starts from the pose the previous action holds, so the
     * holding arm keeps that action's elbow hint and reference (the entry
     * posture's goal) instead of solving its own; false when absent.
     */
    kept?: boolean;
  }
}
