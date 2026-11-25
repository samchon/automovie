import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionPlayback } from "../../IAutoMovieMotionPlayback";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanRefusal } from "../law/IAutoMovieMotionHumanRefusal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanResolveHumanPosture } from "../posture/IAutoMovieMotionHumanResolveHumanPosture";
import type { IAutoMovieMotionHumanSegment } from "./IAutoMovieMotionHumanSegment";

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

  /** Optional setup from this action's completed, displayed segment. */
  readonly preparePlaced?: (
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
  ) => IAutoMovieMotionHumanPlayback.Placed | undefined;
}

/** Phase ranges and samples consumed by a human display leaf. */
export namespace IAutoMovieMotionHumanPlayback {
  /**
   * A plan's own copy of its native playback (`HumanPreparedPlayback.attach`):
   * the body and the posture reader it was authored for, the reader placement
   * installed over it and where that placement stands, and whether its
   * event-dependent setup has run.
   */
  export interface IBinding {
    /**
     * The body every phase was authored for, kept as the caller passed it: a
     * read by another body reads none of them. Only its identity is read.
     */
    readonly body: Pick<IAutoMovieMotionHumanBody, "skeleton">;

    /** The phases, copied when attached. */
    readonly source: IAutoMovieMotionHumanPlayback;

    /** The plan's posture reader the phases stand for. */
    readonly original: IAutoMovieMotionHumanActionPlan["posture"];

    /** The reader placement installed over `original`; absent until placed. */
    located?: IAutoMovieMotionHumanActionPlan["posture"];

    /** Where placement put the plan, for a located refusal. */
    where?: IAutoMovieMotionHumanRefusal.IWhere;

    /**
     * Whether the phases may be read: from the start for phases without setup,
     * and once the performance prepared them for the others.
     */
    ready: boolean;

    /** A prepared writer of joints already in their displayed frame. */
    placed?: Placed;
  }

  /** Append the native result after ordinary display projection. */
  export type Placed = (
    localSeconds: number,
    pose: IAutoMoviePose,
    demanded?: ReadonlySet<AutoMovieHumanoidBone>,
  ) => IAutoMoviePose;

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
