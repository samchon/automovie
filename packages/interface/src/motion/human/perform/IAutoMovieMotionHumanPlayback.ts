import type { IAutoMovieMotionPlayback } from "../../IAutoMovieMotionPlayback";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanResolveHumanPosture } from "../posture/IAutoMovieMotionHumanResolveHumanPosture";

/**
 * Native human playback phases and the scope in which they can supply the same
 * action authoring or leaf fit. Placement, physical checks, composition and the
 * public action posture reader keep their own contracts.
 */
export interface IAutoMovieMotionHumanPlayback {
  /**
   * Posture phases feed ordinary composition. Bare posture phases need
   * isolation. Fitted phases additionally require a complete native read
   * without a nearby continuation. Prior segment incumbents stay in scope.
   */
  readonly mode: "posture" | "bare-posture" | "fitted";

  /**
   * Closed intervals in the declared order. The first covering phase owns a
   * shared second.
   */
  readonly phases: readonly IAutoMovieMotionHumanPlayback.IPhase[];

  /** Optional owned setup after placement, contacts and flight are final. */
  readonly prepare?: () => void;
}

/** Phase ranges and samples consumed by a human display leaf. */
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

    /**
     * Transfer the genuine fit to the same unchanged, complete bare leaf at
     * most once.
     */
    readonly takeFit?: () =>
      | IAutoMovieMotionHumanResolveHumanPosture.ISeeded
      | undefined;
  }
}
