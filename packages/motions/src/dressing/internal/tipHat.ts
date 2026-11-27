import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanGrip,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTipHat,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/composeAutoMovieMotionHumanAction";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanGrasp } from "../../handling/HumanGrasp";
import { HumanGrip } from "../../handling/HumanGrip";
import { HumanPrehension } from "../../handling/HumanPrehension";
import { HumanRefusal } from "../../law/HumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { requireHatHand } from "./requireHatHand";

/**
 * A shared fit and seating tolerance, metres, from the motion campaign's 15 mm
 * contact bound.
 */
const CONTACT: number = 0.015;

/**
 * Take a stiff hat by its declared brim grip, lift it briefly and set it back
 * on the head (Emily Post, _Etiquette_, 1922, “Lifting the Hat,”
 * https://www.gutenberg.org/ebooks/14314). The lift is provisionally one third
 * of the head radius. `strokeStart` closes the grip, `stroke` marks the lift's
 * apex and `strokeEnd` reseats the hat. The action uses a still base. Stage the
 * hat on the performer's crown with its wear socket facing inward and keep it
 * worn until the action starts.
 */
export const tipHat: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTipHat> =
  {
    name: "tipHat",
    interrupts: {
      stand: [
        { window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 },
      ],
      walk: [
        { window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 },
      ],
    },
    plan,
  };
/** The alternatives of `PlanLimb`'s site. */
type PlanLimb = "leftArm" | "rightArm";

/**
 * Plan the right or left arm's grasp, lift, reseat and return over the entry
 * stance.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTipHat>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params } = context;
  const side: AutoMovieHumanSide = params.hand ?? "right";
  requireHatHand(side, entry.holds[side]);

  const bones: ReturnType<typeof poseBones> = poseBones(body, entry.pose);
  const head: IAutoMovieResolvedBone = bones.get("head")!;
  const crown = resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.regions.crown,
    head,
  );
  const reader: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
  const seated = wornFrame(context.subject, reader, head, crown, context.start);
  const grasp: IAutoMovieMotionHumanGrasp.ITarget = HumanGrasp.at(
    reader.prop,
    "hold",
    seated.frame,
  );
  const rise: number = body.measure.headRadius / 3;
  const lift: IAutoMovieVector3 = Vector3.scale(crown.normal, rise);

  const authored: IAutoMovieMotionHumanHand.IWrist = HumanGrasp.hand(
    body,
    side,
    grasp,
  );
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.solve({
    body,
    posture: entry.posture,
    side,
    point: authored.point,
    rotation: authored.rotation,
    fallback: "hang",
  });
  const fit: IAutoMovieMotionHumanGrasp.IReach = HumanGrasp.reachable(
    body,
    entry.posture,
    side,
    bend,
    (_: number, tilt: number): IAutoMovieMotionHumanHand.IWrist =>
      HumanGrasp.hand(body, side, grasp, tilt),
    HumanGrasp.TURNS,
    (
      _goal: IAutoMovieMotionHumanHand.IWrist,
      shown: IAutoMovieMotionHumanHand.IWrist,
    ): IAutoMovieMotionHumanGrasp.IKey[] => [
      {
        posture: entry.posture,
        wrist: {
          point: Vector3.add(shown.point, lift),
          rotation: shown.rotation,
        },
        bend,
      },
    ],
    [0],
  );

  const reach: number = HumanPrehension.duration(
    context.skill,
    context.random("reach"),
    gap(bones.get(`${side}Hand`)!.worldPosition, fit.shown.point),
    grasp.width,
  );
  const halfLift: number = AutoMovieMotionHumanTiming.PAUSES.beat / 2;
  const pace: number = context.tempo ?? 1;
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: reach * pace,
    attack: halfLift * pace,
    follow: halfLift * pace,
    hold: AutoMovieMotionHumanTiming.PAUSES.brief * pace,
    retract: reach * pace,
  });
  const entryElbow: IAutoMovieVector3 = bones.get(
    `${side}LowerArm`,
  )!.worldPosition;
  const reaching = (seconds: number): number =>
    clock.envelope(["start", "ready"], ["relax", "end"], seconds);
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.stroke({
    body,
    side,
    clock,
    origin: AutoMovieMotionHumanArm.origin(
      body,
      bones,
      { origin: entry.posture.root, yaw: entry.posture.yaw },
      side,
      "wrist",
    ),
    path: (
      _posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanArmTarget.ITarget => ({
      surface: "wrist",
      shape: "flat",
      point: Vector3.add(
        fit.shown.point,
        Vector3.scale(
          lift,
          clock.envelope(
            ["strokeStart", "stroke"],
            ["stroke", "strokeEnd"],
            seconds,
          ),
        ),
      ),
      rotation: fit.shown.rotation,
      bend: Vector3.lerp(entryElbow, bend, reaching(seconds)),
    }),
  });
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "stroke",
      primitives: [arm],
    });
  const limb: PlanLimb = `${side}Arm`;
  const fitted = (seconds: number): IAutoMovieMotionHumanPosture => {
    const at: IAutoMovieMotionHumanPosture = composed.posture(seconds);
    if (at.limbs[limb] === undefined) return at;
    return {
      ...at,
      limbs: {
        ...at.limbs,
        [limb]: {
          ...at.limbs[limb]!,
          elbow: "strain",
          reference: fit.reference,
        },
      },
    };
  };
  const ready: IAutoMovieResolvedBone = poseBones(
    body,
    resolveHumanPosture(body, fitted(clock.at("strokeStart"))),
  ).get(`${side}Hand`)!;
  const closure: IAutoMovieMotionHumanGrip.ICloseResult = HumanGrip.close(
    body,
    side,
    "precision",
    { point: ready.worldPosition, rotation: ready.worldRotation },
    grasp.colliders,
  );
  const digitGap = (digit: IAutoMovieMotionHumanGrip.Digit): number =>
    Math.abs(closure.gaps[digit] ?? Infinity);
  const pinch: number = Math.max(
    digitGap("Thumb"),
    Math.min(digitGap("Index"), digitGap("Middle")),
  );
  const open: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.fingers(
    entry.pose,
    side,
  );
  const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
    const at: IAutoMovieMotionHumanPosture = fitted(seconds);
    const close: number =
      1 -
      Math.max(
        1 - clock.linear("start", "strokeStart", seconds),
        clock.linear("strokeEnd", "relax", seconds),
      );
    return {
      ...at,
      joints: {
        ...at.joints,
        ...HumanPrehension.shape(
          { entry: open, open, closed: closure.joints },
          0.6,
          close,
        ),
      },
    };
  };

  // A fitted wrist carries the previously seated hat by a rigid transform.
  // Check both ends of the brim-to-wear line at peak, so wrist rotation also counts.
  const peak: IAutoMovieResolvedBone = poseBones(
    body,
    resolveHumanPosture(body, posture(clock.at("stroke"))),
  ).get(`${side}Hand`)!;
  const carry: IAutoMovieQuaternion = Quaternion.multiply(
    peak.worldRotation,
    Quaternion.inverse(ready.worldRotation),
  );
  const lifted = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(
      peak.worldPosition,
      Quaternion.rotateVector(
        carry,
        Vector3.subtract(point, ready.worldPosition),
      ),
    );
  const wearPoint: IAutoMovieVector3 = seated.socket;
  const liftedSocket: IAutoMovieVector3 = lifted(wearPoint);
  const miss: number = Math.max(
    pinch,
    gap(fit.wrist.point, ready.worldPosition),
    gap(liftedSocket, Vector3.add(wearPoint, lift)),
    gap(lifted(grasp.point), Vector3.add(grasp.point, lift)),
  );
  const clearance: number = Vector3.dot(
    Vector3.subtract(liftedSocket, crown.point),
    crown.normal,
  );
  if (!(miss <= CONTACT && clearance >= rise / 2))
    throw new HumanRefusal({
      kind: "reach",
      axis: "hand",
      value: side,
      reason: `The ${side} hand's largest fit error is ${(miss * 1000).toFixed(1)} mm with ${(clearance * 1000).toFixed(1)} mm crown clearance`,
      fix: "choose the other hand or stage the brim grip on the hand's side",
    });

  // The arm's goal moves with the lift, so it is planned as one course
  // (`courseArmGoal`) instead of fitted afresh at each second, where two
  // nearly tied arm solutions let one instant take the other branch. The fit
  // checks above read the goal itself.
  const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan: { ...composed, posture },
    side,
    rest: AutoMovieMotionHumanArm.angles(entry.pose, side),
    span: {
      start: clock.at("start"),
      ready: clock.at("ready"),
      relax: clock.at("relax"),
      end: clock.at("end"),
    },
    // The whole clock is the law's own, lengthened by a slower tempo.
    together: AutoMovieMotionHumanArm.together(
      context.handover,
      true,
      context.tempo,
    ),
  });
  const from: number = clock.at("strokeStart") / clock.duration;
  const to: number = clock.at("strokeEnd") / clock.duration;
  return {
    ...coursed,
    contacts: [
      ...composed.contacts,
      {
        kind: "grip",
        part: `${side}Hand`,
        support: { kind: "prop", subject: params.prop },
        from,
        to,
      },
    ],
    wears: [{ prop: params.prop, bone: "head", from: to }],
  };
}
/** The record of `IWornFrameResult`'s site. */
type IWornFrameResult = {
  frame: IAutoMovieRigidTransform;
  socket: IAutoMovieVector3;
};

/** Admit the staged attachment only when the displayed socket meets the crown. */
function wornFrame(
  subject: string,
  reader: IAutoMovieMotionHumanPropReader,
  head: IAutoMovieResolvedBone,
  crown: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place>,
  seconds: number,
): IWornFrameResult {
  const { prop } = reader;
  const worn: typeof prop.worn = prop.worn;
  const wear: IAutoMovieAffordance | undefined = prop.affordances?.find(
    (a: IAutoMovieAffordance): boolean => a.id === "wear",
  );
  const hold: IAutoMovieAffordance | undefined = prop.affordances?.find(
    (a: IAutoMovieAffordance): boolean => a.id === "hold",
  );
  if (
    worn?.subject === subject &&
    worn.bone === "head" &&
    prop.fixed !== true &&
    prop.motion === undefined &&
    prop.soft === undefined &&
    prop.hasArticulations !== true &&
    wear?.kind === "socket" &&
    hold?.kind === "handle" &&
    hold.grip === "precision"
  ) {
    const shown: IAutoMovieRigidTransform = reader.frame(seconds);
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      head.worldRotation,
      worn.offset.rotation,
    );
    const position: IAutoMovieVector3 = Vector3.add(
      head.worldPosition,
      Quaternion.rotateVector(head.worldRotation, worn.offset.position),
    );
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
    const axesAgree: boolean = [up, forward].every(
      (axis: IAutoMovieVector3): boolean =>
        Vector3.dot(
          Quaternion.rotateVector(shown.rotation, axis),
          Quaternion.rotateVector(rotation, axis),
        ) >= 0.999,
    );
    const opposed: boolean =
      Vector3.dot(
        Quaternion.rotateVector(wear.frame.rotation, up),
        Quaternion.rotateVector(hold.frame.rotation, up),
      ) <= -0.9;
    const socket: IAutoMovieVector3 = Vector3.add(
      shown.position,
      Quaternion.rotateVector(shown.rotation, wear.frame.translation),
    );
    const inward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(shown.rotation, wear.frame.rotation),
      up,
    );
    if (
      opposed &&
      axesAgree &&
      gap(shown.position, position) <= CONTACT &&
      gap(socket, crown.point) <= CONTACT &&
      Vector3.dot(inward, crown.normal) <= -0.999
    )
      return { frame: shown, socket };
  }

  throw new HumanRefusal({
    kind: "affordance",
    axis: "prop",
    value: prop.subject,
    reason: `${prop.subject} has no seated hat frame and brim grip on this performer's head`,
    fix: "stage a hat worn on this performer's head with a wear socket and a precision brim handle",
  });
}

/** World distance between two points, metres. */
function gap(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Vector3.length(Vector3.subtract(a, b));
}
