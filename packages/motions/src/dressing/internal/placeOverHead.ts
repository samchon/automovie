import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPlaceOverHead,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/internal/AutoMovieMotionHumanAuditSkin";
import { motionClock } from "../../compose/internal/motionClock";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { motionHumanHeld } from "../../compose/internal/motionHumanHeld";
import { motionHumanTiming } from "../../compose/internal/motionHumanTiming";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { requireOtherPerformer } from "../../touch/internal/requireOtherPerformer";
import { HumanWornItem } from "./HumanWornItem";
import { placeOverHeadHandGap } from "./placeOverHeadHandGap";
import { placeOverHeadLean } from "./placeOverHeadLean";
import { placeOverHeadPartner } from "./placeOverHeadPartner";
import { placeOverHeadPath } from "./placeOverHeadPath";
import { placeOverHeadStance } from "./placeOverHeadStance";
import { PlaceOverHeadData } from "./PlaceOverHeadData";

/*
 * Set a neck loop over a partner's head. The loop's path is
 * `placeOverHeadPath`'s, read on the partner's displayed body at the action's
 * start, so a partner who bows, kneels or sits first is met where they are. The
 * hand that holds the loop at entry first presents it level before the chest
 * (its nearest edge `PRESENT` off the chest, `BELOW` the shoulders), turned as
 * it will go over the head, and the other hand closes on the loop's other
 * handle there by `ready`, without carrying it. Both hands guide the loop over
 * the head. If both grips cannot reach the nape together, the assisting hand
 * releases at `assistRelease` once the loop clears the head. At `strokeEnd` the
 * loop is worn on the partner's upper chest (the sternum region's bone) and the
 * carrying grip ends. Both arms are laid in one course (`courseArmGoal` with
 * `with`). Before any of it, the loop's inner half-breadth is checked against
 * the partner's head radius, and the hands' highest places, above the crown,
 * against the arm's reach from each shoulder, from the dresser's stance: chosen
 * as Vahrenkamp, Asfour and Dillmann 2013's Algorithm 1 tries base poses
 * (`AutoMovieMotionHumanTouchStance.choose`) between standing where it entered
 * and one adjustment step toward the hands' place at the crown
 * (`pickUpAdjust.stepped`), the first that clears it. A loop too narrow for the
 * head, or a crown neither stance clears (a standing tall partner), is refused
 * with the measure, so the partner bows or kneels. Down past the crown to a
 * seated partner's nape and chest the dresser hinges at the hips by the least
 * angle that keeps both wrists within their arms along the path
 * (`HumanTrunkLean`), as `dressPartner` reaches a kneeling crown.
 */
export const placeOverHead: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPlaceOverHead> =
  {
    name: "placeOverHead",
    interrupts: {},
    plan: planPlaceOverHead,
  };

/*
 * Set a neck loop over a partner's head. The loop's path is
 * `placeOverHeadPath`'s, read on the partner's displayed body at the action's
 * start, so a partner who bows, kneels or sits first is met where they are. The
 * hand that holds the loop at entry first presents it level before the chest
 * (its nearest edge `PRESENT` off the chest, `BELOW` the shoulders), turned as
 * it will go over the head, and the other hand closes on the loop's other
 * handle there by `ready`, without carrying it. Both hands guide the loop over
 * the head. If both grips cannot reach the nape together, the assisting hand
 * releases at `assistRelease` once the loop clears the head. At `strokeEnd` the
 * loop is worn on the partner's upper chest (the sternum region's bone) and the
 * carrying grip ends. Both arms are laid in one course (`courseArmGoal` with
 * `with`). Before any of it, the loop's inner half-breadth is checked against
 * the partner's head radius, and the hands' highest places, above the crown,
 * against the arm's reach from each shoulder, from the dresser's stance: chosen
 * as Vahrenkamp, Asfour and Dillmann 2013's Algorithm 1 tries base poses
 * (`AutoMovieMotionHumanTouchStance.choose`) between standing where it entered
 * and one adjustment step toward the hands' place at the crown
 * (`pickUpAdjust.stepped`), the first that clears it. A loop too narrow for the
 * head, or a crown neither stance clears (a standing tall partner), is refused
 * with the measure, so the partner bows or kneels. Down past the crown to a
 * seated partner's nape and chest the dresser hinges at the hips by the least
 * angle that keeps both wrists within their arms along the path
 * (`HumanTrunkLean`), as `dressPartner` reaches a kneeling crown.
 */
function planPlaceOverHead(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPlaceOverHead>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanPlaceOverHead = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  const side: AutoMovieHumanSide = p.side ?? "right";
  const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
  requireOtherPerformer(
    context.subject,
    p.partner,
    "a loop is set over another performer's head",
  );
  const held: IAutoMovieMotionHumanHeld.IHeld = motionHumanHeld(
    context,
    side,
    p.prop,
  );
  const site = (id: string): IAutoMovieAffordance => {
    const found: IAutoMovieAffordance | undefined = held.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    );
    if (found === undefined)
      throw new AutoMovieMotionHumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: p.prop,
        reason: `${p.prop} declares no ${id} contact for a neck loop`,
        fix: "give the loop wear, front, opening, holdLeft and holdRight contacts",
      });
    return found;
  };

  // The handle the holding hand has: the one nearest its grip socket.
  const socket: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    AutoMovieEngineQuaternion.inverse(held.frame.rotation),
    AutoMovieEngineVector3.scale(held.frame.position, -1),
  );
  const handles: readonly Handle[] = ["holdLeft", "holdRight"];
  const kept: Handle = handles.reduce(
    (a: Handle, b: Handle): Handle =>
      AutoMovieEngineVector3.distance(site(b).frame.translation, socket) <
      AutoMovieEngineVector3.distance(site(a).frame.translation, socket)
        ? b
        : a,
  );
  const taken: IAutoMovieAffordance = site(
    kept === "holdLeft" ? "holdRight" : "holdLeft",
  );

  // The partner where they are at the start, and the loop's path.
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    p.partner,
  );
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    partner.bones(context.start);
  const loop: ReturnType<typeof context.prop> = context.prop(p.prop);
  const start: IAutoMovieRigidTransform = loop.frame(context.start);
  // The loop's inside: its centre half the opening's length in from its
  // back edge, and its half-breadth.
  const opening: IAutoMovieAffordance = site("opening");
  const wear: IAutoMovieVector3 = site("wear").frame.translation;
  const centre: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    opening.frame.translation,
    AutoMovieEngineQuaternion.rotateVector(opening.frame.rotation, {
      x: 0,
      y: (opening.height ?? 0) / 2,
      z: 0,
    }),
  );
  const inner: number = (opening.width ?? 0) / 2;
  const along = (
    from: IAutoMovieRigidTransform,
    handGap?: placeOverHeadPath.IProps["handGap"],
  ): placeOverHeadPath.IPath =>
    placeOverHeadPath.prepare({
      start: from,
      wear,
      front: site("front").frame.translation,
      centre,
      halfBreadth: inner,
      body: partner.body,
      bones,
      ...(handGap === undefined ? {} : { handGap }),
      // The gripping hand lies its grip's depth below the handle it holds
      // (the grip socket's distance from the palm), and its fingers clear the
      // partner's chest by the audit's skin as the loop is worn.
      clearance:
        AutoMovieEngineVector3.distance(
          HumanHand.offset(body, side, "grip").point,
          HumanHand.offset(body, side, "palm").point,
        ) + AutoMovieMotionHumanAuditSkin.BUILT,
    });
  // The holding hand first presents the loop level before the chest,
  // turned as it will go over the head, where the other hand takes it:
  // its nearest edge `PRESENT` off the chest, `BELOW` the shoulders.
  const lead: IAutoMovieMotionHumanPosture = context.entry.posture;
  const presented: IAutoMovieRigidTransform = (() => {
    const rotation: IAutoMovieRigidTransform["rotation"] =
      along(start).apex.rotation;
    const at: IAutoMovieVector3 = HumanFrame.point(
      { origin: lead.root, yaw: lead.yaw },
      {
        x: 0,
        y: body.measure.shoulderHeight - PlaceOverHeadData.BELOW - lead.root.y,
        z: body.measure.chestDepth / 2 + PlaceOverHeadData.PRESENT + (opening.height ?? 0) / 2,
      },
    );
    return {
      position: AutoMovieEngineVector3.subtract(at, AutoMovieEngineQuaternion.rotateVector(rotation, centre)),
      rotation,
    };
  })();
  if (inner <= partner.body.measure.headRadius)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: p.prop,
      feasible: {
        kind: "range",
        minimum: partner.body.measure.headRadius,
        maximum: null,
        unit: "m",
      },
      reason: `the loop's inner half-breadth ${(inner * 1000).toFixed(0)} mm does not clear the partner's head radius ${(partner.body.measure.headRadius * 1000).toFixed(0)} mm`,
      fix: "use a longer or wider loop",
    });

  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const bend = (arm: AutoMovieHumanSide): IAutoMovieVector3 =>
    AutoMovieMotionHumanBend.hang(body, entry, arm);
  const holding = (
    frame: IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanArmTarget.ITarget =>
    HumanWornItem.holding(body, side, held, frame, bend(side));
  const grasping = (
    frame: IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanArmTarget.ITarget =>
    HumanWornItem.grasping(body, other, frame, taken, bend(other));

  // The hands' highest places, above the crown, within each arm's reach.
  const pose: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const path: placeOverHeadPath.IPath = along(
    presented,
    placeOverHeadHandGap({
      body,
      shapes: loop.prop.shapes ?? [],
      wear,
      posture: entry,
      pose,
      side,
      other,
      holding,
      grasping,
      partner: { body: partner.body, bones },
    }),
  );
  const reach: number = body.measure.upperArm + body.measure.forearm;
  const shoulders: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>(["leftUpperArm", "rightUpperArm"]);

  const { on, stance }: placeOverHeadStance.IChosen = placeOverHeadStance({
    context,
    p,
    body,
    side,
    other,
    entry,
    pose,
    shoulders,
    reach,
    path,
    holding,
    grasping,
  });
  // Each hand's place before and after, and one clock.
  const frame: IAutoMovieMotionHumanFrame = {
    origin: entry.root,
    yaw: entry.yaw,
  };
  const origins: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanArmTarget.IOrigin
  > = {
    left: AutoMovieMotionHumanArmTarget.origin(
      body,
      pose,
      frame,
      "left",
      "grip",
    ),
    right: AutoMovieMotionHumanArmTarget.origin(
      body,
      pose,
      frame,
      "right",
      "grip",
    ),
  };
  const prepare: number = motionHumanTiming.transport(
    AutoMovieEngineVector3.distance(
      AutoMovieMotionHumanArmTarget.point(entry, origins[other]),
      grasping(presented).point,
    ),
  );
  const phrase: IAutoMovieMotionClock = motionClock.phrase({
    prepare,
    attack: motionHumanTiming.transport(path.length),
    hold: motionHumanTiming.seconds("beat"),
    retract: motionHumanTiming.transport(
      Math.max(
        AutoMovieEngineVector3.distance(
          holding(path.worn).point,
          AutoMovieMotionHumanArmTarget.point(entry, origins[side]),
        ),
        AutoMovieEngineVector3.distance(
          grasping(path.worn).point,
          AutoMovieMotionHumanArmTarget.point(entry, origins[other]),
        ),
      ),
    ),
  });
  const release: number | undefined =
    path.assistUntil === undefined
      ? undefined
      : assistRelease(phrase, path.assistUntil);
  const clock: IAutoMovieMotionClock =
    release === undefined
      ? phrase
      : motionClock(phrase.duration, [
          ...phrase.instants,
          { name: "assistRelease", seconds: release },
        ]);
  const { leaned, span }: placeOverHeadLean.ILean = placeOverHeadLean({
    context,
    body,
    side,
    other,
    stance,
    on,
    clock,
    origins,
    path,
    holding,
    grasping,
  });
  // The partner's body is both arms' obstacle, the shoulders the hands
  // lower the loop onto their rests, read at every planned second.
  const cleared: IAutoMovieMotionHumanActionPlan = placeOverHeadPartner(
    body,
    leaned,
    partner,
    context.start,
  );
  const assisted: IAutoMovieMotionHumanArmPlanned.ISpan =
    release === undefined ? span : { ...span, relax: release };
  const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan: cleared,
    side,
    span,
    grasp: ["hand", "lowerArm"],
    with: [
      {
        side: other,
        span: assisted,
        grasp: ["hand", "lowerArm"],
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
        part: other === "left" ? "leftHand" : "rightHand",
        kind: "grip",
        from: clock.at("ready") / clock.duration,
        to: release === undefined ? worn : release / clock.duration,
        support: { kind: "prop", subject: p.prop, carries: false },
      },
    ],
    wears: [
      ...(coursed.wears ?? []),
      {
        prop: p.prop,
        bone: partner.body.surfaces.regions.sternum.bone,
        from: worn,
        wearer: p.partner,
      },
    ],
  };
}

/*
 * Locate the path's release key on the monotone minimum-jerk stroke clock.
 */
function assistRelease(clock: IAutoMovieMotionClock, share: number): number {
  let lo: number = clock.at("strokeStart");
  let hi: number = clock.at("strokeEnd");
  for (let i: number = 0; i < 40; ++i) {
    const mid: number = (lo + hi) / 2;
    if (clock.progress("strokeStart", "strokeEnd", mid) < share) lo = mid;
    else hi = mid;
  }
  return hi;
}

/*
 * The handle names a neck loop declares.
 */
type Handle = "holdLeft" | "holdRight";
