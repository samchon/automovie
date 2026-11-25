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
 */
export namespace ISelectAutoMoviePlacedChecks {
  /** The sample and the production's declarations. */
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

  /** Identity shared by every declaration. */
  export interface IRule {
    /** Stable identity of the rule across samples. */
    readonly key: string;

    /** Whether delivery requires this obligation to be checked. */
    readonly required: boolean;

    /** Source path of the declaration, prefixed to every violation path. */
    readonly path: string;

    /** Entity paths reported with every finding. */
    readonly paths?: readonly string[];

    /**
     * Actual touching evidence for the declared pair at a film second, when the
     * producer has it.
     */
    readonly contact?: (
      filmSeconds: number,
    ) => IObserveAutoMoviePlacedScene.ICheck["observedContact"];
  }

  /** A support held through consecutive phases. */
  export interface ISupport extends IRule {
    /** Maximum absolute gap along the support normal, metres. */
    readonly maxGap: number;

    /** Maximum distance from the anchor along the support plane, metres. */
    readonly maxSlip: number;

    /**
     * Non-overlapping phases. The earliest listed phase containing the instant
     * applies.
     */
    readonly phases: readonly ISupportPhase[];
  }

  /** One half-open support phase. */
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

  /** A grip held through consecutive windows. */
  export interface IGrip extends IRule {
    /** Maximum position separation in the hand's frame, metres. */
    readonly maxDistance: number;

    /** Maximum orientation separation, radians in [0, π]. */
    readonly maxAngle: number;

    /**
     * Non-overlapping windows. The earliest listed window containing the
     * instant applies.
     */
    readonly windows: readonly IGripWindow[];
  }

  /** One half-open grip window. */
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

  /** A prop's holder schedule, observed through the displayed scene graph. */
  export interface ICustody extends IRule {
    /** The prop whose holder is checked. */
    readonly prop: Object3D;

    /** Declared holders by stable name, each the node that carries the prop. */
    readonly holders: Readonly<Record<string, Object3D>>;

    /**
     * Holder changes; each entry owns film time from its second until the next
     * entry. Null declares a free prop.
     */
    readonly schedule: readonly {
      readonly from: number;
      readonly holder: string | null;
    }[];
  }

  /** Continuous tracks evaluated across the film's cut. */
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

  /** One entity track on its shot clocks. */
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

    /**
     * Maximum speed in metres per shot-local second. Omit to leave displacement
     * unbounded.
     */
    readonly maxSpeed?: number;

    /**
     * Maximum angular speed in radians per shot-local second. Omit to leave
     * rotation unbounded.
     */
    readonly maxAngularSpeed?: number;

    /** Allowance added to each limit, in metres and radians. */
    readonly tolerance?: { readonly distance: number; readonly angle: number };
  }
}
