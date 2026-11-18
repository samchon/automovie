import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLeg,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";

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
 * @evidence contracts/development/design.md#minimal-and-owned-surface One movement (`place`) with named plant/step forms, the swing path with fixed-pair preparation and the goal builder with fixed-placement/fixed-rotation preparation; the only owner of leg goals built from foot placements. The phrases built on them are AutoMovieMotionHumanLegPhrase's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `HumanFoot.IPlacement` and the posture's goal type; no action name and no fixed body size appears.
 */
export namespace AutoMovieMotionHumanLeg {
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared swingAnkle owner raises only the fresh vector returned by the engine's interpolation, avoiding a second copied ankle record, then the engine interpolates its turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Progress is clamped to [0, 1], so the foot never goes under the floor past either end.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant interpolation/rotation work returns one fresh ankle vector whose owned height is raised directly, avoiding a second ankle copy while retaining the exact original lift expression and live endpoint reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse beyond the engine's vector and quaternion interpolation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function arc(
    from: IAutoMovieMotionHumanFoot.IPlacement,
    to: IAutoMovieMotionHumanFoot.IPlacement,
    clearance: number,
    progress: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
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
   * @evidence contracts/development/common.md#meaningful-documentation States fixed borrowed endpoints/clearance, metre units, original progress clamp, first-actual-read ankle preparation and fresh placement ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Uses arc's same straight-line plus 4*c*s*(1-s) ankle owner and the engine's exact fixed-endpoint slerp producer, preserving shorter-arc choice, near-parallel threshold and final normalization.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared rotation and lazy fixed-endpoint vector reader precede a progress clamp, shared owned-vector lift and current rotation evaluation; no alternate swing curve is introduced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual progress computes its original ankle and quaternion. No endpoint shortcut, changed clearance, time sample, lowered contact policy or interpolated result is reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Across Q reads, ankle endpoint subtractions and rotation dot/shorter-arc choice/fixed angle/sine prepare once; every ankle interpolation, original lift expression, current quaternion weights and normalization remain, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit fixed departure/landing pair establishes vector/rotation prerequisite equivalence for the engine producers; a changed placement or clearance requires a new swing reader. Current progress and output placements are never retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action owns two borrowed endpoint placements, clearance and bounded slerp/lazy fixed-vector readers until released; every returned placement/vector/quaternion is fresh and retains no reader or time history.
   */
  export function prepareArc(
    from: IAutoMovieMotionHumanFoot.IPlacement,
    to: IAutoMovieMotionHumanFoot.IPlacement,
    clearance: number,
  ): (progress: number) => IAutoMovieMotionHumanFoot.IPlacement {
    const turn: ReturnType<typeof Quaternion.prepareSlerp> = Quaternion.prepareSlerp(from.rotation, to.rotation);
    let ankle: ReturnType<typeof Vector3.prepareLerp> | undefined;
    return (progress: number): IAutoMovieMotionHumanFoot.IPlacement => {
      const s: number = Math.min(1, Math.max(0, progress));
      ankle ??= Vector3.prepareLerp(from.ankle, to.ankle);
      return { ankle: raised(ankle(s), clearance, s), rotation: turn(s) };
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
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
    side: AutoMovieHumanSide,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    planted: boolean,
  ): IAutoMovieHumanLimbGoal {
    const point: IAutoMovieVector3 = placement.ankle;
    const rotation: IAutoMovieQuaternion = placement.rotation;
    return goalAt(body, posture, side, point, rotation, planted, HumanFoot.heading(placement.rotation));
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy fixed-heading knee reader and optional lazy contact feed the goal-record owner shared with goal; the knee remains HumanBend's shared cold/prepared numerical owner with actual root/yaw inputs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves fixed ankle/rotation values, real per-write knee calculation and original contact geometry. The first contact preparation remains after a successful knee calculation, failed contact preparation is not retained, and no goal or posture result is cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed foot-heading rotation/atan2 and body toe-offset subtraction run once across Q reads. HumanBend.prepareKnee shares fixed outer-heading products and exact current-yaw inner metadata, while every actual root translation, nested knee evaluation and fresh goal/contact allocation remain; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller establishes unchanged body, side, placement and bearing; a changed one requires a new preparation. Root and yaw are current inputs, and no sampled time, previous knee or achieved target is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader borrows fixed body/placement and retains four copied rotation scalars, one bounded prepared knee-metadata reader and at most one contact vector until its owning action ends; returned goals retain no reader or time history.
   */
  export function prepareGoal(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    planted: boolean,
  ): (posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">) => IAutoMovieHumanLimbGoal {
    let read: ReturnType<typeof placementReader> | undefined;
    return (posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">): IAutoMovieHumanLimbGoal => {
      const point: IAutoMovieVector3 = placement.ankle;
      const rotation: IAutoMovieQuaternion = placement.rotation;
      read ??= placementReader(body, side, rotation);
      return read(posture, point, rotation, planted);
    };
  }

  /**
   * Prepare fixed foot-rotation geometry for varying ankle and bearing goals.
   *
   * @param body The unchanged body supplying rest knee/toe geometry.
   * @param side The leg.
   * @param rotation The copied fixed quaternion values used only when every current component matches by Object.is.
   * @returns A reader of actual posture/root/yaw, ankle/rotation placement and bearing. Goals/contacts are fresh while ankle/rotation retain goal's borrowed-reference convention; a changed rotation uses ordinary cold goal geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/side/rotation snapshot, exact component guard, actual placement/bearing inputs, lazy knee/contact order, fallback and fresh/borrowed output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation The same cold goal owner handles changed rotations. Matching rotation values share one heading and genuine Bend.prepareKnee producer; every actual root/yaw still computes its knee, and only actual bearing requests read/copy the original toe offset after a successful knee.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure prepareGoal and this placement reader share one private fixed-rotation producer, while goal and changed-rotation fallback share one cold numerical owner and all paths form the original goal record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Object.is retains signed-zero/nonfinite distinctions; every current ankle, rotation and bearing is read. Changed rotations keep ordinary heading/knee/contact admission, free feet never inherit a previous contact, and no target, fit, pose or contact threshold is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Across Q matching-rotation reads, fixed heading/toe metadata and fixed/last-yaw knee products prepare once; every actual knee translation and fresh goal/contact remains. Changed rotations retain cold work, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Copied quaternion scalars and fixed unchanged body/side prove only the reused heading/knee/contact prerequisites. Current world ankle, root, yaw and bearing remain actual inputs; changed quaternion values are never treated as the prepared rotation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action owns four rotation scalars, one bounded knee producer and at most one toe-offset vector until release. No actual placement, root, goal, query result, workspace or time history is retained.
   */
  export function preparePlacement(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide, rotation: IAutoMovieQuaternion):
    (posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">, placement: IAutoMovieMotionHumanFoot.IPlacement, planted: boolean) => IAutoMovieHumanLimbGoal {
    const read: ReturnType<typeof placementReader> = placementReader(body, side, rotation);
    return (posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">, placement: IAutoMovieMotionHumanFoot.IPlacement,
      planted: boolean): IAutoMovieHumanLimbGoal => read(posture, placement.ankle, placement.rotation, planted);
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
  export function place(props: IAutoMovieMotionHumanLeg.IPlace): IAutoMovieMotionHumanPrimitive {
    const limb: "leftLeg" | "rightLeg" = `${props.side}Leg`;
    return {
      channels: [limb],
      from: props.from,
      to: props.to,
      write: (posture: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture => ({
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
    body: IAutoMovieMotionHumanBody,
    clock: IAutoMovieMotionClock,
    side: AutoMovieHumanSide,
    window: readonly [string, string],
    at: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieMotionHumanPrimitive {
    const primitive: IAutoMovieMotionHumanPrimitive = place({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      placement: (): IAutoMovieMotionHumanFoot.IPlacement => at,
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
    body: IAutoMovieMotionHumanBody,
    clock: IAutoMovieMotionClock,
    side: AutoMovieHumanSide,
    window: readonly [string, string],
    from: IAutoMovieMotionHumanFoot.IPlacement,
    to: IAutoMovieMotionHumanFoot.IPlacement,
    clearance: number,
  ): IAutoMovieMotionHumanPrimitive {
    const primitive: IAutoMovieMotionHumanPrimitive = place({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      placement: (_: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanFoot.IPlacement =>
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
  return raised(Vector3.lerp(from, to, share), clearance, share);
}

/** Raise only a genuine fresh interpolation result with the original parabola. */
function raised(ankle: IAutoMovieVector3, clearance: number, share: number): IAutoMovieVector3 {
  ankle.y = ankle.y + 4 * clearance * share * (1 - share);
  return ankle;
}

/** The same borrowed placement, current knee and optional fresh contact goal fields. */
function formed(
  point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  bend: IAutoMovieVector3,
  contact: IAutoMovieVector3 | undefined,
): IAutoMovieHumanLimbGoal {
  return { point, rotation, bend, ...(contact === undefined ? {} : { planted: true, contact }) };
}

/** Original cold heading, current knee and actual bearing-contact admission order. */
function goalAt(body: IAutoMovieMotionHumanBody, posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
  side: AutoMovieHumanSide, point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion, planted: boolean, heading: number = HumanFoot.heading(rotation)): IAutoMovieHumanLimbGoal {
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.knee(body, posture, side, heading);
  return formed(point, rotation, bend, planted ? HumanFoot.offset(body, side, "mtp") : undefined);
}

/** Genuine fixed-rotation producer shared by both actual prepared-placement APIs. */
function placementReader(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide, fixed: IAutoMovieQuaternion):
  (posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">, point: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion, planted: boolean) => IAutoMovieHumanLimbGoal {
  const x: number = fixed.x;
  const y: number = fixed.y;
  const z: number = fixed.z;
  const w: number = fixed.w;
  let knee: ReturnType<typeof AutoMovieMotionHumanBend.prepareKnee> | undefined;
  let contact: IAutoMovieVector3 | undefined;
  return (posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">, point: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion, planted: boolean): IAutoMovieHumanLimbGoal => {
    if (!Object.is(rotation.x, x) || !Object.is(rotation.y, y) ||
      !Object.is(rotation.z, z) || !Object.is(rotation.w, w))
      return goalAt(body, posture, side, point, rotation, planted);
    if (knee === undefined)
      knee = AutoMovieMotionHumanBend.prepareKnee(body, side, HumanFoot.heading(rotation));
    const bend: IAutoMovieVector3 = knee(posture);
    if (planted && contact === undefined) contact = HumanFoot.offset(body, side, "mtp");
    return formed(point, rotation, bend, planted ? { ...contact! } : undefined);
  };
}