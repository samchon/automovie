import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanRise } from "../everyday/IAutoMovieMotionHumanRise";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
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
   * @evidence contracts/development/design.md#minimal-and-owned-surface Eight members, all read by `solve`; the arm's goal only passes to the lean.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The feet are optional because a seated or carried body has none to rise on; the refusal's words are the caller's.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the body stands in before it rises or leans. */
    standing: IAutoMovieMotionHumanPosture;

    /** Both feet as they stand flat, when the body stands on them alone and may rise onto its toes; no rise when absent. */
    feet?: IAutoMovieMotionHumanRise.Stance;

    /** The working hand. */
    side: AutoMovieHumanSide;

    /** The share of the arm's length (upper arm and forearm) the wrist is kept within. */
    share: number;

    /**
     * The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the arguments, a posture and the stroke progress in [0, 1], and the wrist goal returned in world metres.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    wrist: (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ) => IAutoMovieVector3;

    /**
     * How deep the body's trunk and legs on a posture pass into the people about it, metres (0 when clear), so a rise's shift over the forefoot keeps out of a partner standing close; no one is about when absent.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the depth returned and its unit, who reads it and the default.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    clear?: (posture: IAutoMovieMotionHumanPosture) => number;

    /**
     * The working arm's goal on a posture at the stroke's start, laid on its region, so the lean's balance weighs the arm where it reaches (`IAutoMovieMotionHumanLeanInto.IProps.arm`); the arm as the posture holds it when absent.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the goal returned, who reads it and the default.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    arm?: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieHumanLimbGoal;

    /**
     * The refusal's message for a wrist left `beyond` metres out of reach at a lean of `limit` degrees.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the two arguments, the metres out of reach and the lean limit in degrees, and that the returned message is the refusal's words.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    refuse: (beyond: number, limit: number) => string;
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

    /** How long the hips' shift over the forefoot leads the heels' rise, and trails their return, seconds; 0 when the body does not rise. The stroke's clock names its end `poised` and its return's start `unpoised`. */
    poise: number;

    /** The least seconds the heels' rise takes from the shifted stance, so the extrapolated centre of mass stays over the forefoot as the rise carries the body on over the toes; 0 when the body does not rise. The stroke's approach lasts at least this. */
    rising: number;

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
     * @evidence contracts/development/implementation.md#principled-implementation solve's implementation composes the original girdle/rise movement and balanced lean, then lowers to the original actual raised-foot goals so plants remain on their feet.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The no-rise branch returns the existing lean primitive; otherwise one current-body writer precedes the original optional rise-leg primitives.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original clock envelope, heel/girdle angles, lean progress, foot geometry, plant order and raw lowering remain; no contact point or solved pose is substituted.
     * @evidence contracts/development/implementation.md#efficient-algorithms Emits at most three original primitives; each active write retains original current motion/foot/lowering cost while lending current FK metadata to actual lean and pelvis observations. Speedup is unmeasured.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed solved angles and foot frames belong to the plan; an optional current-person FK source is borrowed only by that synchronous write, never stored as a cached pose or root result.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns props, original fixed foot/angle/lean metadata and at most three callbacks until release. Per-write FK loans release on return or throw and no returned posture retains them.
     */
    primitives: (
      clock: IAutoMovieMotionClock,
    ) => IAutoMovieMotionHumanPrimitive[];
  }
}
