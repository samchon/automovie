import type {
  IAutoMovieClassifyPlaybackBoundary,
  IAutoMovieInspectionDiagnostics,
  IAutoMoviePlacedContinuity,
  IAutoMoviePlaybackTimeline,
  IAutoMovieRigidTransform,
  IAutoMovieSequence,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { Object3D } from "three";

import type { IObserveAutoMoviePlacedScene } from "./IObserveAutoMoviePlacedScene.js";

/**
 * A production's declared support, grip, custody and continuity obligations,
 * from which `selectAutoMoviePlacedChecks` selects the checks active at one
 * placed sample.
 *
 * Every window is half-open on the film clock: it owns its `from` second and
 * not its `to` second, so at a transfer, a foot roll, a release or a handoff
 * the incoming declaration owns the boundary instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the film clock, the half-open ownership of every boundary and what each declaration supplies.
 * @evidence contracts/development/design.md#principled-representation Expectations come from the producer's own staging: phase anchors in support-local metres, expected grips in hand-local frames, holder schedules and shot-local tracks. Observations stay the displayed scene graph.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the declarations and the sample clock enter. The observer measures them, and Engine owns the limits and the timeline mapping.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No declaration is inferred from proximity, receipts or physical control, and no window is extended past its end.
 */
export namespace ISelectAutoMoviePlacedChecks {
  /**
   * The sample and the production's declarations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the sample clock, the output rate used for the previous output frame and each declaration list.
   * @evidence contracts/development/design.md#principled-representation The sample time and the output rate define the evaluated pair. Lists stay separate by relation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A production passes the placed sample's scene and time and its own declarations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No previous visit or cached history is part of the input, so forward and reverse queries are identical.
   */
  export interface IProps {
    /** The settled scene of the placed sample. Holders are found beneath it. */
    readonly scene: Object3D;

    /** Clock of the placed sample. */
    readonly time: IAutoMovieInspectionDiagnostics.ITime;

    /** Output frames per second; the previous output frame is one step earlier. */
    readonly fps: number;

    /** Declared supports, such as a planted foot on a floor or a moving deck. */
    readonly supports?: readonly ISupport[];

    /** Declared grips of a held prop. */
    readonly grips?: readonly IGrip[];

    /** Declared holder schedules of props that change hands. */
    readonly custody?: readonly ICustody[];

    /** Declared continuous tracks evaluated through the film's cut. */
    readonly continuity?: IContinuity;
  }

  /**
   * Identity shared by every declaration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the report key, delivery requirement, source path, entity paths and optional received evidence.
   * @evidence contracts/development/design.md#principled-representation The same fields form the observer's check envelope.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Nothing beyond the envelope is required.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Received evidence is optional and only supplements a measurement.
   */
  export interface IRule {
    /** Stable identity of the rule across samples. */
    readonly key: string;

    /** Whether delivery requires this obligation to be checked. */
    readonly required: boolean;

    /** Source path of the declaration, prefixed to every violation path. */
    readonly path: string;

    /** Entity paths reported with every finding. */
    readonly paths?: readonly string[];

    /** Actual touching evidence for the declared pair at a film second, when the producer has it. */
    readonly contact?: (
      filmSeconds: number,
    ) => IObserveAutoMoviePlacedScene.ICheck["observedContact"];
  }

  /**
   * A support held through consecutive phases.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines limits in metres and the phase list.
   * @evidence contracts/development/design.md#principled-representation A rolling or transferring contact is a sequence of phases, each with its own socket, support and anchor.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The limits are the observer's support limits.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Outside every phase the support is released and unchecked.
   */
  export interface ISupport extends IRule {
    /** Maximum absolute gap along the support normal, metres. */
    readonly maxGap: number;

    /** Maximum distance from the anchor along the support plane, metres. */
    readonly maxSlip: number;

    /** Non-overlapping phases. The earliest listed phase containing the instant applies. */
    readonly phases: readonly ISupportPhase[];
  }

  /**
   * One half-open support phase.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the clock, the observed socket, the support frame and the anchor.
   * @evidence contracts/development/design.md#principled-representation The socket origin is the contacting point and the anchor is fixed in the support's frame, so a moving support carries its target.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Matches the observer's native support sample.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The anchor is authored, never the observed point.
   */
  export interface ISupportPhase {
    /** First owned film second. */
    readonly from: number;

    /** First film second after the phase. */
    readonly to: number;

    /** Displayed socket whose origin is the contacting point. */
    readonly socket: Object3D;

    /** Displayed support whose local positive Y points away from its surface. */
    readonly support: Object3D;

    /** Expected point in support-local metres. */
    readonly anchor: IAutoMovieVector3;
  }

  /**
   * A grip held through consecutive windows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines limits in metres and radians and the window list.
   * @evidence contracts/development/design.md#principled-representation Each window binds one hand socket, prop and expected relative frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The limits are the observer's grip limits.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Outside every window the prop is not held by this rule.
   */
  export interface IGrip extends IRule {
    /** Maximum position separation in the hand's frame, metres. */
    readonly maxDistance: number;

    /** Maximum orientation separation, radians in [0, π]. */
    readonly maxAngle: number;

    /** Non-overlapping windows. The earliest listed window containing the instant applies. */
    readonly windows: readonly IGripWindow[];
  }

  /**
   * One half-open grip window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the clock, the two displayed frames and the expected relation.
   * @evidence contracts/development/design.md#principled-representation The expected frame may follow authored in-hand motion as a function of film time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Matches the observer's native grip sample.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The expected frame is authored, never the observed one.
   */
  export interface IGripWindow {
    /** First owned film second. */
    readonly from: number;

    /** First film second after the window. */
    readonly to: number;

    /** Displayed grip socket. */
    readonly hand: Object3D;

    /** Displayed held prop. */
    readonly prop: Object3D;

    /** Expected prop frame relative to the hand, constant or at a film second. */
    readonly expected:
      | IAutoMovieRigidTransform
      | ((filmSeconds: number) => IAutoMovieRigidTransform);
  }

  /**
   * A prop's holder schedule, observed through the displayed scene graph.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the holder names, the schedule clock and how the actual holder is read.
   * @evidence contracts/development/design.md#principled-representation The actual holder is the nearest ancestor of the prop among the declared holders, or null when none carries it; the schedule gives the allowed holder.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Feeds the observer's custody check.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Before the first entry no custody is declared, and proximity never names a holder.
   */
  export interface ICustody extends IRule {
    /** The prop whose holder is checked. */
    readonly prop: Object3D;

    /** Declared holders by stable name, each the node that carries the prop. */
    readonly holders: Readonly<Record<string, Object3D>>;

    /** Holder changes; each entry owns film time from its second until the next entry. Null declares a free prop. */
    readonly schedule: readonly {
      readonly from: number;
      readonly holder: string | null;
    }[];
  }

  /**
   * Continuous tracks evaluated across the film's cut.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the cut, its layout, the declared breaks and the tracks.
   * @evidence contracts/development/design.md#principled-representation Boundaries come from the canonical cut, so trims, retimes, transitions and seams follow the playback mapping.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the cut and layout it already plays.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No frame index, boundary or break is assumed.
   */
  export interface IContinuity {
    /** The film's cut, already admitted by `cutSequence`. */
    readonly sequence: IAutoMovieSequence;

    /** Layout of `sequence` from `sequenceTimeline`. */
    readonly timeline: IAutoMoviePlaybackTimeline;

    /** Deliberate breaks in authored takes. */
    readonly discontinuities?: IAutoMovieClassifyPlaybackBoundary.IProps["discontinuities"];

    /** Tracks to check. */
    readonly tracks: readonly ITrack[];
  }

  /**
   * One entity track on its shot clocks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the observation function, the three answers it can give and rate limits per source second.
   * @evidence contracts/development/design.md#principled-representation Limits are rates on the shot clock, so a retimed entry keeps the same allowed motion per source second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The track is evaluated by the producer's own pure evaluation, without seeking the scene.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absence, a missing required record and an unknown answer stay distinct.
   */
  export interface ITrack extends IRule {
    /**
     * The entity's authored world transform at a shot-local second: a present
     * or missing required record, null when the shot does not involve the
     * entity, or undefined when it cannot be determined.
     */
    readonly observe: (
      shot: string,
      seconds: number,
    ) =>
      | Exclude<
          Extract<
            IAutoMoviePlacedContinuity.IProps,
            { kind: "transform" }
          >["observation"],
          undefined
        >
      | null
      | undefined;

    /** Maximum speed in metres per shot-local second. Omit to leave displacement unbounded. */
    readonly maxSpeed?: number;

    /** Maximum angular speed in radians per shot-local second. Omit to leave rotation unbounded. */
    readonly maxAngularSpeed?: number;

    /** Allowance added to each limit, in metres and radians. */
    readonly tolerance?: { readonly distance: number; readonly angle: number };
  }
}
