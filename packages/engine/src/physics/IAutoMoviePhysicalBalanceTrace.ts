import type {
  IAutoMoviePhysicalBalance,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One observation the balance controller records while it advances, for tests
 * and diagnostics to read (`advancePhysicalBalance`, `trackPhysicalRoot`): a
 * phase's event, or the assessment, a swing or the root's stance demand at a
 * substep. World metres, seconds and newtons; a horizontal point keeps its x
 * and z. It is recorded only into a trace the caller passes; it never feeds
 * back into the controller.
 */
export type IAutoMoviePhysicalBalanceTrace =
  | IAutoMoviePhysicalBalanceTrace.ITrigger
  | IAutoMoviePhysicalBalanceTrace.ILift
  | IAutoMoviePhysicalBalanceTrace.ILanded
  | IAutoMoviePhysicalBalanceTrace.IEnded
  | IAutoMoviePhysicalBalanceTrace.IAssess
  | IAutoMoviePhysicalBalanceTrace.ISwing
  | IAutoMoviePhysicalBalanceTrace.IRoot;

/** The kinds of {@link IAutoMoviePhysicalBalanceTrace}. */
export namespace IAutoMoviePhysicalBalanceTrace {
  /** A horizontal point or vector. */
  export interface IPoint {
    /** Its x, metres. */
    x: number;
    /** Its z, metres. */
    z: number;
  }

  /** A recovery triggered; stepping is the prepared span's (`preparePhysicalDisturbanceSpan`). */
  export interface ITrigger {
    /** The kind. */
    kind: "trigger";
    /** The substep's local seconds. */
    seconds: number;
    /** The stepping limb's endpoint bone, or the first gait step's. */
    bone: string;
    /** The capture point. */
    capture: IPoint;
    /** How far the capture point is past the shrunken support, if measured. */
    beyond?: number;
    /** Since when the capture point has been outside, local seconds. */
    since?: number;
    /** The step's target for the footprint's middle. */
    target: IPoint;
    /** The step's time, seconds, if the step set one. */
    duration?: number;
    /** Whether the step captures. */
    viable: boolean;
    /** Whether the trunk's tilt asked for the step. */
    tipping: boolean;
    /** The last commanded centre of pressure, if any. */
    pressure?: IPoint;
  }

  /** A step's limb lifted as its step began, in the prepared span. */
  export interface ILift {
    /** The kind. */
    kind: "lift";
    /** The substep's local seconds. */
    seconds: number;
    /** The limb. */
    bone: string;
    /** Its low-passed measured load at lift-off, newtons. */
    load: number;
    /** Its bearing share at lift-off. */
    bearing: number;
  }

  /** A swinging limb landed, in the prepared span. */
  export interface ILanded {
    /** The kind. */
    kind: "landed";
    /** The substep's local seconds. */
    seconds: number;
    /** The limb. */
    bone: string;
    /** Whether it touched down before its swing's end. */
    early: boolean;
    /** Its endpoint where it landed. */
    position: IAutoMovieVector3;
  }

  /**
   * Steps under way ended without a landing: the landing timed out, or
   * authored motion took an endpoint back
   * (`physicalBalanceHandoff`).
   */
  export interface IEnded {
    /** The kind. */
    kind: "failed" | "cancelled";
    /** The substep's local seconds. */
    seconds: number;
    /** The limbs whose steps ended. */
    bones: string[];
  }

  /** The plan's assessment at a substep (`physicalBalancePlan`). */
  export interface IAssess {
    /** The kind. */
    kind: "assess";
    /** The substep's local seconds. */
    seconds: number;
    /** The capture point. */
    capture: IPoint;
    /** The capture point's shift for the body's rotation. */
    spin: IPoint;
    /** How far the capture point is past the shrunken support, if measured. */
    beyond?: number;
    /** How far it is past the support itself. */
    outside: number;
    /** Whether it is past the support by more than the margin and the hip's reach. */
    past: boolean;
    /** The assessment's state. */
    state: IAutoMoviePhysicalBalance.IResult["state"];
    /** Since when the capture point has been outside, local seconds. */
    since?: number;
    /** Whether the trunk's tilt asks for a step. */
    tipping: boolean;
    /** The trunk's tilt from its planned attitude, radians. */
    tilt: number;
    /** A landed foot's bearing share while it ramps in, if one does. */
    landing?: number;
    /** The step the assessment chose, if any. */
    step?: { bone: string; viable: boolean };
  }

  /** A lifted limb's swing at a substep (`physicalBalanceSwing`). */
  export interface ISwing {
    /** The kind. */
    kind: "swing";
    /** The substep's local seconds. */
    seconds: number;
    /** The limb. */
    bone: string;
    /** The share of the swing's time passed. */
    progress: number;
    /** The swing's time, seconds. */
    duration: number;
    /** The clearance its stance can carry. */
    rise: number;
    /** How much further its lowest point hangs than when planted. */
    hang: number;
    /** The endpoint's goal. */
    goal: IAutoMovieVector3;
    /** The endpoint's actual place. */
    at: IAutoMovieVector3;
    /** The goal's velocity, metres per second. */
    goalVelocity: IAutoMovieVector3;
    /** The endpoint's actual velocity, metres per second. */
    velocity: IAutoMovieVector3;
    /** The path's feed-forward force at the endpoint. */
    force: IAutoMovieVector3;
  }

  /** The stance's demand on the supports at a substep (`trackPhysicalRoot`). */
  export interface IRoot {
    /** The kind. */
    kind: "root";
    /** The substep's local seconds. */
    seconds: number;
    /** The body's centre of mass. */
    center: IAutoMovieVector3;
    /** The capture point. */
    capture: IPoint;
    /** The commanded centre of pressure. */
    pressure: IPoint;
    /** The pendulum's pivot. */
    pivot: IPoint;
    /** Whether the command was clamped to the support. */
    clamped: boolean;
    /** The force asked of the supports. */
    force: IAutoMovieVector3;
    /** The moment asked of the supports about the root's centre of mass, N m. */
    torque: IAutoMovieVector3;
  }
}
