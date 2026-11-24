import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanCoatPartner,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanPartnerClear } from "../compose/AutoMovieMotionHumanPartnerClear";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { wardrobeHands } from "./wardrobeHands";

/**
 * The wearer's collar below and before the shoulder line, metres: the
 * `wardrobe` jacket's own collar offset.
 */
const COLLAR: IAutoMovieVector3 = { x: 0, y: -0.085, z: 0.1 };

/**
 * How long the hand stays on the jacket once it rests on the shoulders,
 * seconds: a beat to settle it.
 */
const SETTLE: number = 0.28;

/**
 * Help a partner into a coat. The dresser's holding hand carries the jacket's
 * `wear` socket up to the partner's collar, read from the partner's shoulders
 * and heading at the action's start, and holds it there still for the authored
 * span. Meanwhile the partner threads each sleeve with `wardrobe`'s `sleeveIn`,
 * whose openings stay where the held jacket keeps them. Then the hand lets go,
 * the jacket is worn on the partner's chest from that instant, and the hand
 * returns. The jacket thus has one carrier at a time: the dresser's grip, then
 * the partner's chest.
 */
function planCoatPartner(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCoatPartner>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  if (params.partner === context.subject)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "partner",
      value: params.partner,
      reason: "a performer puts on its own jacket with wardrobe",
      fix: "name another performer as the partner",
    });
  if (!(params.hold > 0 && Number.isFinite(params.hold)))
    throw wardrobeHands.refusal(
      "hold",
      params.hold,
      "hold the jacket open for a positive span while the partner threads its sleeves",
    );
  const hand: AutoMovieHumanSide =
    params.hand ?? (entry.holds.right === params.prop ? "right" : "left");
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
    context,
    hand,
    params.prop,
  );
  const reader: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
  const wear: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    "wear",
    "socket",
  );
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    params.partner,
  );
  const target: IAutoMovieRigidTransform = HumanPropFrame.parent(
    collar(partner, context.start),
    wardrobeHands.frame(wear),
  );
  const kept: IAutoMovieRigidTransform = HumanPropFrame.parent(
    target,
    held.frame,
  );
  const carrying: IAutoMovieRigidTransform = wardrobeHands.grip(
    body,
    entry.posture,
    hand,
  );
  const arrival: number = wardrobeHands.duration(carrying, kept);
  const release: number = arrival + params.hold + SETTLE;
  const duration: number = release + wardrobeHands.duration(kept, carrying);
  const posture: (
    t: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
  ) => IAutoMovieMotionHumanPosture = (
    t: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
  ): IAutoMovieMotionHumanPosture =>
    wardrobeHands.arm(
      body,
      entry.posture,
      hand,
      t <= release
        ? wardrobeHands.path(carrying, kept, t / arrival)
        : wardrobeHands.path(
            kept,
            carrying,
            (t - release) / (duration - release),
          ),
      channels,
    );
  wardrobeHands.verify(
    context,
    posture(arrival),
    hand,
    kept,
    wardrobeHands.MISS,
  );
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    duration,
  );
  const worn: number = release / duration;

  // The holding arm is laid as one course over the grip's goal
  // (`courseArmGoal`): the planner's carry to the collar, the goal held
  // with branch and swivel continuity through the threading, and the
  // planner's own return to the carrying grip, kept clear of the body,
  // in place of a fresh fit at each second, whose straight return took
  // the fingers through the hips. The reach check above and the jacket's
  // roll in the hand read the goal itself.
  return courseArmGoal({
    context,
    side: hand,
    rest: AutoMovieMotionHumanArm.angles(entry.pose, hand),
    span: { start: 0, ready: arrival, relax: release, end: duration },
    plan: {
      ...base,
      events: [
        { name: "collarReady", share: arrival / duration },
        { name: "jacketWorn", share: worn },
        { name: "relax", share: 1 },
      ],
      hands: [hand],
      contacts: [
        ...base.contacts,
        {
          ...wardrobeHands.contact(params.prop, hand, 0, worn),
          inHand: (share: number): IAutoMovieRigidTransform => {
            const at: number = share * release;
            return wardrobeHands.roll(
              body,
              posture(at),
              hand,
              wardrobeHands.path(carrying, kept, at / arrival),
              at / arrival,
            );
          },
        },
      ],
      wears: [
        {
          prop: params.prop,
          bone: "chest",
          from: worn,
          wearer: params.partner,
        },
      ],
      // The partner's body, behind which the arm carries the jacket, is
      // the arm's obstacle too (`AutoMovieMotionHumanPartnerClear`). A
      // demand that leaves the arm out (the arm on its course) reads
      // neither its goal nor the partner.
      posture: (
        t: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      ): IAutoMovieMotionHumanPosture =>
        channels !== undefined && !channels.includes(`${hand}Arm`)
          ? posture(t, channels)
          : AutoMovieMotionHumanPartnerClear.onto(
              posture(t),
              `${hand}Arm`,
              AutoMovieMotionHumanPartnerClear.at(partner, context.start + t),
            ),
    },
  });
}

/**
 * Help a partner into a coat. The dresser's holding hand carries the jacket's
 * `wear` socket up to the partner's collar, read from the partner's shoulders
 * and heading at the action's start, and holds it there still for the authored
 * span. Meanwhile the partner threads each sleeve with `wardrobe`'s `sleeveIn`,
 * whose openings stay where the held jacket keeps them. Then the hand lets go,
 * the jacket is worn on the partner's chest from that instant, and the hand
 * returns. The jacket thus has one carrier at a time: the dresser's grip, then
 * the partner's chest.
 */
export const coatPartner: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCoatPartner> =
  {
    name: "coatPartner",
    interrupts: {
      any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
    },
    plan: planCoatPartner,
  };

/**
 * The partner's collar: mid-shoulders plus the jacket's collar offset, turned
 * to the partner's heading.
 */
function collar(
  partner: IAutoMovieMotionHumanPerformerReader,
  seconds: number,
): IAutoMovieRigidTransform {
  const names: readonly AutoMovieHumanoidBone[] = [
    "leftUpperArm",
    "rightUpperArm",
  ];
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    partner.bones(seconds, new Set(names));
  const rotation: IAutoMovieRigidTransform["rotation"] =
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, partner.root(seconds).yaw);
  return {
    position: Vector3.add(
      Vector3.lerp(
        bones.get("leftUpperArm")!.worldPosition,
        bones.get("rightUpperArm")!.worldPosition,
        0.5,
      ),
      Quaternion.rotateVector(rotation, COLLAR),
    ),
    rotation,
  };
}
