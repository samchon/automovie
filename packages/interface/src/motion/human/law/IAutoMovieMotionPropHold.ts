import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanGraspUse } from "../handling/IAutoMovieMotionHumanGraspUse";
import type { IAutoMovieMotionPropLaunch } from "./IAutoMovieMotionPropLaunch";

/**
 * A planned hand attachment to a prop beginning at a share of the action's
 * duration. Optional finger joint angles preserve the grip when performance
 * evaluation carries the prop.
 */
export interface IAutoMovieMotionPropHold {
  /** The holding hand. */
  side: AutoMovieHumanSide;

  /** The prop's subject. */
  prop: string;

  /** Share of this action from which the prop is held. */
  from: number;

  /** The staged interception this grip requires. Absent for ordinary holds. */
  capture?: IAutoMovieMotionPropHold.ICapture;

  /** The holding fingers' clinical angles, kept while carried. */
  fingers?: Readonly<
    Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
  >;

  /**
   * The use the grip was chosen for (`pickUp`'s `use`); absent when it was
   * chosen for its reach alone.
   */
  use?: IAutoMovieMotionHumanGraspUse.IUse;
}

/** Records consumed by placed holds and launched prop playback. */
export namespace IAutoMovieMotionPropHold {
  /** The planned interception whose launch becomes this grip. */
  export interface ICapture {
    /** Launch identity in its placed action's publish list. */
    launch: IAutoMovieMotionPropLaunch;

    /**
     * First film second of this bare hand's fitted spherical reception. The
     * receiving hand and fingers belong to that grip through closure and must
     * physically meet the sphere at closure.
     */
    handContactFrom?: number;

    /**
     * Check the displayed world frame at grip closure against the planned
     * interception.
     */
    matches(frame: IAutoMovieRigidTransform): boolean;
  }
}
