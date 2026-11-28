import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Set down a held prop while preserving the grip until placement.
 *
 * Give a world point with `to` to place the prop's origin within 10 mm of the
 * mark, including when the heading is free. The hand moves to the frame that
 * maintains its rigid offset to the prop. If that grip and arm cannot reach the
 * placement, the action refuses.
 *
 * Use `on` to wear the prop on a performer bone or `onto` to mount it on a
 * named receiver. These attachments begin at `placed`. A socket mount can
 * follow the receiver's articulation.
 *
 * The default carry approaches the mark from above in its last 0.05 m and
 * withdraws upward after release. These setbacks are provisional. The grip ends
 * at `placed` and the fingers finish opening 0.2 s later at `release`.
 */
export namespace IAutoMovieMotionHumanPutDown {
  /** Parameters. */
  export interface IParams {
    /** The held prop's subject id. */
    prop: string;

    /**
     * Target prop origin in world metres. Required when `on` and `onto` are
     * both absent.
     */
    to?: IAutoMovieVector3;

    /** A performer bone and local frame that carry the prop from `placed`. */
    on?: IParamsOn;

    /**
     * The other prop's socket the prop is set on, riding it from `placed` as
     * that prop's articulations pose it (an arrow nocked by its `nock` on a
     * bow's string, drawn back with it,
     * `IAutoMovieMotionHumanActionPlan.mounts`): the prop's own socket `via`
     * laid on the other's `point`, the prop's origin when `via` is absent.
     * Direct placement can follow a rigid receiver driven by an authored track
     * or initially mounted on a tracked carrier. The checked socket has
     * constant horizontal velocity and fixed attitude across the action. The
     * hand follows it through finger opening. At `placed`, the displayed source
     * frame must be within 10 mm and 15 degrees of the receiving frame. A track
     * defers receiver fit to the placement action, whose film clock is known
     * when the action is planned.
     */
    onto?: IParamsOnto;

    /**
     * Rest heading about world +Y in degrees. When absent, the planner tries
     * headings around the currently held orientation to find a reachable fit.
     */
    yaw?: number;

    /**
     * Optional resting attitude for a world-point placement, as a unit
     * quaternion. A supplied `yaw` keeps the quaternion as the fitting target.
     * When `yaw` is absent, the target may turn about +Y to fit the arm. The
     * task checks the origin and a point along the prop's up axis.
     */
    rotation?: IAutoMovieQuaternion;

    /** The holding hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /** The onto object of {@link IParams}. */
  export type IParamsOnto = {
    /** Scene subject id of the receiving support prop. */
    prop: string;
    /** Affordance id on that prop where the held object is placed. */
    point: string;
    /**
     * Affordance id of the HELD prop's own socket placed on the receiving
     * prop's point; omission mounts the held prop by its origin.
     */
    via?: string;
  };

  /** The on object of {@link IParams}. */
  export type IParamsOn = {
    /** The bone. */
    bone: AutoMovieHumanoidBone;

    /** The prop's frame in the bone's posed frame, metres. */
    offset: IAutoMovieRigidTransform;
  };
}
