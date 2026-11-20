import {
  Quaternion,
  Vector3,
  minimumJerk,
  quaternionFromAutoMovieBasis,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { wardrobeHands } from "./wardrobeHands";

/** Positive axial clearance at either end of a visible hand-foot exchange. */
const AIR: number = 0.025;

/**
 * Stage seated shoe or sock transfer with one foot raised and the other grounded.
 *
 * The seat and opposite foot carry the body while the working foot rises.
 * The thigh and lower leg lift while the spine leans over the working foot. The five distinct
 * phases recorded in the seated shoe study include raising a leg and inserting
 * the foot (Jin et al., Table 2, https://pmc.ncbi.nlm.nih.gov/articles/PMC6451954/).
 * The slow hand phase here is an authored stage timing.
 *
 * @param context The live entry and held or worn footwear.
 * @param side The foot that enters or leaves the footwear.
 * @param hand The hand that holds the prop.
 * @param remove Whether to take it off instead of putting it on.
 * @returns A seated performance with an actual aperture crossing and custody transfer.
 * @throws {HumanRefusal} For a failed seat, reach, identity or fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the seated support, foot side, passage, hold phase and study.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the posed heel and toe to construct a foot-relative model frame and directs the held shell along its real top opening.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fit the raised leg, admit the model opening, fit hand targets, then attach transfer contacts and events.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The admitted seat and contralateral support stay fixed while the existing articulated leg lifts.
 * @evidence contracts/development/implementation.md#efficient-algorithms The raised ankle is fixed during insertion. Each moving hand sample is one existing limb target.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the actual entry joint angles, trunk inclination and native rigid object custody records.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned plan retains only shared action data, endpoints and phases. Each rolled grip uses current authored FK without retaining a pose history.
 */
export function wardrobeFoot(
  context: IAutoMovieMotionHumanActionContext<{ prop: string }>,
  side: AutoMovieHumanSide,
  hand: AutoMovieHumanSide,
  remove: boolean,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  if (remove && entry.holds[hand] !== undefined)
    throw wardrobeHands.refusal(
      "hand",
      hand,
      "clear the hand that removes the footwear",
    );
  const base: IAutoMovieMotionHumanActionPlan = raisedLeg(context, side);
  const holdStart: number = event(base, "footRaised");
  const holdEnd: number = event(base, "footLowering");
  const hold: number = holdEnd - holdStart;
  const gripTime: number = holdStart + hold * 0.24;
  const passTime: number = holdStart + hold * 0.49;
  const finish: number = holdStart + hold * 0.7;
  const atWork: IAutoMovieMotionHumanPosture = base.posture(
    holdStart + hold / 2,
  );
  const reader: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
  const opening: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    "opening",
    "aperture",
  );
  wardrobeHands.middle(opening);
  const wear: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    "wear",
    "socket",
  );
  const grip: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    "hold",
    "handle",
  );
  const foot: AutoMovieHumanoidBone =
    side === "left" ? "leftFoot" : "rightFoot";
  const own: IAutoMovieRigidTransform = footFrame(body, atWork, side);
  if (
    !(opening.height! >= body.measure.footLength + AIR) ||
    !(opening.width! >= body.measure.footBreadth + AIR / 2)
  )
    throw wardrobeHands.refusal(
      "opening",
      params.prop,
      "the footwear opening cannot clear the selected foot",
    );
  const seated: IAutoMovieRigidTransform = HumanPropFrame.parent(
    own,
    wardrobeHands.frame(wear),
  );
  const up: IAutoMovieVector3 = Quaternion.rotateVector(seated.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const depth: number = Vector3.dot(
    Vector3.subtract(
      wardrobeHands.middle(opening).position,
      wear.frame.translation,
    ),
    { x: 0, y: 1, z: 0 },
  );
  if (!(depth > 0 && Number.isFinite(depth)))
    throw wardrobeHands.refusal(
      "opening",
      opening.id,
      "the heel seat must lie below the actual opening",
    );
  const aligned: IAutoMovieRigidTransform = wardrobeHands.displaced(
    seated,
    Vector3.scale(up, -depth),
  );
  const outside: IAutoMovieRigidTransform = wardrobeHands.displaced(
    aligned,
    Vector3.scale(up, -AIR),
  );
  const resting: IAutoMovieRigidTransform = wardrobeHands.grip(
    body,
    atWork,
    hand,
  );
  const picked: IAutoMovieMotionHumanHeld.IHeld | undefined = remove
    ? undefined
    : AutoMovieMotionHumanHeld.of(context, hand, params.prop);

  // A worn foot determines the approach frame without asking the hand that will take over.
  const worn: IAutoMovieRigidTransform = remove
    ? HumanPropFrame.compose(
        wardrobeHands.bone(body, atWork, foot),
        HumanPropFrame.relative(
          wardrobeHands.bone(body, entry.posture, foot),
          reader.frame(context.start - 1e-6),
        ),
      )
    : seated;
  if (
    remove &&
    (Vector3.distance(worn.position, seated.position) > wardrobeHands.MISS ||
      Quaternion.angle(worn.rotation, seated.rotation) > Math.PI / 12)
  )
    throw wardrobeHands.refusal(
      "opening",
      params.prop,
      "the named prop is not fitted to the selected foot",
    );
  const removalGrip: IAutoMovieRigidTransform = gripFrame(worn, grip, hand);
  const caught: IAutoMovieRigidTransform = wardrobeHands.grip(
    body,
    wardrobeHands.arm(body, atWork, hand, removalGrip),
    hand,
  );
  const offset: IAutoMovieRigidTransform =
    picked?.frame ?? HumanPropFrame.relative(caught, worn);
  const fit = (goal: IAutoMovieRigidTransform): IAutoMovieRigidTransform =>
    HumanPropFrame.parent(goal, offset);
  const target = (seconds: number): IAutoMovieRigidTransform => {
    if (seconds <= gripTime)
      return wardrobeHands.path(
        resting,
        remove ? removalGrip : fit(outside),
        (seconds - holdStart) / (gripTime - holdStart),
      );
    if (seconds <= passTime)
      return wardrobeHands.path(
        remove ? removalGrip : fit(outside),
        fit(aligned),
        (seconds - gripTime) / (passTime - gripTime),
      );
    if (seconds <= finish)
      return wardrobeHands.path(
        fit(aligned),
        fit(remove ? outside : seated),
        (seconds - passTime) / (finish - passTime),
      );
    return wardrobeHands.path(
      fit(remove ? outside : seated),
      resting,
      (seconds - finish) / (holdEnd - finish),
    );
  };
  const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
    const support: IAutoMovieMotionHumanPosture = base.posture(seconds);
    return seconds < holdStart || seconds > holdEnd
      ? support
      : wardrobeHands.arm(body, support, hand, target(seconds));
  };
  for (const at of [gripTime, passTime, finish])
    wardrobeHands.verify(
      context,
      posture(at),
      hand,
      target(at),
      wardrobeHands.MISS,
    );
  const from: number = remove ? gripTime : 0;
  const to: number = remove ? base.duration : finish;
  const contact: IAutoMovieMotionHumanContactWindow = {
    ...wardrobeHands.contact(
      params.prop,
      hand,
      from / base.duration,
      to / base.duration,
    ),
    // The small round pull can roll in the fingers as the shell aligns to the foot.
    // Keep its physical centre at the admitted hand target through the passage.
    inHand: (share: number): IAutoMovieRigidTransform => {
      const time: number = from + share * (to - from);
      const at: number = Math.min(time, finish);
      const rollStart: number = remove ? gripTime : holdStart;
      const rollEnd: number = remove ? passTime : gripTime;
      return wardrobeHands.roll(
        body,
        posture(at),
        hand,
        target(at),
        (at - rollStart) / (rollEnd - rollStart),
      );
    },
  };
  return {
    ...base,
    events: [
      ...base.events,
      { name: "footwearReady", share: gripTime / base.duration },
      { name: "footwearOpening", share: passTime / base.duration },
      {
        name: remove ? "footwearClear" : "footwearWorn",
        share: finish / base.duration,
      },
      { name: "relax", share: 1 },
    ],
    contacts: [...base.contacts, contact],
    hands: [hand],
    ...(remove
      ? {
          holds: [
            { prop: params.prop, side: hand, from: gripTime / base.duration },
          ],
        }
      : {
          wears: [
            { prop: params.prop, bone: foot, from: finish / base.duration },
          ],
        }),
    posture,
  };
}

/** Find an actual phase boundary in seconds. */
function event(plan: IAutoMovieMotionHumanActionPlan, name: string): number {
  return (
    plan.events.find((key): boolean => key.name === name)!.share * plan.duration
  );
}

/** Construct the actual heel-based foot frame held during the seated lift. */
function footFrame(
  body: IAutoMovieMotionHumanActionContext["body"],
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
): IAutoMovieRigidTransform {
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, posture),
  );
  const [heel, , toe]: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
    body,
    bones,
    side,
  );
  const ankle: IAutoMovieVector3 = bones.get(
    side === "left" ? "leftFoot" : "rightFoot",
  )!.worldPosition;
  const forward: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(toe!.point, heel!.point),
  );
  const across: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(Vector3.subtract(ankle, heel!.point), forward),
  );
  const up: IAutoMovieVector3 = Vector3.cross(forward, across);
  return {
    position: heel!.point,
    rotation: quaternionFromAutoMovieBasis(across, up, forward),
  };
}

/** At removal, align the hand across the rear pull while it still rides the foot. */
function gripFrame(
  prop: IAutoMovieRigidTransform,
  hold: IAutoMovieAffordance,
  hand: AutoMovieHumanSide,
): IAutoMovieRigidTransform {
  const world: IAutoMovieRigidTransform = HumanPropFrame.compose(
    prop,
    wardrobeHands.frame(hold),
  );
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(world.rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(world.rotation, {
    x: 0,
    y: -1,
    z: 0,
  });
  return {
    position: world.position,
    rotation: HumanHand.rotation(hand, { fingers: axis, palm: normal }),
  };
}

/** Keep the seat and other foot fixed while presenting the working foot. */
function raisedLeg(
  context: IAutoMovieMotionHumanActionContext<{ prop: string }>,
  side: AutoMovieHumanSide,
): IAutoMovieMotionHumanActionPlan {
  const { entry, body }: typeof context = context;
  const start: IAutoMovieMotionHumanPosture = entry.posture;
  const part: "leftFoot" | "rightFoot" =
    side === "left" ? "leftFoot" : "rightFoot";
  const opposite: "leftFoot" | "rightFoot" =
    side === "left" ? "rightFoot" : "leftFoot";
  if (
    context.carrier !== undefined ||
    entry.base.kind !== "seated" ||
    entry.base.seat === undefined ||
    entry.base.seat.astride === true ||
    !entry.supports.some((contact): boolean => contact.kind === "seat") ||
    !entry.supports.some(
      (contact): boolean =>
        contact.part === opposite && contact.kind === "plant",
    )
  )
    throw wardrobeHands.refusal(
      "base",
      entry.base.kind,
      "footwear exchange needs a stationary chair and an opposite foot plant",
    );

  const thigh = side === "left" ? "leftUpperLeg" : "rightUpperLeg";
  const knee = side === "left" ? "leftLowerLeg" : "rightLowerLeg";
  const limb = side === "left" ? "leftLeg" : "rightLeg";
  const joints = { ...start.joints };
  for (const joint of entry.pose.joints)
    if (joint.bone === thigh || joint.bone === knee || joint.bone === part)
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
  const hip = joints[thigh]!;
  const shin = joints[knee]!;
  const limbs = { ...start.limbs };
  delete limbs[limb];
  const seat = body.surfaces.sockets.seat;
  const socket = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 => {
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
  const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
    const share: number = minimumJerk(
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
    .filter((contact): boolean => contact.part !== part)
    .map(
      (contact): IAutoMovieMotionHumanContactWindow => ({
        ...contact,
        from: 0,
        to: 1,
      }),
    );
  const plant = entry.supports.find(
    (contact): boolean => contact.part === part,
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
