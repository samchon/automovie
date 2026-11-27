import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrutchSit,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../../audit/internal/AutoMovieMotionHumanAuditTangle";
import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { seated } from "../../everyday/internal/seated";
import { sit } from "../../everyday/internal/sit";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanArmGeometry } from "../../posture/internal/HumanArmGeometry";
import { HumanArmWristShell } from "../../posture/internal/HumanArmWristShell";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { crutchSitKit } from "./crutchSitKit";
import { crutchSitPath } from "./crutchSitPath";

/**
 * Sit down onto a chair with two crutches, in the prescribed order (Cornell
 * Health and HealthLinkBC, Using crutches), from standing with the crutches
 * standing on their tips beside the body.
 *
 * First each hand closes on its crutch's handgrip where it stands (`taken`,
 * `crutchSitPath.grasped`) while the injured leg lifts off the floor to
 * `STANDING`. Then both crutches are gathered into the injured side's hand
 * (`gathered`): both hands carry their crutches to stand upright side by side
 * before the body (`crutchSitKit.gathered`), and the sound crutch is worn on
 * the injured side's hand from then on. Then the sit law lowers the body while
 * the sound hand reaches back for the chair, onto its armrest on the sound side
 * as the sit law places a hand there, or onto the seat beside the hip, as the
 * seat takes the body (`reached`); a standing hand cannot reach an armrest
 * behind the hips, so the reach rides the descent as the sit law's own does.
 * The injured side's hand brings the crutches down to its seated place beside
 * the thigh, the crutches tilting top back as their tips slide forward on the
 * floor to where the crutch's length reaches that place, and the injured leg
 * goes from `STANDING` to `SEATED`. As the shoulder drops, the crutches can
 * slide across the floor just far enough to keep the holding wrist clear of the
 * elbow's folded reach limit, with the grip transform kept throughout.
 *
 * @param context The crutch sit's context.
 * @param kit Its shared reads.
 * @returns The order's plan before the arms are coursed.
 * @throws {HumanRefusal} When no seat is named.
 */
export function crutchSitDown(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrutchSit>,
  kit: crutchSitKit.IKit,
): crutchSitKit.IOrder {
  const { body, entry, injured, sound, crutch, subject }: crutchSitKit.IKit =
    kit;
  const seat: IAutoMovieMotionHumanSeated.ISeat | undefined =
    context.params.seat;
  if (seat === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "seat",
      value: null,
      reason: "a crutch sit names the chair it sits on",
      fix: "give the seat",
    });
  const f: IAutoMovieVector3 = crutchSitKit.forward(seat.yaw);
  const m: (typeof body)["measure"] = body.measure;

  // Each hand takes its crutch's handgrip where the crutch stands.
  const held = (side: AutoMovieHumanSide): IAutoMovieMotionHumanHeld.IHeld =>
    crutchSitPath.grasped(
      side,
      crutch[side],
      kit.start(side),
      entry.yaw,
      subject(side),
      kit.affordances(side),
    );
  const hA: IAutoMovieMotionHumanHeld.IHeld = held(injured);
  const hB: IAutoMovieMotionHumanHeld.IHeld = held(sound);
  const reachOf = (side: AutoMovieHumanSide): number =>
    Vector3.distance(
      crutchSitPath.socket(body, context.entry.pose, side),
      kit.goal(side, side === injured ? hA : hB, kit.start(side)).point,
    );
  const take: number = AutoMovieMotionHumanTiming.transport(
    Math.max(reachOf("left"), reachOf("right")),
  );
  const lifted: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
    resolveHumanPosture(body, entry),
    `${injured}Leg`,
  );

  // The seated hand's grip place beside the injured thigh, and the tip on
  // the floor ahead of it from which the crutch's length reaches it.
  const cA: crutchSitPath.ICrutch = crutch[injured];
  const seatedAt: IAutoMovieVector3 = Vector3.add(
    Vector3.add(
      seat.at,
      Vector3.scale(
        crutchSitKit.lateral(seat.yaw, injured),
        m.hipHalfWidth + m.thighRadius + BESIDE,
      ),
    ),
    {
      x: -f.x * m.thigh * 0.5,
      y: 2 * m.thighRadius + 0.03,
      z: -f.z * m.thigh * 0.5,
    },
  );
  const tilt: number =
    (Math.acos(Math.min(1, seatedAt.y / cA.length)) * 180) / Math.PI;
  const tip: IAutoMovieVector3 = Vector3.add(
    { x: seatedAt.x, y: 0, z: seatedAt.z },
    Vector3.scale(f, cA.length * Math.sin((tilt * Math.PI) / 180)),
  );
  const gatheredA: IAutoMovieRigidTransform = crutchSitKit.gathered(
    kit,
    entry,
    injured,
  );
  const gatheredB: IAutoMovieRigidTransform = crutchSitKit.gathered(
    kit,
    entry,
    sound,
  );
  const tipA: IAutoMovieVector3 = Vector3.add(
    gatheredA.position,
    Quaternion.rotateVector(gatheredA.rotation, cA.tip),
  );
  const gripA: IAutoMovieVector3 = Vector3.add(
    gatheredA.position,
    Quaternion.rotateVector(gatheredA.rotation, cA.grip),
  );
  const gather: number = AutoMovieMotionHumanTiming.transport(
    Math.max(
      Vector3.distance(kit.start(injured).position, gatheredA.position),
      Vector3.distance(kit.start(sound).position, gatheredB.position),
    ),
  );

  // The sound hand's rest on the chair, on the body's posture as it lowers:
  // its armrest as the sit law places a hand there, or the seat beside the hip.
  const armrest: IAutoMovieVector3 | undefined = seat.armrests?.[sound];
  const settled = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieHumanLimbGoal =>
    armrest !== undefined
      ? seated.armrest(body, posture, sound, armrest, seat.yaw)
      : {
          ...HumanHand.place(
            body,
            sound,
            "palm",
            Vector3.add(
              Vector3.add(
                seat.at,
                Vector3.scale(
                  crutchSitKit.lateral(seat.yaw, sound),
                  m.hipHalfWidth + m.thighRadius + BESIDE,
                ),
              ),
              { x: -f.x * m.thigh * 0.6, y: 0, z: -f.z * m.thigh * 0.6 },
            ),
            HumanHand.facing(sound, seat.yaw, {
              fingers: "forward",
              palm: "down",
            }),
            "flat",
          ),
          bend: AutoMovieMotionHumanBend.hang(body, posture, sound, 0.2),
        };
  const plan: IAutoMovieMotionHumanActionPlan = sit.plan({
    ...context,
    params: { seat },
  });
  const carried: number = take + gather;

  // The sit starts once the crutches are gathered; the sound hand reaches
  // back for the chair as the body lowers, onto it as the seat takes the
  // body, as the sit law brings a hand to its armrest.
  const lower: number = carried;
  const descent: number = kit.at(plan, "seated");
  const reach: number = kit.at(plan, "seatContact");
  const duration: number = lower + plan.duration;
  const arm: IAutoMovieMotionHumanArmGeometry.ISetup = HumanArmGeometry.prepare(
    body,
    injured,
  );
  const minimum: number = HumanArmWristShell(arm);
  const shoulder: AutoMovieHumanoidBone = arm.bones.upper;
  const shoulderAt: ReturnType<typeof StrikingBody.prepareTrunk> | undefined =
    minimum > 0
      ? StrikingBody.prepareTrunk(
          body,
          new Set<AutoMovieHumanoidBone>([shoulder]),
        )
      : undefined;
  const outward: IAutoMovieVector3 = crutchSitKit.lateral(seat.yaw, injured);
  const hold = (
    under: IAutoMovieMotionHumanPosture,
    frame: IAutoMovieRigidTransform,
  ): IAutoMovieHumanLimbGoal => {
    const goal: IAutoMovieHumanLimbGoal = kit.goal(injured, hA, frame);
    const at: IAutoMovieResolvedBone | undefined =
      shoulderAt?.(under).get(shoulder);
    if (at === undefined) return goal;
    const spread: IAutoMovieRigidTransform = crutchSitPath.outsideFold(
      frame,
      at.worldPosition,
      goal.point,
      outward,
      minimum,
      AutoMovieMotionHumanAuditTangle.BUILT,
    );
    return spread === frame ? goal : kit.goal(injured, hA, spread);
  };

  const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
    const t: number = Math.min(duration, Math.max(0, seconds));
    const under: IAutoMovieMotionHumanPosture =
      t < lower ? entry : plan.posture(t - lower);
    const k: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(1, Math.max(0, (t - lower) / descent)),
    );
    const moved = (side: AutoMovieHumanSide): IAutoMovieRigidTransform =>
      crutchSitPath.carried(
        kit.start(side),
        side === injured ? gatheredA : gatheredB,
        (t - take) / gather,
      );
    const injuredArm: IAutoMovieHumanLimbGoal =
      t < carried
        ? kit.goal(injured, hA, moved(injured))
        : hold(
            under,
            crutchSitPath.slid(
              cA,
              Vector3.lerp(tipA, tip, k),
              Vector3.lerp(gripA, seatedAt, k),
              f,
            ),
          );
    const soundArm: IAutoMovieHumanLimbGoal =
      t < carried
        ? kit.goal(sound, hB, moved(sound))
        : crutchSitKit.blend(
            kit.goal(sound, hB, gatheredB),
            settled(under),
            (t - carried) / reach,
          );
    return kit.write(
      under,
      injured === "left"
        ? { left: injuredArm, right: soundArm }
        : { left: soundArm, right: injuredArm },
      t < take
        ? crutchSitKit.leg(t / take, lifted, STANDING)
        : crutchSitKit.leg((t - lower) / descent, STANDING, SEATED),
    );
  };
  const later = (share: number): number =>
    (lower + share * plan.duration) / duration;
  const grip = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanContactWindow["part"] =>
    side === "left" ? "leftHand" : "rightHand";
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: `${sound}Foot`,
      kind: "plant",
      from: 0,
      to: lower / duration,
      support: { kind: "ground" },
    },
    ...plan.contacts
      .filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.part !== `${injured}Foot` &&
          w.part !== "leftHand" &&
          w.part !== "rightHand",
      )
      .map(
        (
          w: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...w,
          from: later(w.from),
          to: later(w.to),
        }),
      ),
    {
      part: grip(injured),
      kind: "grip",
      from: take / duration,
      to: 1,
      support: { kind: "prop", subject: subject(injured) },
    },
    {
      part: grip(sound),
      kind: "grip",
      from: take / duration,
      to: carried / duration,
      support: { kind: "prop", subject: subject(sound) },
    },
    {
      part: grip(sound),
      kind: "plant",
      from: (lower + reach) / duration,
      to: 1,
      support: HumanSupportFrame(context),
    },
  ];
  const events: IAutoMovieMotionEvent[] = [
    { name: "taken", share: take / duration },
    { name: "gathered", share: carried / duration },
    { name: "reached", share: (lower + reach) / duration },
    ...plan.events.map(
      (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
        ...e,
        share: later(e.share),
      }),
    ),
  ];
  return {
    duration,
    ready: take,
    posture,
    contacts,
    events,
    holds: [{ side: injured, prop: subject(injured), from: 1 }],
    wears: [
      {
        prop: subject(sound),
        bone: `${injured}Hand`,
        from: carried / duration,
      },
    ],
    base: plan.base,
  };
}

/**
 * The injured leg held off the floor standing, degrees: the crutch walk's
 * three-point gait's hip and knee flexion.
 */
const STANDING: IAutoMovieHumanLimbReference = {
  upper: [30, 0, 0],
  lower: [80, 0, 0],
};

/**
 * The injured leg held forward off the floor seated, degrees (provisional: the
 * thigh level, the shank 30 degrees forward of vertical).
 */
const SEATED: IAutoMovieHumanLimbReference = {
  upper: [90, 0, 0],
  lower: [60, 0, 0],
};

/**
 * How far a seated hand rests beside the thigh's side, metres (provisional: a
 * hand's breadth out).
 */
const BESIDE: number = 0.08;
