import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Setting a held prop down at a place and letting go.
 *
 * The goal is the prop's resting frame, not the hand: the author names where
 * the prop's origin goes (and optionally its heading), and the hand is placed
 * wherever holds the prop there, by the rigid hand-to-prop offset the grip has
 * kept since it closed (the prop's displayed frame and the hand's at the start,
 * so whatever the grasp was, the same grasp lays the prop down). With `on`, the
 * prop is put on a bone of the performer's own body instead, at its frame on
 * that bone as the body stands at the start, and is worn there from `placed`
 * (`IAutoMovieMotionHumanActionPlan.wears`). With `onto`, it is set on another
 * prop's socket, its own socket laid on it, and rides that socket from `placed`
 * as the other prop's articulations pose it
 * (`IAutoMovieMotionHumanActionPlan.mounts`): an arrow nocked on a bow's
 * string, drawn back with it. A prop is put down as it rested: its resting
 * rotation is the one it was declared with, turned about the vertical to the
 * asked heading, so a bottle carried at a tilt still lands upright. The arm
 * keeps the configuration it carried the prop in
 * (`IAutoMovieHumanLimbGoal.reference`). Inverse kinematics solves the arm; the
 * rest of the body holds the posture it was entered in.
 *
 * Phases: a transport of the hand to the placing frame, timed by the
 * reach-to-grasp movement time over the travel
 * ({@link IAutoMovieMotionHumanPickUp} gives the model: about 0.5 s for a 0.4 m
 * travel), its last 0.05 m straight down so the prop lands rather than slides
 * (provisional setback); the release, the fingers opening flat over 0.2 s
 * (provisional) as the grip ends, which leaves the prop where it was placed;
 * and the hand's return to where the arm hangs, rising the same 0.05 m first,
 * over another movement time.
 *
 * Events: `placed` transfers the prop from the grip to its resting frame.
 * `release` marks the end of finger opening. A placing frame beyond the arm's
 * reach is refused, as is a placement without a destination.
 */
export namespace IAutoMovieMotionHumanPutDown {
  /** Parameters. */
  export interface IParams {
    /** The held prop's subject id. */
    prop: string;

    /**
     * Where the prop's origin goes, world metres; required unless `on` or
     * `onto` is given.
     */
    to?: IAutoMovieVector3;

    /**
     * The bone of the performer's own body the prop is put on, worn there from
     * `placed` with its frame `offset` in the bone's posed frame (a hat on the
     * head, a pistol in a hip holster); set down at `at` when absent.
     */
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
     * The prop's heading about +Y at rest, degrees; its current heading when
     * absent.
     */
    yaw?: number;

    /**
     * The prop's whole resting attitude at `at`, a world unit quaternion,
     * instead of its declared rest rotation turned to `yaw`: a card laid face
     * up after it was dealt face down, or turned into a fan. Read only with
     * `at`; `yaw` is ignored when it is given. The hand keeps its grip, so an
     * attitude the wrist cannot reach is refused as any placement beyond the
     * arm is.
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
