import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Leg primitives: a foot kept on the floor, and a foot lifted and set down
 * somewhere else.
 *
 * A foot is a placement of its ankle and its rotation ({@link HumanFoot}),
 * and the leg is an effector goal solved by inverse kinematics. A planted
 * foot declares its toes' joint as the goal's contact, so where the ankle
 * cannot hold the foot flat the heel rises about the ball and the foot does
 * not slide (`HumanFoot.heelOff`). The knee bends over the foot: its hint is
 * ahead of the knee's rest place along the foot's own heading (Perry and
 * Burnfield, Gait Analysis, 2nd ed.).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a foot's placement is, how the leg is solved, what a planted foot declares and where the knee bends.
 * @evidence contracts/development/design.md#principled-representation A leg movement is an ankle placement over time with a flag for bearing on the floor, the two facts a stance and a swing differ by.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One movement (`place`) with named plant/step forms, the swing path with fixed-pair preparation and the goal builder with fixed-placement preparation; the only owner of leg goals built from foot placements. The phrases built on them are AutoMovieMotionHumanLegPhrase's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `HumanFoot.IPlacement` and the posture's goal type; no action name and no fixed body size appears.
 */
export namespace AutoMovieMotionHumanLeg {
  /**
   * A leg side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two sides a leg is on.
   * @evidence contracts/development/design.md#principled-representation The body's bilateral symmetry as a closed union, the form the rig's bone names take.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, used by every function here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A literal union, not a string.
   */
  export type Side = HumanHand.Side;

  /**
   * A foot's placement as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The placement, world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each argument is, when the function is called and the result's frame.
   * @evidence contracts/development/design.md#principled-representation A foot that follows something (a swing path, a pivot about its ball) is a function of the posture so far and the time, evaluated when the row is written.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One function type, taken by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed placement is the constant function, so there is no second form for it.
   */
  export type Frame = (
    posture: IHumanPosture,
    seconds: number,
  ) => HumanFoot.IPlacement;

  /**
   * One leg's movement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its unit.
   * @evidence contracts/development/design.md#principled-representation The span the leg is written over, where the foot is at each second and whether it bears then.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `place`; `plant` and `step` fill them from a clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bearing is a function of seconds, so a foot that lands inside the span needs no second primitive.
   */
  export interface IPlace {
    /** The body. */
    body: IHumanBody;

    /** The leg. */
    side: Side;

    /** Seconds since the action's start from which the leg is written. */
    from: number;

    /** Seconds since the action's start until which the leg is written. */
    to: number;

    /** Where the foot is. */
    placement: Frame;

    /**
     * Whether the foot bears on the floor.
     *
     * @param seconds Seconds since the action's start.
     * @returns `true` while it is planted.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin and what the boolean means.
     * @evidence contracts/development/implementation.md#principled-implementation Bearing is a pure function of the seconds, so a foot that lands or leaves inside the span needs no second primitive.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `place`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The member answers a boolean and no share of bearing, so a foot is either planted or free; the reader applies no tolerance of its own to it.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    planted(seconds: number): boolean;
  }

  /**
   * A foot on its way from one placement to another: the ankle on the
   * straight line between them raised by `4 c s (1 - s)`, a parabola that
   * leaves and lands at the floor and peaks at the clearance `c` half way,
   * and the rotation turned by spherical interpolation.
   *
   * @param from The placement at progress 0.
   * @param to The placement at progress 1.
   * @param clearance The ankle's greatest rise, metres.
   * @param progress How far along, in [0, 1].
   * @returns The placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the path's formula, where it peaks and each input's unit.
   * @evidence contracts/development/implementation.md#principled-implementation The lowest-order curve that leaves and lands at the floor with one peak: a parabola over the straight line, with the foot's turn interpolated on the sphere.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared swingAnkle owner interpolates and raises the ankle, then the engine interpolates its turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Progress is clamped to [0, 1], so the foot never goes under the floor past either end.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse beyond the engine's vector and quaternion interpolation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function arc(
    from: HumanFoot.IPlacement,
    to: HumanFoot.IPlacement,
    clearance: number,
    progress: number,
  ): HumanFoot.IPlacement {
    const s: number = Math.min(1, Math.max(0, progress));
    return {
      ankle: swingAnkle(from.ankle, to.ankle, clearance, s),
      rotation: Quaternion.slerp(from.rotation, to.rotation, s),
    };
  }

  /**
   * Prepare repeated actual progress reads of one fixed foot swing.
   *
   * @param from The unchanged departure placement, borrowed for this reader.
   * @param to The unchanged landing placement, borrowed for this reader.
   * @param clearance The unchanged greatest ankle rise, metres.
   * @returns Fresh ankle and rotation at every actual share, clamped exactly as arc.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed borrowed endpoints/clearance, metre units, original progress clamp, lazy quaternion preparation and fresh placement ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Uses arc's same straight-line plus 4*c*s*(1-s) ankle owner and the engine's exact fixed-endpoint slerp producer, preserving shorter-arc choice, near-parallel threshold and final normalization.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared rotation reader precedes a progress clamp, shared ankle calculation and current rotation evaluation; no alternate swing curve is introduced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual progress computes its original ankle and quaternion. No endpoint shortcut, changed clearance, time sample, lowered contact policy or interpolated result is reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Across Q reads, the endpoint dot/shorter-arc choice and spherical fixed angle/sine prepare once; every ankle interpolation, lift expression, current quaternion weights and normalization remain, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit fixed departure/landing pair establishes rotation equivalence for the engine producer; a changed placement or clearance requires a new swing reader. Current progress and output placements are never retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action owns two borrowed endpoint placements, clearance and one bounded lazy slerp reader until released; every returned placement/vector/quaternion is fresh and retains no reader or time history.
   */
  export function prepareArc(
    from: HumanFoot.IPlacement,
    to: HumanFoot.IPlacement,
    clearance: number,
  ): (progress: number) => HumanFoot.IPlacement {
    const turn: ReturnType<typeof Quaternion.prepareSlerp> = Quaternion.prepareSlerp(from.rotation, to.rotation);
    return (progress: number): HumanFoot.IPlacement => {
      const s: number = Math.min(1, Math.max(0, progress));
      return { ankle: swingAnkle(from.ankle, to.ankle, clearance, s), rotation: turn(s) };
    };
  }

  /**
   * The limb goal that puts a foot on a placement.
   *
   * @param body The body.
   * @param posture The posture whose root carries the knee's rest place.
   * @param side The leg.
   * @param placement The foot's placement.
   * @param planted Whether the foot bears on the floor.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and what of the posture is read.
   * @evidence contracts/development/implementation.md#principled-implementation The ankle and the foot's rotation are the goal; the knee's hint follows the foot's heading; a bearing foot declares the toes' joint as its contact so the heel rises about the ball instead of the foot sliding.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record with one conditional pair of members.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A free foot declares neither a plant nor a contact, so the resolver does not pin a foot in the air.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanBend.knee`, `HumanFoot.heading` and `HumanFoot.offset`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function goal(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: Side,
    placement: HumanFoot.IPlacement,
    planted: boolean,
  ): IHumanPosture.IGoal {
    const point: IAutoMovieVector3 = placement.ankle;
    const rotation: IAutoMovieQuaternion = placement.rotation;
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.knee(
      body, posture, side, HumanFoot.heading(placement.rotation),
    );
    return formed(point, rotation, bend, planted ? HumanFoot.offset(body, side, "mtp") : undefined);
  }

  /**
   * Prepare an unchanged foot placement for current root-dependent leg goals.
   *
   * @param body The unchanged body supplying the knee and toe rest geometry.
   * @param side The leg.
   * @param placement The unchanged ankle point and foot rotation, borrowed without mutation.
   * @param planted Whether every emitted goal bears on the floor.
   * @returns A fresh goal with an actual current knee hint; point/rotation retain goal's borrowed placement convention and contacts are fresh vectors.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/placement/bearing, current root/yaw input, borrowed placement fields, fresh contact/goal ownership and lazy first-read preparation.
   * @evidence contracts/development/implementation.md#principled-implementation The fixed foot rotation determines one HumanFoot heading and the fixed body determines one toe-contact offset. Every read still computes the same knee hint from its actual root/yaw before the original planted/contact fields are formed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy heading and optional lazy contact feed the goal-record owner shared with goal; the bend remains the existing HumanBend numerical owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves fixed ankle/rotation values, real per-write knee calculation and original contact geometry. The first contact preparation remains after a successful knee calculation, failed contact preparation is not retained, and no goal or posture result is cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed heading rotation/atan2 and body toe-offset subtraction run once across Q reads instead of Q times. Every actual read retains knee transforms and fresh goal/contact allocation, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller establishes unchanged body, side, placement and bearing; a changed one requires a new preparation. Root and yaw are current inputs, and no sampled time, previous knee or achieved target is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader borrows fixed body/placement and retains at most one scalar heading and one contact vector until its owning action ends; returned goals retain no reader or time history.
   */
  export function prepareGoal(
    body: IHumanBody,
    side: Side,
    placement: HumanFoot.IPlacement,
    planted: boolean,
  ): (posture: Pick<IHumanPosture, "root" | "yaw">) => IHumanPosture.IGoal {
    let heading: number | undefined;
    let contact: IAutoMovieVector3 | undefined;
    return (posture: Pick<IHumanPosture, "root" | "yaw">): IHumanPosture.IGoal => {
      const point: IAutoMovieVector3 = placement.ankle;
      const rotation: IAutoMovieQuaternion = placement.rotation;
      if (heading === undefined) heading = HumanFoot.heading(rotation);
      const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.knee(body, posture, side, heading);
      if (planted && contact === undefined) contact = HumanFoot.offset(body, side, "mtp");
      return formed(point, rotation, bend, contact === undefined ? undefined : { ...contact });
    };
  }

  /**
   * A leg whose foot follows a placement.
   *
   * @param props The movement.
   * @returns The primitive, on the leg's channel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the leg follows and the channel claimed.
   * @evidence contracts/development/implementation.md#principled-implementation Each second the placement and the bearing are evaluated and turned into the leg's goal on the posture so far, so the knee's hint follows the root the earlier rows moved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal written into one limb.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Writes its own limb only and leaves every other member of the posture as it is.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `goal`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
   */
  export function place(props: IPlace): IAutoMovieMotionHumanPrimitive {
    const limb: "leftLeg" | "rightLeg" = `${props.side}Leg`;
    return {
      channels: [limb],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => ({
        ...posture,
        limbs: {
          ...posture.limbs,
          [limb]: goal(
            props.body,
            posture,
            props.side,
            props.placement(posture, seconds),
            props.planted(seconds),
          ),
        },
      }),
    };
  }

  /**
   * A foot kept planted on one placement between two instants.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The leg.
   * @param window The instants the plant starts and ends at.
   * @param at Where the foot stands.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the window and what the foot does in it.
   * @evidence contracts/development/implementation.md#principled-implementation A stance foot is one placement that bears throughout.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One place primitive supplies the borrowed placement over the named window and declares its root/own-leg input channels.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The window is two named instants of the clock, so no time is written twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates current placement values and the actual root/yaw knee to place/goal. Explicit root/own-leg reads preserve direct leg joints while omitting unrelated prefix writers; callers owning unchanged geometry can use prepareGoal as crouch does.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant goal work remains per write, with dependency-aware prefix reads. Borrowed placement values stay live; no immutable-geometry premise is added to this existing factory.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive retains its borrowed arguments and constant callbacks until released, storing no prepared placement result or time history.
   */
  export function plant(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: Side,
    window: readonly [string, string],
    at: HumanFoot.IPlacement,
  ): IAutoMovieMotionHumanPrimitive {
    const primitive: IAutoMovieMotionHumanPrimitive = place({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      placement: (): HumanFoot.IPlacement => at,
      planted: (): boolean => true,
    });
    return { ...primitive, reads: ["root", `${side}Leg`] };
  }

  /**
   * A foot lifted from one placement and set down on another between two
   * instants, on the clock's minimum-jerk progress along {@link arc}. The
   * foot is free inside the window and planted at its last instant.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The leg.
   * @param window The instants the foot leaves and lands at.
   * @param from Where the foot leaves.
   * @param to Where the foot lands.
   * @param clearance The ankle's greatest rise, metres.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ends, the window, the time course and when the foot bears.
   * @evidence contracts/development/implementation.md#principled-implementation A swing foot travels its arc on the minimum-jerk profile and bears only once it has arrived, so it lands without sliding.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `place` with the arc and the landing test.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bearing is read from the clock's linear share reaching 1 and not from the eased progress, which approaches 1 before the instant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates current progress/bearing to the clock and live borrowed endpoint values to arc. Root/own-leg dependencies preserve direct leg joints and omit unrelated prefix writers; explicitly fixed-pair consumers use prepareArc without changing this existing factory's borrowed-input behavior.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive retains its borrowed endpoints, clearance and clock/window until released, without prepared placement results or time history.
   */
  export function step(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: Side,
    window: readonly [string, string],
    from: HumanFoot.IPlacement,
    to: HumanFoot.IPlacement,
    clearance: number,
  ): IAutoMovieMotionHumanPrimitive {
    const primitive: IAutoMovieMotionHumanPrimitive = place({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      placement: (_: IHumanPosture, seconds: number): HumanFoot.IPlacement =>
        arc(from, to, clearance, clock.progress(window[0], window[1], seconds)),
      planted: (seconds: number): boolean =>
        clock.linear(window[0], window[1], seconds) >= 1,
    });
    return { ...primitive, reads: ["root", `${side}Leg`] };
  }
}

/** The original ankle interpolation and parabolic lift, with unchanged grouping. */
function swingAnkle(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  clearance: number,
  share: number,
): IAutoMovieVector3 {
  const ankle: IAutoMovieVector3 = Vector3.lerp(from, to, share);
  return { ...ankle, y: ankle.y + 4 * clearance * share * (1 - share) };
}

/** The same borrowed placement, current knee and optional fresh contact goal fields. */
function formed(
  point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  bend: IAutoMovieVector3,
  contact: IAutoMovieVector3 | undefined,
): IHumanPosture.IGoal {
  return { point, rotation, bend, ...(contact === undefined ? {} : { planted: true, contact }) };
}
