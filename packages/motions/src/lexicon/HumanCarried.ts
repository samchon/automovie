import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { carryHumanPosture } from "../posture/carryHumanPosture";
import { HumanCarriedDrag } from "./HumanCarriedDrag";
import { HumanCarriedLift } from "./HumanCarriedLift";

/**
 * Being carried by another person: on the back, in the arms or over a
 * shoulder. The carried person keeps the posture they are in and goes
 * rigidly with one bone of the carrier (the upper chest when none is
 * named), so whatever the carrier does (walk, turn, stoop) takes them
 * along. The carrier performs their own action, such as a carry of the
 * load in both hands. Register `HumanCarried.carried` to use it.
 *
 * The named carries (`CARRIES`: piggyback, cradle, over the shoulder,
 * supported) are two laws for the two people: `borne` puts the carried body
 * in the carry's posture with its resting region on the carrier's, and
 * `bearing`, performed over the carrier's own action, puts the carrier's
 * hands where the carry holds.
 *
 * First pass: the lift into the carry and the set-down are not planned,
 * the carried body does not sag or cling, and its weight does not lean the
 * carrier.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what being carried is here, what the carrier does and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law record whose posture is the entry posture moved by one bone of the carrier, with a contact window that names the carrier as its frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law and its parameters.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The carrier's motion is read from the performance, never restated in the carried person's parameters.
 */
export namespace HumanCarried {
  /** Parameters of being carried. */
  export interface IParams {
    /** The carrier's subject id. */
    by: string;

    /** The carrier's bone the body goes with; the upper chest when absent. */
    on?: AutoMovieHumanoidBone;

    /** Seconds carried. */
    seconds: number;
  }

  /** Be carried by another person. */
  export const carried: IHumanActionLaw<IParams> = {
    name: "carried",
    interrupts: {
      any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    },
    yields: ["head", "leftHand", "rightHand", "leftArm", "rightArm"],
    plan: (context: IHumanActionContext<IParams>): IHumanActionPlan => {
      const { by, seconds } = context.params;
      const bone: AutoMovieHumanoidBone = context.params.on ?? "upperChest";
      if (!(seconds > 0))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "seconds",
          value: seconds,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: null,
            unit: "s",
            open: "minimum",
          },
          reason: "being carried lasts a positive time",
          fix: "give the seconds carried",
        });
      if (by === context.subject)
        throw new HumanRefusal({
          kind: "participant",
          axis: "by",
          value: by,
          reason: "a person is carried by someone else",
          fix: "name the carrier",
        });
      const carrier: IHumanActionContext.IPerformer = context.performer(by);
      const held: IHumanPosture = context.entry.posture;
      const frame = (at: number): carryHumanPosture.IFrame => {
        const resolved: IAutoMovieResolvedBone | undefined = carrier
          .bones(context.start + at)
          .get(bone);
        if (resolved === undefined)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "on",
            value: bone,
            reason: `the carrier has no bone ${bone}`,
            fix: "name a bone of the carrier's rig",
          });
        return {
          position: resolved.worldPosition,
          rotation: resolved.worldRotation,
        };
      };

      // The carrier's bones may be read only once a posture is asked.
      let origin: carryHumanPosture.IFrame | undefined;
      return {
        duration: seconds,
        events: [],
        contacts: [
          {
            part: "seat",
            kind: "seat",
            from: 0,
            to: 1,
            support: { kind: "person", subject: by, region: "upperBack" },
          },
        ],
        posture: (at: number): IHumanPosture => {
          origin ??= frame(0);
          return carryHumanPosture(
            held,
            origin,
            frame(Math.min(seconds, Math.max(0, at))),
          );
        },
      };
    },
  };

  /** A named way one person carries another. */
  export type Carry =
    | "piggyback"
    | "cradle"
    | "overShoulder"
    | "supported"
    | "supportedLeft"
    | HumanCarriedDrag.Name;

  /** An offset by its parts in a performer's floor frame: toward the named hand's side, up and forward. */
  export interface IOffset {
    /** Toward the hand's own side. */
    out: number;

    /** Up. */
    up: number;

    /** Forward. */
    forward: number;
  }

  /** One carry: how the carried body lies against the carrier and where the carrier's hands hold. */
  export interface IRow {
    /** The carried body's region that rests on the carrier. */
    mine: AutoMovieHumanoidRegion;

    /** The carrier's region it rests on. */
    theirs: AutoMovieHumanoidRegion;

    /** The carried body's heading from the carrier's, degrees about +Y. */
    turn: number;

    /** The carried body's forward tip, degrees. */
    pitch: number;

    /** The carried body's hip and knee flexion and hip abduction, degrees. */
    legs: readonly [number, number, number];

    /** The carrier's regions the carried person's left and right wrists go to; null for an arm that hangs. */
    clings: readonly [
      AutoMovieHumanoidRegion | null,
      AutoMovieHumanoidRegion | null,
    ];

    /** Where the carrier's left and right wrists hold: an own region and an offset from it in arm lengths; null for a free arm. */
    holds: readonly [IHold | null, IHold | null];
  }

  /** Where a carrying hand holds, on the carrier's own body. */
  export interface IHold {
    /** The carrier's own region the place is measured from. */
    region: AutoMovieHumanoidRegion;

    /** The wrist's offset from it, arm lengths. */
    offset: IOffset;
  }

  /** The carries. Every angle and offset is provisional, set from the carries' common descriptions: piggyback, chest on the back, legs about the waist, hands under the thighs; cradle, across the forearms before the chest; over the shoulder, folded at the waist over one shoulder; supported, side by side with an arm across the helper's shoulders (`supportedLeft` is a second helper's side); the drags are `HumanCarriedDrag`'s. #3349's sources give trunk flexion and stability findings, not these places. */
  export const CARRIES: Readonly<Record<Carry, IRow>> = {
    piggyback: {
      mine: "sternum",
      theirs: "upperBack",
      turn: 0,
      pitch: 20,
      legs: [70, 80, 25],
      clings: ["shoulderLeft", "shoulderRight"],
      holds: [
        { region: "hipLeft", offset: { out: 0.15, up: 0, forward: -0.1 } },
        { region: "hipRight", offset: { out: 0.15, up: 0, forward: -0.1 } },
      ],
    },
    cradle: {
      mine: "ribsLeft",
      theirs: "sternum",
      turn: 90,
      pitch: -50,
      legs: [80, 70, 0],
      clings: [null, null],
      holds: [
        { region: "sternum", offset: { out: 0.25, up: -0.15, forward: 0.35 } },
        { region: "sternum", offset: { out: 0.25, up: -0.15, forward: 0.35 } },
      ],
    },
    overShoulder: {
      mine: "abdomen",
      theirs: "shoulderRight",
      turn: 180,
      pitch: 85,
      legs: [60, 10, 0],
      clings: [null, null],
      holds: [
        null,
        { region: "shoulderRight", offset: { out: 0, up: 0, forward: 0.3 } },
      ],
    },
    supported: {
      mine: "ribsLeft",
      theirs: "ribsRight",
      turn: 0,
      pitch: 0,
      legs: [0, 5, 0],
      clings: ["shoulderLeft", null],
      holds: [
        null,
        { region: "hipRight", offset: { out: 0.45, up: 0.1, forward: 0 } },
      ],
    },
    supportedLeft: {
      mine: "ribsRight",
      theirs: "ribsLeft",
      turn: 0,
      pitch: 0,
      legs: [0, 5, 0],
      clings: [null, "shoulderRight"],
      holds: [
        { region: "hipLeft", offset: { out: 0.45, up: 0.1, forward: 0 } },
        null,
      ],
    },
    ...HumanCarriedDrag.CARRIES,
  };

  /** Parameters of being carried in a named carry. */
  export interface IBorne extends HumanCarriedLift.IParams {
    /** The carrier's subject id; absent, the body takes the carry's posture where it stands, resting on nothing. */
    by?: string;

    /** The carry; `piggyback` when absent. */
    carry?: Carry;

    /** Seconds carried, more than none; 2 when absent. */
    seconds?: number & tags.ExclusiveMinimum<0>;
  }

  /** Parameters of the carrier's hold in a named carry. */
  export interface IBearing {
    /** The carry; `piggyback` when absent. */
    carry?: Carry;

    /** Seconds held, more than none; 2 when absent. */
    seconds?: number & tags.ExclusiveMinimum<0>;
  }

  /** A region's point on resolved bones. */
  const placed = (
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    region: AutoMovieHumanoidRegion,
    axis: string,
  ): IAutoMovieVector3 => {
    const frame: IHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
      body.surfaces.regions[region];
    const bone: IAutoMovieResolvedBone | undefined = bones.get(frame.bone);
    if (bone === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis,
        value: region,
        reason: `the rig has no bone ${frame.bone} for the region ${region}`,
        fix: "carry on a body of the canonical humanoid rig",
      });
    return resolveAutoMovieHumanoidSurfaces.place(frame, bone).point;
  };

  /** Refuse a carry's seconds that are not positive. */
  const lasting = (seconds: number): number =>
    HumanBound.above("seconds", seconds, 0, "s");

  /**
   * Be carried in a named carry: the body takes the carry's posture and its resting region stays on the carrier's region, whatever the carrier does. The carrier performs `bearing` over their own action. The lift into the carry and the set-down are the `lift` and `setDown` seconds (`HumanCarriedLift`). A person named as their own carrier is refused on `by`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is kept, who does what, what is not planned and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation At each second the carrier's displayed region and heading are read; the carried posture is built with the carry's heading, tip and leg angles, and its root is the one that puts its own resting region on the carrier's, found by one forward kinematics of the trunk.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The row, the leg angles, then one posture function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The posture is rigid in the carry (no sag, no sway) and its angles are provisional; with no carrier the posture is taken in place and declares no support.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution and one read of the carrier's bones per posture.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export const borne: IHumanActionLaw<IBorne> = {
    name: "borne",
    interrupts: {
      any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    },
    yields: ["head"],
    plan: (context: IHumanActionContext<IBorne>): IHumanActionPlan => {
      const by: string | undefined = context.params.by;
      const seconds: number = lasting(context.params.seconds ?? 2);
      if (by === context.subject)
        throw new HumanRefusal({
          kind: "participant",
          axis: "by",
          value: by,
          reason: "a person is carried by someone else",
          fix: "name the carrier",
        });
      const row: IRow = CARRIES[context.params.carry ?? "piggyback"];
      const body: IHumanBody = context.body;
      const carrier: IHumanActionContext.IPerformer | undefined =
        by === undefined ? undefined : context.performer(by);
      const entry: IHumanPosture = context.entry.posture;
      const [hip, knee, apart]: readonly [number, number, number] = row.legs;
      const joints: IHumanPosture["joints"] = {
        leftUpperLeg: [hip, apart, 0],
        rightUpperLeg: [hip, apart, 0],
        leftLowerLeg: [knee, 0, 0],
        rightLowerLeg: [knee, 0, 0],
      };
      return HumanCarriedLift.over(context, {
        duration: seconds,
        events: [],
        contacts:
          by === undefined
            ? []
            : [
                {
                  part: "seat",
                  kind: "seat",
                  from: 0,
                  to: 1,
                  support: { kind: "person", subject: by, region: row.theirs },
                },
              ],
        posture: (at: number): IHumanPosture => {
          // With no carrier the carry's posture is taken where the body stands.
          if (carrier === undefined)
            return { ...entry, pitch: row.pitch, joints, limbs: {} };
          const theirs: ReturnType<IHumanActionContext.IPerformer["bones"]> =
            carrier.bones(context.start + Math.min(seconds, Math.max(0, at)));
          const hips: IAutoMovieResolvedBone | undefined = theirs.get("hips");
          const turned: IHumanPosture = {
            root: { x: 0, y: 0, z: 0 },
            yaw:
              (hips === undefined
                ? 0
                : HumanFrame.heading(hips.worldRotation)) + row.turn,
            pitch: row.pitch,
            roll: 0,
            joints,
            limbs: {},
          };

          // The root that puts the resting region on the carrier's region.
          const posture: IHumanPosture = {
            ...turned,
            root: Vector3.subtract(
              placed(carrier.body, theirs, row.theirs, "carry"),
              placed(body, HumanTrunk.resolve(body, turned), row.mine, "carry"),
            ),
          };
          const limbs: IHumanPosture["limbs"] = {};
          (["left", "right"] as const).forEach(
            (side: "left" | "right", index: number): void => {
              const region: AutoMovieHumanoidRegion | null =
                row.clings[index] ?? null;
              if (region !== null)
                limbs[`${side}Arm`] = {
                  point: placed(carrier.body, theirs, region, "carry"),
                  bend: AutoMovieMotionHumanBend.hang(body, posture, side),
                };
            },
          );
          return { ...posture, limbs };
        },
      });
    },
  };

  /**
   * Hold a person in a named carry: the carrier's hands where the carry takes the carried body. Performed over the carrier's own action (`carrier.walk(...).over((o) => o.registered("bearing", ...))`), it claims only the arms that hold. The lean against the load is a layer the composition schedules over the carry (`HumanCarriedLean`), since a walk keeps its trunk for itself.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the hands do, how it is composed and what is missing.
   * @evidence contracts/development/implementation.md#principled-implementation Each holding wrist goes to a place measured from one of the carrier's own regions on the trunk the carrier's action has placed, in arm lengths, so the hold follows the walk; the arm is carried in joint space from what it held (`AutoMovieMotionHumanArm.carried`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arm primitive per holding hand over the inherited base.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hands do not read the carried body, which reads the carrier, so the two cannot chase each other; the holds' places are provisional.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution per holding arm per posture.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export const bearing: IHumanActionLaw<IBearing> = {
    name: "bearing",
    interrupts: {
      any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    },
    overlay: true,
    plan: (context: IHumanActionContext<IBearing>): IHumanActionPlan => {
      const seconds: number = lasting(context.params.seconds ?? 2);
      const row: IRow = CARRIES[context.params.carry ?? "piggyback"];
      const body: IHumanBody = context.body;
      const arm: number = body.measure.upperArm + body.measure.forearm;
      const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
        seconds,
        [{ name: "held", seconds: Math.min(seconds, TAKE) }],
      );
      const primitives: IAutoMovieMotionHumanPrimitive[] = [];
      (["left", "right"] as const).forEach(
        (side: "left" | "right", index: number): void => {
          const hold: IHold | null = row.holds[index] ?? null;
          if (hold === null) return;
          primitives.push(
            AutoMovieMotionHumanArm.carried({
              body,
              side,
              from: 0,
              to: seconds,
              rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
              goal: (posture: IHumanPosture): IHumanPosture.IGoal => ({
                point: Vector3.add(
                  placed(
                    body,
                    HumanTrunk.resolve(body, posture),
                    hold.region,
                    "carry",
                  ),
                  HumanFrame.point(
                    { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                    {
                      x: (side === "left" ? 1 : -1) * hold.offset.out * arm,
                      y: hold.offset.up * arm,
                      z: hold.offset.forward * arm,
                    },
                  ),
                ),
                bend: AutoMovieMotionHumanBend.hang(body, posture, side),
              }),
              weight: (at: number): number =>
                clock.progress(AutoMovieMotionClock.START, "held", at),
            }),
          );
        },
      );
      return composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.under(context, seconds),
        clock,
        primitives,
      });
    },
  };

  /** Seconds the carrier's hands take to reach their hold (provisional). */
  export const TAKE: number = 0.4;
}
