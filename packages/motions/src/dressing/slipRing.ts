import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSlipRing,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmPhrase } from "../compose/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanPartnerClear } from "../compose/AutoMovieMotionHumanPartnerClear";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunkLean } from "../handling/HumanTrunkLean";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { StrikingBody } from "../striking/StrikingBody";
import { HumanWornItem } from "./HumanWornItem";

/**
 * Where along the proximal phalanx a ring rests, as a share from its base joint
 * (provisional: a ring sits on the phalanx's proximal third).
 */
const SEAT: number = 0.35;

/**
 * How far beyond the fingertip the ring lines up before it slides on, metres
 * (provisional: clear of the fingertip by a ring's width).
 */
const LINE_UP: number = 0.015;

/** The step the band's free roll about the finger is searched by, degrees. */
const ROLL: number = 15;

/** World up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Slip a ring onto a partner's finger. The partner's presented hand is read
 * where it is at the action's start, so the partner presents it first
 * (`presentHand`). The dresser's other hand takes the partner's forearm from
 * its own side, the palm laid on the forearm's own collider
 * (`HumanColliders.cast`), its fingers toward the partner's wrist, before the
 * ring hand leaves its rest, and lets go once the ring hand is back at it
 * (Guiard 1987: the non-dominant hand leads and lags). The ring hand brings the
 * ring's hole onto the finger's axis `LINE_UP` beyond the fingertip by `ready`,
 * then slides it along the axis to `SEAT` of the proximal phalanx over the
 * stroke: the ring's `wear` axis lies along the finger, from the fingertip
 * toward the hand, its roll about the finger the one, by `ROLL` steps, that
 * turns the holding hand least from how it holds the ring. From `strokeEnd` the
 * ring is worn on the partner's proximal bone and the ring hand's grip ends, so
 * custody passes without a gap; both hands then return. Both arms are laid in
 * one course (`courseArmGoal` with `with`), the hands excused from each other.
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
  if (p.partner === context.subject)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "partner",
      value: p.partner,
      reason: "a ring is slipped onto another performer's finger",
      fix: "name another performer as the partner",
    });
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
    context,
    side,
    p.prop,
  );
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    p.partner,
  );

  // The finger's axis where the partner presents it at the start.
  const Finger: string = finger[0]!.toUpperCase() + finger.slice(1);
  const base: AutoMovieHumanoidBone =
    `${hand}${Finger}Proximal` as AutoMovieHumanoidBone;
  const middle: AutoMovieHumanoidBone =
    `${hand}${Finger}Intermediate` as AutoMovieHumanoidBone;
  const tipRegion: AutoMovieHumanoidRegion =
    `${finger}Tip${hand === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion;
  const palmRegion: AutoMovieHumanoidRegion =
    hand === "left" ? "palmLeft" : "palmRight";
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    partner.bones(context.start);
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
  const holding: IAutoMovieQuaternion = poseBones(body, context.entry.pose).get(
    `${side}Hand`,
  )!.worldRotation;
  let turn: IAutoMovieQuaternion = lined;
  let nearest: number = -1;
  for (let roll: number = 0; roll < 360; roll += ROLL) {
    const candidate: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(Quaternion.fromAxisAngle(axis, roll), lined),
    );
    const hand: IAutoMovieQuaternion = Quaternion.multiply(
      candidate,
      Quaternion.inverse(held.frame.rotation),
    );
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
  const ring = (centre: IAutoMovieVector3): IAutoMovieRigidTransform => ({
    position: Vector3.subtract(
      centre,
      Quaternion.rotateVector(turn, wear.frame.translation),
    ),
    rotation: turn,
  });
  const begin: IAutoMovieVector3 = Vector3.add(
    tip,
    Vector3.scale(axis, -LINE_UP),
  );
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const bend = (arm: AutoMovieHumanSide): IAutoMovieVector3 =>
    AutoMovieMotionHumanBend.hang(body, entry, arm);
  const ringAt = (progress: number): IAutoMovieMotionHumanArmTarget.ITarget =>
    HumanWornItem.holding(
      body,
      side,
      held,
      ring(Vector3.lerp(begin, seat, progress)),
      bend(side),
    );

  // The steadying palm takes the partner's forearm a third of the way
  // from the wrist to the elbow, from the side facing the steadying
  // shoulder, its fingers toward the partner's wrist: on the presented
  // hand the two hands converged and their forearms crossed (25 mm,
  // then 22.8 mm on either side of the hand). The palm lies the forearm's
  // radius off its axis toward the steadying shoulder and faces back
  // onto it, so the steadying arm comes in from its own side.
  const wrist: IAutoMovieVector3 = bones.get(
    `${hand}Hand` as AutoMovieHumanoidBone,
  )!.worldPosition;
  const elbow: IAutoMovieVector3 = bones.get(
    `${hand}LowerArm` as AutoMovieHumanoidBone,
  )!.worldPosition;
  const grasped: IAutoMovieVector3 = Vector3.lerp(wrist, elbow, 1 / 3);
  const along: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(wrist, elbow),
  );
  const shoulder: IAutoMovieVector3 = poseBones(body, context.entry.pose).get(
    `${steady}UpperArm`,
  )!.worldPosition;
  const toward: IAutoMovieVector3 = Vector3.subtract(shoulder, grasped);
  const outward: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(toward, Vector3.scale(along, Vector3.dot(toward, along))),
  );
  // The palm lies on the partner's forearm collider itself, not one
  // radius off the axis shared by the whole limb (contacts.md, "Contact
  // between performers": penetration is measured against each part's own
  // collider): a ray in from the steadying side onto the forearm's
  // colliders finds the place and its facing (`HumanColliders.cast`), as
  // the embrace lays its palms. It starts a forearm's length out, beyond
  // any of the forearm's colliders, and runs twice that.
  const lowerArm: AutoMovieHumanoidBone =
    `${hand}LowerArm` as AutoMovieHumanoidBone;
  const hit: IAutoMovieMotionHumanColliders.IHit | undefined =
    HumanColliders.cast(
      partner.body,
      new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>([
        [lowerArm, bones.get(lowerArm)!],
      ]),
      Vector3.add(
        grasped,
        Vector3.scale(outward, partner.body.measure.forearm),
      ),
      Vector3.scale(outward, -1),
      2 * partner.body.measure.forearm,
    );
  if (hit === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "partner",
      value: p.partner,
      reason: `no collider of the partner's ${lowerArm} lies on the steadying hand's way in`,
      fix: "have the partner present the forearm toward the steadying hand",
    });
  const under: IAutoMovieMotionHumanArmTarget.ITarget =
    AutoMovieMotionHumanArmTarget.prepareTarget(
      body,
      steady,
      "palm",
      "flat",
    )({
      point: hit.point,
      rotation: HumanHand.align(
        HumanHand.offset(body, steady, "palm", "flat"),
        {
          normal: Vector3.scale(hit.normal, -1),
          forward: Vector3.normalize(
            Vector3.subtract(
              along,
              Vector3.scale(hit.normal, Vector3.dot(along, hit.normal)),
            ),
          ),
        },
      ),
      bend: bend(steady),
    });

  // Each hand's place before and after, and the phases on one clock.
  const pose: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
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
      Vector3.distance(from(side), ringAt(0).point),
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
    attack: AutoMovieMotionHumanTiming.transport(Vector3.distance(begin, seat)),
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
  // A presented hand beyond the standing arms (a small partner's hand
  // before a tall dresser, or the forearm the steadying palm takes) is
  // reached by the least hinge at the hips that brings both wrists the
  // plan asks at the stroke's end within their arms (`HumanTrunkLean`),
  // as `dressPartner` reaches a region, eased in over the reach and out
  // over the return on the minimum-jerk profile (Flash and Hogan 1985):
  // the dresser keeps its standoff instead of an arm held past its reach.
  const asked: IAutoMovieMotionHumanPosture = plan.posture(
    clock.at("strokeEnd"),
  );
  const wrists: HumanTrunkLean.IWrist[] = [side, steady].flatMap(
    (arm: AutoMovieHumanSide): HumanTrunkLean.IWrist[] => {
      const goal: IAutoMovieHumanLimbGoal | undefined =
        asked.limbs[`${arm}Arm`];
      return goal === undefined || goal.on !== undefined
        ? []
        : [
            {
              side: arm,
              point: goal.point,
              rotation: goal.rotation ?? Quaternion.identity(),
            },
          ];
    },
  );
  const forward: number =
    wrists.length === 0 ? 0 : HumanTrunkLean.least(context, wrists);
  // The hinge comes in with the steadying hand's reach and goes out with
  // its return, the first and last arm to move.
  const hinge: (seconds: number) => number = (seconds: number): number =>
    forward *
    (seconds <= grasping.relax
      ? minimumJerk.share(
          grasping.ready > 0
            ? Math.min(1, Math.max(0, seconds / grasping.ready))
            : 1,
        )
      : 1 -
        minimumJerk.share(
          Math.min(
            1,
            Math.max(
              0,
              (seconds - grasping.relax) / (grasping.end - grasping.relax),
            ),
          ),
        ));
  const leaned: IAutoMovieMotionHumanActionPlan =
    forward > 0
      ? {
          ...HumanTrunkLean.moving(plan, forward),
          posture: (
            seconds: number,
            channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            resolution?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[2],
            projection?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[3],
          ): IAutoMovieMotionHumanPosture =>
            HumanTrunkLean.lean(
              body,
              plan.posture(seconds, channels, resolution, projection),
              hinge(seconds),
            ),
        }
      : plan;
  // The partner's body is both arms' obstacle (`AutoMovieMotionHumanPartnerClear`),
  // except the presented hand, its fingers and its forearm, which the
  // ring goes onto and the steadying palm lies under: those are the
  // steadying arm's rests and no obstacle to the ring hand.
  const presented: (bone: AutoMovieHumanoidBone) => boolean = (
    bone: AutoMovieHumanoidBone,
  ): boolean =>
    bone === `${hand}Hand` ||
    bone === `${hand}LowerArm` ||
    (bone.startsWith(hand) && /(Thumb|Index|Middle|Ring|Little)/.test(bone));
  const cleared: IAutoMovieMotionHumanActionPlan = {
    ...leaned,
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const segments: IAutoMovieMotionHumanColliders.IPlaced[] =
        AutoMovieMotionHumanPartnerClear.at(partner, context.start + seconds);
      const clear: IAutoMovieMotionHumanColliders.IPlaced[] = segments.filter(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          !presented(s.bone),
      );
      const rests: IAutoMovieMotionHumanColliders.IPlaced[] = segments.filter(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          presented(s.bone),
      );
      return AutoMovieMotionHumanPartnerClear.onto(
        AutoMovieMotionHumanPartnerClear.onto(
          leaned.posture(seconds, channels, resolution, projection),
          `${side}Arm`,
          clear,
        ),
        `${steady}Arm`,
        clear,
        rests,
      );
    },
  };
  const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan: cleared,
    side,
    span,
    grasp: ["hand"],
    with: [
      {
        side: steady,
        grasp: ["hand"],
        span: grasping,
      },
    ],
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

/**
 * Slip a ring onto a partner's finger. The partner's presented hand is read
 * where it is at the action's start, so the partner presents it first
 * (`presentHand`). The dresser's other hand takes the partner's forearm from
 * its own side, the palm laid on the forearm's own collider
 * (`HumanColliders.cast`), its fingers toward the partner's wrist, before the
 * ring hand leaves its rest, and lets go once the ring hand is back at it
 * (Guiard 1987: the non-dominant hand leads and lags). The ring hand brings the
 * ring's hole onto the finger's axis `LINE_UP` beyond the fingertip by `ready`,
 * then slides it along the axis to `SEAT` of the proximal phalanx over the
 * stroke: the ring's `wear` axis lies along the finger, from the fingertip
 * toward the hand, its roll about the finger the one, by `ROLL` steps, that
 * turns the holding hand least from how it holds the ring. From `strokeEnd` the
 * ring is worn on the partner's proximal bone and the ring hand's grip ends, so
 * custody passes without a gap; both hands then return. Both arms are laid in
 * one course (`courseArmGoal` with `with`), the hands excused from each other.
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
