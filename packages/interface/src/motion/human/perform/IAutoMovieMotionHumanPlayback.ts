import type { IAutoMovieMotionPlayback } from "../../IAutoMovieMotionPlayback";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanResolveHumanPosture } from "../posture/IAutoMovieMotionHumanResolveHumanPosture";

/**
 * Native human playback phases and the scope in which they can supply the
 * same action authoring or leaf fit. Placement, physical checks, composition
 * and the public action posture reader keep their own contracts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States phase admission and the optional setup after final placement.
 * @evidence contracts/development/design.md#principled-representation The action's own ordered windows delimit evaluated branches. The requested posture and optional fit use the existing human motion records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Native laws issue only their phase evaluators and the display checks scope before using them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No stance, impulse or exact contact is inferred from a finite phase, and an unevaluated phase does not replace the authored callback.
 */
export interface IAutoMovieMotionHumanPlayback {
  /**
   * Posture phases feed ordinary composition. Bare posture phases need
   * isolation. Fitted phases additionally require a complete native read
   * without a nearby continuation. Prior segment incumbents stay in scope.
   */
  readonly mode: "posture" | "bare-posture" | "fitted";

  /** Closed intervals in the declared order. The first covering phase owns a shared second. */
  readonly phases: readonly IAutoMovieMotionHumanPlayback.IPhase[];

  /** Optional owned setup after placement, contacts and flight are final. */
  readonly prepare?: () => void;
}

/**
 * The native human phase and the result the same leaf can consume.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the action-local windows and the single-use fit handoff.
 * @evidence contracts/development/design.md#principled-representation The generic time callable carries actual human posture arguments and result. Epoch and endpoint choice remain with the native action's phase schedule.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The consumer observes ordinary posture and takes the same evaluation's fit only when eligible.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No phase claims fitness of altered goal records. Missing admission leaves the normal path available.
 */
export namespace IAutoMovieMotionHumanPlayback {
  /** One closed event interval on the human action's own clock. */
  export interface IPhase extends IAutoMovieMotionPlayback<
    ISample | undefined,
    Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
  > {
    /** Opening event, in action-local seconds. */
    readonly from: number;

    /** Closing event, in action-local seconds. */
    readonly to: number;
  }

  /** Current authored channels and goals and an optional single-use fit. */
  export interface ISample {
    /** Authored posture consumed by the ordinary composition and contact stages. */
    readonly posture: IAutoMovieMotionHumanPosture;

    /** Transfer the genuine fit to the same unchanged, complete bare leaf at most once. */
    readonly takeFit?: () => IAutoMovieMotionHumanResolveHumanPosture.ISeeded | undefined;
  }
}
