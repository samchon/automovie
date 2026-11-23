import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanRise } from "../everyday/IAutoMovieMotionHumanRise";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { AutoMovieMotionHumanChannel } from "./AutoMovieMotionHumanChannel";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * What the body behind the arm does so a hand reaches a region its arm
 * alone does not: the shoulder girdle lifted and a rise onto the toes for a
 * region above the shoulder, then a lean from the hips for what is still
 * beyond the arm.
 *
 * A person reaching up to a taller person's face, or to a shelf, lifts the
 * shoulder with the arm (the scapula turns up as the arm is raised, Inman,
 * Saunders and Abbott 1944) and then raises the heels, because leaning
 * forward lowers the shoulder and takes it away from a place above it. Each
 * moves by the least angle that brings the wrist within the kept share of
 * the arm, and no further than the shoulder needs to come level with the
 * wrist or than its limit (`GIRDLE`, `RAISE`). What remains is leaned into
 * (`AutoMovieMotionHumanLeanInto`), which refuses a region still out of
 * reach at its limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation feet: Both feet as they stand flat, when the body stands on them alone and may rise onto its toes; no rise when absent. share: The share of the arm's length (upper arm and forearm) the wrist is kept within. wrist: The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres.
 * @evidence contracts/development/design.md#principled-representation feet: Both feet as they stand flat, when the body stands on them alone and may rise onto its toes; no rise when absent. share: The share of the arm's length (upper arm and forearm) the wrist is kept within. wrist: The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTouchStance.ts (AutoMovieMotionHumanTouchStance.solve, props); compose/AutoMovieMotionHumanTouchStance.ts (AutoMovieMotionHumanTouchStance.solve, return); touch/touch.ts (touch.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanRise.Stance, AutoMovieHumanSide, IAutoMovieVector3, IAutoMovieHumanLimbGoal identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTouchStance {
  /**
   * What a stance is solved from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and the meaning of its absence.
   * @evidence contracts/development/design.md#principled-representation The body, the posture it stands in, the feet it may rise on, the arm, the share of its length kept and the wrist's goal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `solve` reads the stance inputs and shares the arm's goal with the lean.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The feet are optional because a seated or carried body has none to rise on; the refusal's words are the caller's.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the body stands in before it rises or leans. */
    standing: IAutoMovieMotionHumanPosture;

    /**
     * Adds shoulder-girdle assistance to the input posture before the stance lifts the working shoulder or raises the heels. The reach envelope supplies `share` in [0, 1], and stance preparation uses full assistance at 1. When absent, the stance uses the input posture directly.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the input posture, the dimensionless share, the order of application and the default when absent.
     */
    girdles?: (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
    ) => IAutoMovieMotionHumanPosture;

    /** Both feet as they stand flat, when the body stands on them alone and may rise onto its toes; no rise when absent. */
    feet?: IAutoMovieMotionHumanRise.Stance;

    /** Whether the lean balances its hips (`IAutoMovieMotionHumanLeanInto.IProps.balance`); absent or false, no centre of mass is computed. */
    balance?: boolean;

    /** The wrist uses one anchored target for all stroke progress and the lean is keyed from the reached stance. */
    fixed?: boolean;

    /**
     * The current ankle frames when the base's adjustment step moves them during the stroke.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Reads both ankle points and rotations from the current posture during heel lift.
     */
    placements?: (
      posture: IAutoMovieMotionHumanPosture,
    ) => IAutoMovieMotionHumanRise.Stance;

    /**
     * The heel rise's share when a step has to finish before its foot rolls onto the toes.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Takes action-local seconds and returns the dimensionless share multiplying the rise angle.
     */
    heels?: (clock: IAutoMovieMotionClock, seconds: number) => number;

    /** The working hand. */
    side: AutoMovieHumanSide;

    /** The share of the arm's length (upper arm and forearm) the wrist is kept within. */
    share: number;

    /**
     * The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the arguments, a posture and the stroke progress in [0, 1], and the wrist goal returned in world metres.
     */
    wrist: (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ) => IAutoMovieVector3;

    /**
     * The working arm's goal on a posture at the stroke's start, laid on its region, so the lean's balance weighs the arm where it reaches (`IAutoMovieMotionHumanLeanInto.IProps.arm`); the arm as the posture holds it when absent.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the goal returned, who reads it and the default.
     */
    arm?: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieHumanLimbGoal;

    /**
     * The refusal's message for a wrist left `beyond` metres out of reach at a lean of `limit` degrees.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the two arguments, the metres out of reach and the lean limit in degrees, and that the returned message is the refusal's words.
     */
    refuse: (beyond: number, limit: number) => string;

    /** A world point, metres, the trunk turns toward before it rises and leans: the middle of two hands' regions lying off to one side of the shoulders, so both arms reach from the side they lie on; no turn asked when absent. */
    faces?: IAutoMovieVector3;
  }

  /**
   * A solved stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds and its unit.
   * @evidence contracts/development/design.md#principled-representation The girdle and heel angles, whether the trunk leans, the posture at the full rise and the primitives that perform them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members; the touch law reads the lean, the risen and the reached postures and the primitives, and its tests the two angles.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The primitives are built on the caller's clock, so the body moves on the hand's envelope.
   */
  export interface IStance {
    /** The working shoulder girdle's elevation at the region, degrees; 0 when it stays down. */
    girdle: number;

    /** The heels' raise at the region, degrees; 0 when the body does not rise. */
    raise: number;

    /** Whether the trunk leans from the hips at some progress of the stroke. */
    leaning: boolean;

    /** The standing posture with the girdle lifted by `girdle` and risen by `raise`, before any lean: the posture the stroke is entered from. */
    risen: IAutoMovieMotionHumanPosture;

    /** The risen posture leaned as far as the stroke's start asks: the posture the arm reaches its region from, which the arm's hint and reference are solved on. Solved on `risen` alone, a region only the lean brings within reach straightened the elbow, where the split of the arm's twist between the upper arm and the forearm is left undetermined. */
    reached: IAutoMovieMotionHumanPosture;

    /**
     * The primitives that rise and lean by `ready`, follow the stroke and come back from `relax`: none when the arm reaches as it stands.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the clock it is built on and the primitives returned, none when the arm reaches as it stands.
     */
    primitives: (
      clock: IAutoMovieMotionClock,
      correction?: ICorrection,
    ) => IAutoMovieMotionHumanPrimitive[];
  }

  /**
   * An admitted balance correction written after the stance and before the reaching arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The stance declares the channel and runs the writer on its current posture before the arm reaches.
   * @evidence contracts/development/design.md#principled-representation The channel identifies the changed component. The writer accepts the existing primitive time and posture arguments.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The touch prepares the correction and the stance incorporates it in its writer. The arm reads the resulting pose.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The canonical primitive writer signature preserves resolution inputs without retaining sampled poses.
   */
  export interface ICorrection {
    /** The body channel the correction changes. */
    channel: AutoMovieMotionHumanChannel;

    /** The event-windowed posture correction. */
    write: IAutoMovieMotionHumanPrimitive["write"];
  }
}
