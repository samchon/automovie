import { Quaternion, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieAffordance, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanCoatPartner, IAutoMovieMotionHumanHeld, IAutoMovieMotionHumanPerformerReader, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPropReader, IAutoMovieResolvedBone, IAutoMovieRigidTransform } from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanPartnerClear } from "../../compose/internal/AutoMovieMotionHumanPartnerClear";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { requireOtherPerformer } from "../../touch/internal/requireOtherPerformer";
import { wardrobeHands } from "./wardrobeHands";
import * as CoatPartnerData from "./CoatPartnerData";

/*
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
      any: [
        { window: { start: "relax", end: 1 }, kind: "inertialize", entry: 0 },
      ],
    },
    plan: planCoatPartner,
  };

/*
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
  requireOtherPerformer(
    context.subject,
    params.partner,
    "a performer puts on its own jacket with wardrobe",
  );
  if (!(params.hold > 0))
    throw wardrobeHands.refusal(
      "hold",
      params.hold,
      "hold the jacket open for a positive span while the partner threads its sleeves",
    );
  const hand: AutoMovieHumanSide =
    params.hand ?? (entry.holds.right === params.prop ? "right" : "left");
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
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
  const release: number = arrival + params.hold + CoatPartnerData.SETTLE;
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

/*
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
      Quaternion.rotateVector(rotation, CoatPartnerData.COLLAR),
    ),
    rotation,
  };
}
