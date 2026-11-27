import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/HumanTrunk";
import { wardrobeHands } from "./wardrobeHands";

/** One bone's clinical flexion, abduction and twist, degrees. */
type AutoMovieMotionHumanJointAngles = readonly [number, number, number];

/** Keep the seat and other foot fixed while presenting the working foot. */
export function wardrobeFootRaisedLeg(
  context: IAutoMovieMotionHumanActionContext<wardrobeHands.IPropParams>,
  side: AutoMovieHumanSide,
): IAutoMovieMotionHumanActionPlan {
  const { entry, body }: typeof context = context;
  const start: IAutoMovieMotionHumanPosture = entry.posture;
  const part: AutoMovieHumanoidBone =
    side === "left" ? "leftFoot" : "rightFoot";
  const opposite: AutoMovieHumanoidBone =
    side === "left" ? "rightFoot" : "leftFoot";
  if (
    context.carrier !== undefined ||
    entry.base.kind !== "seated" ||
    entry.base.seat === undefined ||
    entry.base.seat.astride === true ||
    !entry.supports.some(
      (contact: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        contact.kind === "seat",
    ) ||
    !entry.supports.some(
      (contact: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        contact.part === opposite && contact.kind === "plant",
    )
  )
    throw wardrobeHands.refusal(
      "base",
      entry.base.kind,
      "footwear exchange needs a stationary chair and an opposite foot plant",
    );

  const thigh: AutoMovieHumanoidBone =
    side === "left" ? "leftUpperLeg" : "rightUpperLeg";
  const knee: AutoMovieHumanoidBone =
    side === "left" ? "leftLowerLeg" : "rightLowerLeg";
  const limb: AutoMovieHumanLimb = side === "left" ? "leftLeg" : "rightLeg";
  const joints: IAutoMovieMotionHumanPosture["joints"] = { ...start.joints };
  for (const joint of entry.pose.joints)
    if (joint.bone === thigh || joint.bone === knee || joint.bone === part)
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
  const hip: AutoMovieMotionHumanJointAngles = joints[thigh]!;
  const shin: AutoMovieMotionHumanJointAngles = joints[knee]!;
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...start.limbs };
  delete limbs[limb];
  const seat: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.sockets.seat;
  const socket: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieVector3 = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 => {
    const bone: IAutoMovieRigidTransform = wardrobeHands.bone(
      body,
      posture,
      seat.bone,
    );
    return Vector3.add(
      bone.position,
      Quaternion.rotateVector(bone.rotation, seat.point),
    );
  };
  const occupied: IAutoMovieVector3 = socket(start);
  const up: number = 0.62 * (context.tempo ?? 1);
  const wait: number = 2.4 * (context.tempo ?? 1);
  const total: number = 2 * up + wait;
  const posture: (seconds: number) => IAutoMovieMotionHumanPosture = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const share: number = AutoMovieEngineMotionSampling.minimumJerk(
      Math.min(1, Math.max(0, Math.min(seconds, total - seconds) / up)),
    ).s;
    if (share === 0) return start;
    const bend: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      joints,
      105 * share,
      0,
    );
    const leaned: IAutoMovieMotionHumanPosture = {
      ...start,
      joints: bend.joints,
    };
    const anchored: IAutoMovieMotionHumanPosture = {
      ...leaned,
      root: Vector3.add(
        leaned.root,
        Vector3.subtract(occupied, socket(leaned)),
      ),
    };
    return {
      ...anchored,
      limbs,
      joints: {
        ...anchored.joints,
        [thigh]: [hip[0] + 38 * share, hip[1], hip[2]],
        [knee]: [shin[0] + 6 * share, shin[1], shin[2]],
      },
    };
  };
  const contacts: IAutoMovieMotionHumanContactWindow[] = entry.supports
    .filter(
      (contact: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        contact.part !== part,
    )
    .map(
      (
        contact: IAutoMovieMotionHumanEntryState.ISupport,
      ): IAutoMovieMotionHumanContactWindow => ({
        ...contact,
        from: 0,
        to: 1,
      }),
    );
  const plant: IAutoMovieMotionHumanEntryState.ISupport | undefined =
    entry.supports.find(
      (contact: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        contact.part === part,
    );
  if (plant !== undefined)
    contacts.push({ ...plant, from: 0, to: 0 }, { ...plant, from: 1, to: 1 });
  return {
    base: entry.base,
    duration: total,
    events: [
      { name: "footRaised", share: up / total },
      { name: "footLowering", share: (up + wait) / total },
      { name: "footDown", share: 1 },
    ],
    contacts,
    posture,
  };
}
