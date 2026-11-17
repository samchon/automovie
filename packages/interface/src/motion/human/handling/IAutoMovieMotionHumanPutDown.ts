import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * Setting a held prop down at a place and letting go.
 *
 * The goal is the prop's resting frame, not the hand: the author names
 * where the prop's origin goes (and optionally its heading), and the hand is
 * placed wherever holds the prop there, by the rigid hand-to-prop offset the
 * grip has kept since it closed (the prop's displayed frame and the hand's at
 * the start, so whatever the grasp was, the same grasp lays the prop down).
 * With `on`, the prop is put on a bone of the performer's own body instead,
 * at its frame on that bone as the body stands at the start, and is worn
 * there from `placed` (`IAutoMovieMotionHumanActionPlan.wears`). With `onto`, it is set on
 * another prop's socket, its own socket laid on it, and rides that socket
 * from `placed` as the other prop's articulations pose it
 * (`IAutoMovieMotionHumanActionPlan.mounts`): an arrow nocked on a bow's string, drawn
 * back with it. A prop is put down as it
 * rested: its resting rotation is the one it was
 * declared with, turned about the vertical to the asked heading, so a bottle
 * carried at a tilt still lands upright. The arm keeps the configuration it
 * carried the prop in (`IAutoMovieHumanLimbGoal.reference`). Inverse kinematics solves the arm; the rest of the body holds the posture
 * it was entered in.
 *
 * Phases: a transport of the hand to the placing frame, timed by the
 * reach-to-grasp movement time over the travel (`HumanPrehension`), its last
 * 0.05 m straight down so the prop lands rather than slides (provisional
 * setback); the release, the fingers opening flat over 0.2 s (provisional) as
 * the grip ends, which leaves the prop where it was placed; and the hand's
 * return to where the arm hangs, rising the same 0.05 m first, over another
 * movement time.
 *
 * Events: `placed` when the prop reaches its frame, `release` when the grip
 * ends. The hand grips the prop until `release` (until `placed` when it is
 * put on a bone, which wears it from there). A placing frame beyond the
 * arm's reach is refused, as is a put down that names neither `at` nor `on`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation at: Where the prop's origin goes, world metres; required unless `on` or `onto` is given. on: The bone of the performer's own body the prop is put on, worn there from `placed` with its frame `offset` in the bone's posed frame (a hat on the head, a pistol in a hip holster); set down at `at` when absent. offset: The prop's frame in the bone's posed frame, metres.
 * @evidence contracts/development/design.md#principled-representation at: Where the prop's origin goes, world metres; required unless `on` or `onto` is given. on: The bone of the performer's own body the prop is put on, worn there from `placed` with its frame `offset` in the bone's posed frame (a hat on the head, a pistol in a hip holster); set down at `at` when absent. offset: The prop's frame in the bone's posed frame, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainMutual.ts (HumanChainMutual.putDown, params); handling/putDown.ts (putDown.plan, context); handling/putDown.ts (putDown.demands, ahead); handling/putDownTarget.ts (putDownTarget.of, context); handling/putDown.ts (putDown.plan); handling/putDownTarget.ts (putDownTarget.of).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, AutoMovieHumanoidBone, IAutoMovieRigidTransform, AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPutDown {
  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation at: Where the prop's origin goes, world metres; required unless `on` or `onto` is given. on: The bone of the performer's own body the prop is put on, worn there from `placed` with its frame `offset` in the bone's posed frame (a hat on the head, a pistol in a hip holster); set down at `at` when absent. offset: The prop's frame in the bone's posed frame, metres.
   * @evidence contracts/development/design.md#principled-representation at: Where the prop's origin goes, world metres; required unless `on` or `onto` is given. on: The bone of the performer's own body the prop is put on, worn there from `placed` with its frame `offset` in the bone's posed frame (a hat on the head, a pistol in a hip holster); set down at `at` when absent. offset: The prop's frame in the bone's posed frame, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainMutual.ts (HumanChainMutual.putDown, params); handling/putDown.ts (putDown.plan, context); handling/putDown.ts (putDown.demands, ahead); handling/putDownTarget.ts (putDownTarget.of, context); handling/putDown.ts (putDown.plan); handling/putDownTarget.ts (putDownTarget.of).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, AutoMovieHumanoidBone, IAutoMovieRigidTransform, AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IParams {
    /** The held prop's subject id. */
    prop: string;

    /** Where the prop's origin goes, world metres; required unless `on` or `onto` is given. */
    at?: IAutoMovieVector3;

    /** The bone of the performer's own body the prop is put on, worn there from `placed` with its frame `offset` in the bone's posed frame (a hat on the head, a pistol in a hip holster); set down at `at` when absent. */
    on?: {
      /** The bone. */
      bone: AutoMovieHumanoidBone;

      /** The prop's frame in the bone's posed frame, metres. */
      offset: IAutoMovieRigidTransform;
    };

    /**
     * The other prop's socket the prop is set on, riding it from `placed`
     * as that prop's articulations pose it (an arrow nocked by its `nock` on
     * a bow's string, drawn back with it, `IAutoMovieMotionHumanActionPlan.mounts`): the
     * prop's own socket `via` laid on the other's `point`, the prop's origin
     * when `via` is absent.
     */
    onto?: {
      /** Scene subject id of the receiving support prop. */
      prop: string;
      /** Affordance id on that prop where the held object is placed. */
      point: string;
      /** Affordance id of the HELD prop's own socket placed on the receiving prop's point; omission mounts the held prop by its origin. */
      via?: string;
    };

    /** The prop's heading about +Y at rest, degrees; its current heading when absent. */
    yaw?: number;

    /** The holding hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }
}
