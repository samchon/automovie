import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSlipRing,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmPhrase } from "../../compose/internal/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanRefusal } from "../../law/HumanRefusal";
import { requireOtherPerformer } from "../../touch/internal/requireOtherPerformer";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { HumanWornItem } from "./HumanWornItem";
import { slipRingLean } from "./slipRingLean";
import { slipRingSteady } from "./slipRingSteady";

/*
 * Where along the proximal phalanx a ring rests, as a share from its base joint
 * (provisional: a ring sits on the phalanx's proximal third).
 */
const SEAT: number = 0.35;

/*
 * How far beyond the fingertip the ring lines up before it slides on, metres
 * (provisional: clear of the fingertip by a ring's width).
 */
const LINE_UP: number = 0.015;

/*
 * The step the band's free roll about the finger is searched by, degrees.
 */
const ROLL: number = 15;

/*
 * World up.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * Capitalized digit names used in the canonical rig's phalanx identifiers.
 */
const PHALANX_NAME: Readonly<
  Record<
    IAutoMovieMotionHumanSlipRing.Finger,
    Capitalize<IAutoMovieMotionHumanSlipRing.Finger>
  >
> = { index: "Index", middle: "Middle", ring: "Ring", little: "Little" };

/*
 * Slip a ring onto a partner's finger. The partner's presented hand is read
 * where it is at the action's start, so the partner presents it first
 * (`presentHand`). The dresser's other hand takes the partner's forearm with
 * the palm laid on its collider (`HumanColliders.cast`). When the partner's
 * wrist faces the dresser, the fingers follow the approach along the contact
 * plane. The steadying palm lands before the ring hand leaves its rest and
 * lets go once the ring hand is back at it
 * (Guiard 1987: the non-dominant hand leads and lags). The ring hand brings the
 * ring's hole onto the finger's axis `LINE_UP` beyond the fingertip by `ready`,
 * then slides it along the axis to `SEAT` of the proximal phalanx over the
 * stroke: the ring's `wear` axis lies along the finger, from the fingertip
 * toward the hand, its roll about the finger the one, by `ROLL` steps, that
 * turns the holding hand least from how it holds the ring. From `strokeEnd` the
 * ring is worn on the partner's proximal bone and the ring hand's grip ends, so
 * custody passes without a gap; both hands then return. Both arms are laid in
 * one course (`courseArmGoal` with `with`), pairing the ring's grip with
 * the supporting palm on the forearm.
 * A presented hand beyond the standing arms is reached by the least hinge at
 * the hips that brings both wrists within their arms (`HumanTrunkLean`), as
 * `dressPartner` reaches a region, so the dresser keeps its standoff.
 */
export const slipRing: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSlipRing> =
  {
    name: "slipRing",
    interrupts: {},
    plan: planSlipRing,
  };

/*
 * Slip a ring onto a partner's finger. The partner's presented hand is read
 * where it is at the action's start, so the partner presents it first
 * (`presentHand`). The dresser's other hand takes the partner's forearm with
 * the palm laid on its collider (`HumanColliders.cast`). When the partner's
 * wrist faces the dresser, the fingers follow the approach along the contact
 * plane. The steadying palm lands before the ring hand leaves its rest and
 * lets go once the ring hand is back at it
 * (Guiard 1987: the non-dominant hand leads and lags). The ring hand brings the
 * ring's hole onto the finger's axis `LINE_UP` beyond the fingertip by `ready`,
 * then slides it along the axis to `SEAT` of the proximal phalanx over the
 * stroke: the ring's `wear` axis lies along the finger, from the fingertip
 * toward the hand, its roll about the finger the one, by `ROLL` steps, that
 * turns the holding hand least from how it holds the ring. From `strokeEnd` the
 * ring is worn on the partner's proximal bone and the ring hand's grip ends, so
 * custody passes without a gap; both hands then return. Both arms are laid in
 * one course (`courseArmGoal` with `with`), pairing the ring's grip with
 * the supporting palm on the forearm.
 * A presented hand beyond the standing arms is reached by the least hinge at
 * the hips that brings both wrists within their arms (`HumanTrunkLean`), as
 * `dressPartner` reaches a region, so the dresser keeps its standoff.
 */
function planSlipRing(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSlipRing>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanSlipRing = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  const side: AutoMovieHumanSide = p.side ?? "right";
  const steady: AutoMovieHumanSide = side === "right" ? "left" : "right";
  const hand: AutoMovieHumanSide = p.hand ?? "left";
  const finger: IAutoMovieMotionHumanSlipRing.Finger = p.finger ?? "ring";
  requireOtherPerformer(
    context.subject,
    p.partner,
    "a ring is slipped onto another performer's finger",
  );
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    side,
    p.prop,
  );
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    p.partner,
  );

  // The finger's axis where the partner presents it at the start.
  const phalanx: Capitalize<IAutoMovieMotionHumanSlipRing.Finger> =
    PHALANX_NAME[finger];
  const base: AutoMovieHumanoidBone = `${hand}${phalanx}Proximal`;
  const middle: AutoMovieHumanoidBone = `${hand}${phalanx}Intermediate`;
  const tipRegion: AutoMovieHumanoidRegion =
    `${finger}Tip${hand === "left" ? "Left" : "Right"}`;
  const palmRegion: AutoMovieHumanoidRegion =
    hand === "left" ? "palmLeft" : "palmRight";
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    partner.bones(
      context.start,
      new Set<AutoMovieHumanoidBone>([
        base,
        middle,
        partner.body.surfaces.regions[tipRegion].bone,
        `${hand}Hand`,
        `${hand}LowerArm`,
      ]),
    );
  const knuckle: IAutoMovieResolvedBone | undefined = bones.get(base);
  const joint: IAutoMovieResolvedBone | undefined = bones.get(middle);
  if (knuckle === undefined || joint === undefined)
    throw new HumanRefusal({
      kind: "participant",
      axis: "finger",
      value: finger,
      reason: `the partner's rig has no ${base} or ${middle} bone to wear a ring on`,
      fix: "name a finger the partner's rig has",
    });
  const tip: IAutoMovieVector3 = StrikingBody.region(
    partner.body,
    bones,
    tipRegion,
  ).point;
  const seat: IAutoMovieVector3 = Vector3.lerp(
    knuckle.worldPosition,
    joint.worldPosition,
    SEAT,
  );
  // From the fingertip toward the hand: the way the ring travels.
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(seat, tip),
  );

  // The ring's frame on the axis: its `wear` socket's `+Y` along the axis.
  const wear: IAutoMovieAffordance | undefined = held.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "wear",
  );
  if (wear === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: p.prop,
      reason: `${p.prop} declares no wear socket to put on a finger`,
      fix: "give the ring a wear socket along its hole's axis",
    });
  const lined: IAutoMovieQuaternion = HumanHand.align(
    {
      normal: Quaternion.rotateVector(wear.frame.rotation, UP),
      forward: Quaternion.rotateVector(wear.frame.rotation, {
        x: 1,
        y: 0,
        z: 0,
      }),
    },
    {
      normal: axis,
      forward:
        Math.abs(Vector3.dot(axis, UP)) > 0.9 ? { x: 1, y: 0, z: 0 } : UP,
    },
  );
  // A band is round, so its roll about the finger is free: the roll
  // that turns the holding hand least from how it holds the ring now.
  const pose: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([
      "leftHand",
      "rightHand",
      `${steady}UpperArm`,
    ]),
  );
  const holding: IAutoMovieQuaternion = pose.get(`${side}Hand`)!.worldRotation;
  const fromHeld: IAutoMovieQuaternion = Quaternion.inverse(
    held.frame.rotation,
  );
  let turn: IAutoMovieQuaternion = lined;
  let nearest: number = -1;
  for (let roll: number = 0; roll < 360; roll += ROLL) {
    const candidate: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(Quaternion.fromAxisAngle(axis, roll), lined),
    );
    const hand: IAutoMovieQuaternion = Quaternion.multiply(candidate, fromHeld);
    const near: number = Math.abs(
      hand.x * holding.x +
        hand.y * holding.y +
        hand.z * holding.z +
        hand.w * holding.w,
    );
    if (near > nearest) {
      nearest = near;
      turn = candidate;
    }
  }
  const begin: IAutoMovieVector3 = Vector3.add(
    tip,
    Vector3.scale(axis, -LINE_UP),
  );
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    body,
    entry,
    side,
  );
  const linedGrip: IAutoMovieMotionHumanArmTarget.ITarget =
    HumanWornItem.holding(
      body,
      side,
      held,
      {
        position: Vector3.subtract(
          begin,
          Quaternion.rotateVector(turn, wear.frame.translation),
        ),
        rotation: turn,
      },
      bend,
    );
  const inset: IAutoMovieVector3 = Vector3.subtract(seat, begin);
  const ringAt = (progress: number): IAutoMovieMotionHumanArmTarget.ITarget => ({
    ...linedGrip,
    point: Vector3.add(linedGrip.point, Vector3.scale(inset, progress)),
  });

  const under: IAutoMovieMotionHumanArmTarget.ITarget = slipRingSteady({
    subject: p.partner,
    body,
    partner: partner.body,
    bones,
    hand,
    steady,
    shoulder: pose.get(`${steady}UpperArm`)!.worldPosition,
    bend: AutoMovieMotionHumanBend.hang(body, entry, steady),
  });
  // Each hand's place before and after, and the phases on one clock.
  const frame = { origin: entry.root, yaw: entry.yaw };
  const origins: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanArmTarget.IOrigin
  > = {
    left: AutoMovieMotionHumanArmTarget.origin(
      body,
      pose,
      frame,
      "left",
      side === "left" ? "grip" : "palm",
    ),
    right: AutoMovieMotionHumanArmTarget.origin(
      body,
      pose,
      frame,
      "right",
      side === "right" ? "grip" : "palm",
    ),
  };
  const from = (arm: AutoMovieHumanSide): IAutoMovieVector3 =>
    AutoMovieMotionHumanArmTarget.point(entry, origins[arm]);
  const prepare: number = AutoMovieMotionHumanTiming.transport(
    Math.max(
      Vector3.distance(from(side), linedGrip.point),
      Vector3.distance(from(steady), under.point),
    ),
  );
  // The steadying hand sets the frame the ring hand works in, so it
  // takes the partner's forearm before the ring hand leaves its rest and
  // lets go only once the ring hand is back: the non-dominant hand leads
  // and lags the dominant one (Guiard 1987, "Asymmetric division of
  // labor in human skilled bimanual action: the kinematic chain as a
  // model", J. Motor Behavior 19:486). Laid over one span, the two
  // reaches and returns crossed in front of the body (the ring hand
  // 14.8 mm inside the steadying forearm). The ring hand reaches once the
  // steadying hand holds, and the steadying hand lets go once the ring
  // hand is back.
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: 2 * prepare,
    attack: AutoMovieMotionHumanTiming.transport(Vector3.length(inset)),
    hold: AutoMovieMotionHumanTiming.seconds("beat"),
    retract: 2 * prepare,
  });
  const steadying: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare,
    attack: 0,
    hold: clock.duration - 2 * prepare,
    retract: prepare,
  });
  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives: [
        {
          ...AutoMovieMotionHumanArmPhrase.stroke({
            body,
            clock,
            side,
            origin: origins[side],
            path: (
              _posture: IAutoMovieMotionHumanPosture,
              _seconds: number,
              progress: number,
            ): IAutoMovieMotionHumanArmTarget.ITarget => ringAt(progress),
          }),
          // The holding hand keeps the fingers it holds the ring with.
          channels: [`${side}Arm`],
          reads: ["root", `${side}Arm`, `${side}Hand`],
        },
        {
          ...AutoMovieMotionHumanArmPhrase.stroke({
            body,
            clock: steadying,
            side: steady,
            origin: origins[steady],
            path: (): IAutoMovieMotionHumanArmTarget.ITarget => under,
          }),
          reads: ["root", `${steady}Arm`, `${steady}Hand`],
        },
      ],
      contact: "strokeEnd",
    });
  // The ring hand arrives once the steadying hand holds, its reach taking
  // twice as long from the action's start, and is back at rest before the
  // steadying hand lets go.
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: clock.at("ready"),
    relax: clock.at("relax"),
    end: clock.at("relax") + prepare,
  };
  const grasping: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: steadying.at("ready"),
    relax: steadying.at("relax"),
    end: steadying.duration,
  };
  const cleared: IAutoMovieMotionHumanActionPlan = slipRingLean({
    context,
    body,
    plan,
    clock,
    side,
    steady,
    grasping,
    partner,
    hand,
  });
  const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan: cleared,
    side,
    span,
    // The ring is carried in a grip. The steadying palm uses the partner's
    // forearm surface and its normal.
    grasp: ["hand"],
    with: [{ side: steady, span: grasping }],
  });
  const worn: number = clock.at("strokeEnd") / clock.duration;
  return {
    ...coursed,
    contacts: [
      ...coursed.contacts,
      {
        part: side === "left" ? "leftHand" : "rightHand",
        kind: "grip",
        from: 0,
        to: worn,
        support: { kind: "prop", subject: p.prop },
      },
      {
        part: steady === "left" ? "leftHand" : "rightHand",
        kind: "grip",
        from: grasping.ready / clock.duration,
        to: grasping.relax / clock.duration,
        support: { kind: "person", subject: p.partner, region: palmRegion },
      },
    ],
    wears: [
      ...(coursed.wears ?? []),
      { prop: p.prop, bone: base, from: worn, wearer: p.partner },
    ],
  };
}
