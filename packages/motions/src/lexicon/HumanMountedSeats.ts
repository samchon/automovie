import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { kneelKeys } from "../everyday/kneelKeys";
import { seated } from "../everyday/seated";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMount } from "./HumanMount";

/**
 * The key postures of the mounted seat kinds (`IAutoMovieMotionHumanMounted.Seat`),
 * each solved in the carrier contact's model-aligned frame from the body's
 * own measures and the carrier's own contacts.
 *
 * The side-saddle seat (`aside`) follows the Side Saddle Association's
 * arrangement: the rider sits "absolutely straight and square", the right
 * leg "goes around the top" pommel "and then hangs down", and the left foot
 * is "in a stirrup" (https://sidesaddleassociation.co.uk/introsidesaddle.asp).
 * The vaulting seats follow the FEI guidelines as Equestrian Australia's
 * 2024 descriptions extract them: in the basic seat "the arms are stretched
 * to each side along the frontal plane, with the fingertips at eye level",
 * and in the bench the vaulter kneels on the back with the hands on the
 * handles. Every angle not given by a source is marked provisional.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the sources of each seat and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation Each seat is a posture in the carrier contact's frame: root, attitude, joints and limb goals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three solved seats and the context they read, used by `HumanMounted`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No carrier is named: every place is a contact's or the body's.
 */
export namespace HumanMountedSeats {
  /** The shoulder abduction that holds an arm level to the side, degrees; the basic seat raises it by the angle that brings the fingertips to eye level (`basic`). */
  export const ABDUCTION: number = 90;

  /** The bench's pelvis inclination forward and its added spine flexion, degrees (provisional: the guideline's figure shows a trunk inclined forward over the handles). */
  export const BENCH: Readonly<{ pitch: number; spine: number }> = {
    pitch: 45,
    spine: 20,
  };

  /** The most the right shank turns out from hanging plumb to clear the carrier, degrees (provisional). */
  export const OUT: number = 75;

  /** The clearance the hanging right shank keeps from the carrier's colliders beyond its own radius, metres (the campaign's 10 mm contact budget). */
  export const CLEAR: number = 0.01;

  /**
   * The supports each seat kind requires, and those it may name besides.
   *
   * @param seat The seat kind.
   * @returns The required and the optional supporting parts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each kind reads.
   * @evidence contracts/development/implementation.md#principled-implementation The side saddle's two leg supports with optional reins, the bench's knees and handles, the basic seat's free arms, the out-of-saddle and bank seats' two stirrups with optional hands, and the entered seat's optional hands and the stirrups its entry stands in.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One choice per kind.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function parts(
    seat: IAutoMovieMotionHumanMounted.Seat,
  ): readonly [readonly Part[], readonly Part[]] {
    if (seat === "aside")
      return [
        ["rightThigh", "leftFoot"],
        ["leftHand", "rightHand"],
      ];
    if (seat === "bench")
      return [["leftKnee", "rightKnee", "leftHand", "rightHand"], []];
    if (seat === "basic") return [[], []];
    if (
      seat === "twoPoint" ||
      seat === "crouch" ||
      seat === "standing" ||
      seat === "descent" ||
      seat === "ascent"
    )
      return [
        ["leftFoot", "rightFoot"],
        ["leftHand", "rightHand"],
      ];
    return [[], ["leftHand", "rightHand", "leftFoot", "rightFoot"]];
  }

  /**
   * Whether a seat kind bears on the seat.
   *
   * @param seat The seat kind.
   * @returns True for the seats sat on: entered, aside, basic and descent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which kinds sit.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A membership test.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function sits(seat: IAutoMovieMotionHumanMounted.Seat): boolean {
    return (
      seat === "entered" ||
      seat === "aside" ||
      seat === "basic" ||
      seat === "descent"
    );
  }

  /**
   * A supporting part a figure can name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the part keys of a figure's supports.
   * @evidence contracts/development/design.md#principled-representation The keys of the interface's support record, so the two cannot drift.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `parts` and the mounted law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Part = keyof IAutoMovieMotionHumanMounted.ISupports;

  /**
   * What a seat is solved from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The body, the entry in the carrier frame and readers of the carrier's contacts and colliders in that frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the three seats read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The colliders are read through `clear`, never copied.
   */
  export interface IContext {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The entered seated posture, in the carrier frame. */
    entry: IAutoMovieMotionHumanPosture;

    /** A carrier contact's point in the carrier frame, metres. */
    point(id: string): IAutoMovieVector3;

    /** A carrier contact's declaration. */
    contact(id: string): IAutoMovieAffordance;

    /** How far the carrier contact rises or falls along its own up from its stride-averaged path, metres: what a leg out of the saddle must absorb; 0 without a stride. */
    slack: number;

    /** How far a segment given in the carrier frame lies from the carrier's colliders, metres, negative inside. */
    clear(a: IAutoMovieVector3, b: IAutoMovieVector3): number;
  }

  /**
   * The vaulter's basic seat: the entered seat astride, its arms stretched to the sides with the fingertips at eye level.
   *
   * @param context The seat's context.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture and its source.
   * @evidence contracts/development/implementation.md#principled-implementation The shoulder's abduction rises above horizontal by the asin of the eye's height over the shoulder's against the arm's length, so a straight arm puts the fingertips level with the eyes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The entry with two joints per arm replaced and its arm goals dropped.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The legs and trunk are the entry's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function basic(context: IContext): IAutoMovieMotionHumanPosture {
    const m: IAutoMovieMotionHumanBody["measure"] = context.body.measure;
    const arm: number = m.upperArm + m.forearm + m.hand;
    const rise: number =
      (Math.asin(
        Math.max(-1, Math.min(1, (m.eyeHeight - m.shoulderHeight) / arm)),
      ) *
        180) /
      Math.PI;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
      ...context.entry.limbs,
    };
    delete limbs.leftArm;
    delete limbs.rightArm;
    return {
      ...context.entry,
      limbs,
      joints: {
        ...context.entry.joints,
        leftUpperArm: [0, ABDUCTION + rise, 0],
        rightUpperArm: [0, ABDUCTION + rise, 0],
        leftLowerArm: [0, 0, 0],
        rightLowerArm: [0, 0, 0],
      },
    };
  }

  /**
   * The side-saddle seat: the pelvis turned square to the carrier's front on the seat bones it entered on, the right thigh over the fixed head with the shank hanging clear of the carrier on the near side, and the ball of the left foot on its stirrup.
   *
   * @param context The seat's context.
   * @param supports The figure's supports: `rightThigh` and `leftFoot`.
   * @returns The posture.
   * @throws {HumanRefusal} When the fixed head is not under the thigh between its middle and the knee, when no turn of the shank up to `OUT` clears the carrier, or when the stirrup is outside the left leg's band.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture, its source and the three refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The seat socket keeps its place and the pelvis turns to the carrier's heading; the thigh runs from the hip joint over the head's top, raised by the head's and the thigh's radii, for its own length; the shank turns out about the carrier's fore-and-aft axis by the least angle that clears the colliders, found by a scan and bisection; the left foot's ball is placed on the tread.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The pelvis, the right leg, the left leg.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A head or stirrup out of reach is refused, never clamped to.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sixteen scan steps and twenty bisections, each one collider distance query.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Solved once per figure.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function aside(
    context: IContext,
    supports: IAutoMovieMotionHumanMounted.ISupports,
  ): IAutoMovieMotionHumanPosture {
    const { body, entry } = context;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    // Square to the carrier's front: the model-aligned frame's heading on the turn nearest the entered one.
    const facing: number = 360 * Math.round(entry.yaw / 360);
    const attitude: Pick<
      IAutoMovieMotionHumanPosture,
      "yaw" | "pitch" | "roll"
    > = { yaw: facing, pitch: entry.pitch, roll: 0 };
    const root: IAutoMovieVector3 = seated.root(
      body,
      seated.socket(body, entry),
      attitude,
    );
    const turn: IAutoMovieQuaternion = resolveHumanPosture.heading(attitude);
    const hips: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
      body,
      root,
      turn,
      entry.joints.hips,
    );

    // The right thigh lies over the fixed head's top, the knee beyond it.
    const headId: string = supports.rightThigh!;
    const head: IAutoMovieVector3 = context.point(headId);
    const over: IAutoMovieVector3 = {
      ...head,
      y: head.y + (context.contact(headId).aperture ?? 0) / 2 + m.thighRadius,
    };
    const along: number = Vector3.distance(over, hips.right);
    if (!(along >= 0.5 * m.thigh && along <= m.thigh))
      throw new HumanRefusal({
        kind: "reach",
        axis: "supports.rightThigh",
        value: along,
        feasible: {
          kind: "range",
          minimum: 0.5 * m.thigh,
          maximum: m.thigh,
          unit: "m",
        },
        reason: `the fixed head ${headId} lies ${along.toFixed(3)} m along the right thigh, and it hooks under the thigh between its middle and the knee`,
        fix: "sit on a side saddle whose fixed head lies under the thigh, or a body whose thigh reaches it",
      });
    const knee: IAutoMovieVector3 = Vector3.add(
      hips.right,
      Vector3.scale(
        Vector3.normalize(Vector3.subtract(over, hips.right)),
        m.thigh,
      ),
    );

    // The ball of the left foot on its stirrup, the knee forward and out under the leaping head: each support's reach is admitted before the hanging shank is solved.
    const footId: string = supports.leftFoot!;
    const placed: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
      body,
      "left",
      "ball",
      context.point(footId),
      facing,
      0,
    );
    const [near, far]: readonly [number, number] = HumanMount.span(body);
    const reach: number = Vector3.distance(placed.ankle, hips.left);
    if (!(reach >= near && reach <= far))
      throw new HumanRefusal({
        kind: "reach",
        axis: "supports.leftFoot",
        value: reach,
        feasible: { kind: "range", minimum: near, maximum: far, unit: "m" },
        reason: `the stirrup ${footId} lies ${reach.toFixed(3)} m from the left hip, outside the leg's band`,
        fix: "set the side saddle's stirrup within the left leg's reach",
      });
    // The shank hangs from the knee, turned out about the carrier's fore-and-aft axis only as far as clears the carrier.
    const ankleAt = (degrees: number): IAutoMovieVector3 => {
      const r: number = (degrees * Math.PI) / 180;
      return Vector3.add(knee, {
        x: m.shank * Math.sin(r),
        y: -m.shank * Math.cos(r),
        z: 0,
      });
    };
    const clears = (degrees: number): boolean =>
      context.clear(knee, ankleAt(degrees)) >= m.shankRadius + CLEAR;
    let high: number | undefined;
    for (let k: number = 0; k <= 15 && high === undefined; ++k)
      if (clears((OUT * k) / 15)) high = (OUT * k) / 15;
    if (high === undefined)
      throw new HumanRefusal({
        kind: "reach",
        axis: "supports.rightThigh",
        value: OUT,
        feasible: null,
        reason: `the right shank hanging from the fixed head ${headId} meets the carrier at every turn up to ${OUT} degrees`,
        fix: "use a side saddle whose fixed head lets the leg hang clear",
      });
    let low: number = Math.max(0, high - OUT / 15);
    for (let i: number = 0; i < 20 && high > 0; ++i) {
      const middle: number = (low + high) / 2;
      if (clears(middle)) high = middle;
      else low = middle;
    }
    const ankle: IAutoMovieVector3 = ankleAt(high);
    const bend: IAutoMovieVector3 = Vector3.add(
      knee,
      Vector3.scale(
        Vector3.normalize(
          Vector3.subtract(knee, Vector3.lerp(hips.right, ankle, 0.5)),
        ),
        0.1,
      ),
    );

    const leftLeg: IAutoMovieHumanLimbGoal = {
      point: placed.ankle,
      rotation: placed.rotation,
      bend: HumanFrame.point(
        { origin: hips.left, yaw: facing },
        { x: 0.35 * m.thigh, y: -0.3 * m.thigh, z: m.thigh },
      ),
      planted: true,
      contact: HumanFoot.offset(body, "left", "ball"),
    };
    return {
      ...entry,
      ...attitude,
      root,
      limbs: {
        ...entry.limbs,
        leftLeg,
        rightLeg: {
          point: ankle,
          rotation: HumanFrame.turn(facing),
          bend,
          planted: false,
        },
      },
    };
  }

  /**
   * The vaulter's bench: both knees a shank's radius over the pad with the thighs upright, the feet tucked on their toes behind, the pelvis inclined `BENCH.pitch` and the spine flexed `BENCH.spine` further toward the handles.
   *
   * @param context The seat's context.
   * @param supports The figure's supports: `leftKnee`, `rightKnee`, `leftHand` and `rightHand`.
   * @returns The posture.
   * @throws {HumanRefusal} When a knee falls off its surface, or a handle lies beyond the arm's reach from the inclined shoulder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture and its refusals.
   * @evidence contracts/development/implementation.md#principled-implementation `kneelKeys`' kneeling height (the knee joint a shank radius over the floor, the hip a thigh above it) and tucked foot on the pad's plane; the hips stand back from the handles by the thigh's length; the reach is checked from the shoulder the inclined trunk carries.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The root, the knees and their surfaces, the feet, the reach.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A knee off its surface or a handle out of reach is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two tucked-foot solves.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `kneelKeys.tucked`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bench(
    context: IContext,
    supports: IAutoMovieMotionHumanMounted.ISupports,
  ): IAutoMovieMotionHumanPosture {
    const { body, entry } = context;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const facing: number = 360 * Math.round(entry.yaw / 360);
    const attitude: Pick<
      IAutoMovieMotionHumanPosture,
      "yaw" | "pitch" | "roll"
    > = { yaw: facing, pitch: BENCH.pitch, roll: 0 };
    const turn: IAutoMovieQuaternion = resolveHumanPosture.heading(attitude);
    const pad: IAutoMovieVector3 = context.point(supports.leftKnee!);
    const handles: Record<"left" | "right", IAutoMovieVector3> = {
      left: context.point(supports.leftHand!),
      right: context.point(supports.rightHand!),
    };
    const kneeY: number = pad.y + m.shankRadius;
    const rest: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
      body,
      { x: 0, y: 0, z: 0 },
      turn,
      entry.joints.hips,
    );
    const middle: IAutoMovieVector3 = Vector3.lerp(rest.left, rest.right, 0.5);
    const ahead: number = (handles.left.z + handles.right.z) / 2;
    const root: IAutoMovieVector3 = Vector3.subtract(
      { x: 0, y: kneeY + m.thigh, z: ahead - m.thigh },
      middle,
    );
    const hips: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
      body,
      root,
      turn,
      entry.joints.hips,
    );
    const legs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const side of ["left", "right"] as const) {
      const id: string = supports[`${side}Knee`]!;
      const surface: IAutoMovieAffordance = context.contact(id);
      const centre: IAutoMovieVector3 = context.point(id);
      const knee: IAutoMovieVector3 = { ...hips[side], y: kneeY };
      if (
        !(
          Math.abs(knee.x - centre.x) <= (surface.width ?? 0) / 2 &&
          Math.abs(knee.z - centre.z) <= (surface.depth ?? 0) / 2 &&
          Math.abs(centre.y - pad.y) < 1e-9
        )
      )
        throw new HumanRefusal({
          kind: "affordance",
          axis: `supports.${side}Knee`,
          value: id,
          feasible: null,
          reason: `the ${side} knee of the bench falls off the surface ${id}`,
          fix: "kneel on a pad long and wide enough behind the handles",
        });
      const flat: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: { x: 0, y: m.ankleHeight, z: 0 },
        rotation: HumanFrame.turn(facing),
      };
      const toe: number = HumanFoot.point(body, side, "mtp", flat).y;
      const foot: kneelKeys.IFoot = kneelKeys.tucked(
        body,
        side,
        knee,
        facing,
        pad.y + toe,
      );
      const placed: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
        body,
        side,
        "mtp",
        foot.at,
        foot.heading,
        foot.pitch,
      );
      legs[`${side}Leg`] = {
        point: placed.ankle,
        rotation: placed.rotation,
        bend: Vector3.add(
          knee,
          Vector3.scale(HumanFrame.forward(facing), m.thigh),
        ),

        // The toes may reach past the pad, where the guideline lets the foot leave the back, so they bear nothing.
        planted: false,
      };
    }

    // The inclined trunk carries the shoulders forward over the handles; each handle must lie within the arm's reach.
    const lean: IAutoMovieQuaternion = resolveHumanPosture.heading({
      ...attitude,
      pitch: BENCH.pitch + BENCH.spine,
    });
    const shoulder: IAutoMovieVector3 = Vector3.add(
      Vector3.lerp(hips.left, hips.right, 0.5),
      Quaternion.rotateVector(lean, {
        x: 0,
        y: m.shoulderHeight - m.hipHeight,
        z: 0,
      }),
    );
    const arm: number = m.upperArm + m.forearm + m.hand / 2;
    for (const side of ["left", "right"] as const) {
      const gap: number = Vector3.distance(shoulder, handles[side]);
      if (gap > arm)
        throw new HumanRefusal({
          kind: "reach",
          axis: `supports.${side}Hand`,
          value: gap,
          feasible: { kind: "range", minimum: 0, maximum: arm, unit: "m" },
          reason: `the ${side} handle lies ${gap.toFixed(3)} m from the kneeling shoulder, beyond the arm's ${arm.toFixed(3)} m`,
          fix: "kneel nearer the handles, or use a body whose arms reach them",
        });
    }
    const spine: readonly [number, number, number] = entry.joints.spine ?? [
      0, 0, 0,
    ];
    return {
      ...entry,
      ...attitude,
      root,
      joints: {
        ...entry.joints,
        spine: [spine[0] + BENCH.spine, spine[1], spine[2]],
      },
      limbs: legs,
    };
  }
}
