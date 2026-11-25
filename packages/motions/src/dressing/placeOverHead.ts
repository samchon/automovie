import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
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

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanRefusal } from "../law/HumanRefusal";
import { requireOtherPerformer } from "../touch/requireOtherPerformer";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { HumanWornItem } from "./HumanWornItem";
import { placeOverHeadLean } from "./placeOverHeadLean";
import { placeOverHeadPartner } from "./placeOverHeadPartner";
import { placeOverHeadPath } from "./placeOverHeadPath";
import { placeOverHeadStance } from "./placeOverHeadStance";

/**
 * How far the presented loop's nearest edge stands off the chest, metres
 * (provisional: a hand's breadth).
 */
const PRESENT: number = 0.1;

/**
 * How far below the shoulders the loop is presented, metres (provisional: at
 * the chest).
 */
const BELOW: number = 0.2;

/** The handle names a neck loop declares. */
type Handle = "holdLeft" | "holdRight";

/**
 * Set a neck loop over a partner's head. The loop's path is
 * `placeOverHeadPath`'s, read on the partner's displayed body at the action's
 * start, so a partner who bows, kneels or sits first is met where they are. The
 * hand that holds the loop at entry first presents it level before the chest
 * (its nearest edge `PRESENT` off the chest, `BELOW` the shoulders), turned as
 * it will go over the head, and the other hand closes on the loop's other
 * handle there by `ready`, without carrying it. Both hands carry it along the
 * path over the stroke; at `strokeEnd` it is worn on the partner's upper chest
 * (the sternum region's bone) and both grips end, and the hands return. Both
 * arms are laid in one course (`courseArmGoal` with `with`). Before any of it,
 * the loop's inner half-breadth is checked against the partner's head radius,
 * and the hands' highest places, above the crown, against the arm's reach from
 * each shoulder, from the dresser's stance: chosen as Vahrenkamp, Asfour and
 * Dillmann 2013's Algorithm 1 tries base poses
 * (`AutoMovieMotionHumanTouchStance.choose`) between standing where it entered
 * and one adjustment step toward the hands' place at the crown
 * (`pickUpAdjust.stepped`), the first that clears it. A loop too narrow for the
 * head, or a crown neither stance clears (a standing tall partner), is refused
 * with the measure, so the partner bows or kneels. Down past the crown to a
 * seated partner's nape and chest the dresser hinges at the hips by the least
 * angle that keeps both wrists within their arms along the path
 * (`HumanTrunkLean`), as `dressPartner` reaches a kneeling crown.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path's owner, who carries the loop, the custody change, the course and both refusals.
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
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    side,
    p.prop,
  );
  const site = (id: string): IAutoMovieAffordance => {
    const found: IAutoMovieAffordance | undefined = held.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    );
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: p.prop,
        reason: `${p.prop} declares no ${id} contact for a neck loop`,
        fix: "give the loop wear, front, opening, holdLeft and holdRight contacts",
      });
    return found;
  };

  // The handle the holding hand has: the one nearest its grip socket.
  const socket: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(held.frame.rotation),
    Vector3.scale(held.frame.position, -1),
  );
  const handles: readonly Handle[] = ["holdLeft", "holdRight"];
  const kept: Handle = handles.reduce(
    (a: Handle, b: Handle): Handle =>
      Vector3.distance(site(b).frame.translation, socket) <
      Vector3.distance(site(a).frame.translation, socket)
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
  const start: IAutoMovieRigidTransform = context
    .prop(p.prop)
    .frame(context.start);
  // The loop's inside: its centre half the opening's length in from its
  // back edge, and its half-breadth.
  const opening: IAutoMovieAffordance = site("opening");
  const centre: IAutoMovieVector3 = Vector3.add(
    opening.frame.translation,
    Quaternion.rotateVector(opening.frame.rotation, {
      x: 0,
      y: (opening.height ?? 0) / 2,
      z: 0,
    }),
  );
  const along = (from: IAutoMovieRigidTransform): placeOverHeadPath.IPath =>
    placeOverHeadPath.prepare({
      start: from,
      wear: site("wear").frame.translation,
      front: site("front").frame.translation,
      centre,
      body: partner.body,
      bones,
      // The gripping hand lies its grip's depth below the handle it holds
      // (the grip socket's distance from the palm), and its fingers clear the
      // partner's chest by the audit's skin as the loop is worn.
      clearance:
        Vector3.distance(
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
        y: body.measure.shoulderHeight - BELOW - lead.root.y,
        z: body.measure.chestDepth / 2 + PRESENT + (opening.height ?? 0) / 2,
      },
    );
    return {
      position: Vector3.subtract(at, Quaternion.rotateVector(rotation, centre)),
      rotation,
    };
  })();
  const path: placeOverHeadPath.IPath = along(presented);
  const inner: number = (opening.width ?? 0) / 2;
  if (inner <= partner.body.measure.headRadius)
    throw new HumanRefusal({
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
  const prepare: number = AutoMovieMotionHumanTiming.transport(
    Vector3.distance(
      AutoMovieMotionHumanArmTarget.point(entry, origins[other]),
      grasping(presented).point,
    ),
  );
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare,
    attack: AutoMovieMotionHumanTiming.transport(path.length),
    hold: AutoMovieMotionHumanTiming.seconds("beat"),
    retract: AutoMovieMotionHumanTiming.transport(
      Math.max(
        Vector3.distance(
          holding(path.worn).point,
          AutoMovieMotionHumanArmTarget.point(entry, origins[side]),
        ),
        Vector3.distance(
          grasping(path.worn).point,
          AutoMovieMotionHumanArmTarget.point(entry, origins[other]),
        ),
      ),
    ),
  });
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
  }); // The partner's body is both arms' obstacle, the shoulders the hands
  // lower the loop onto their rests, read at every planned second.
  const cleared: IAutoMovieMotionHumanActionPlan = placeOverHeadPartner(
    body,
    leaned,
    partner,
    context.start,
  );
  const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan: cleared,
    side,
    span,
    grasp: ["hand", "lowerArm"],
    with: [
      {
        side: other,
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
        to: worn,
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

/**
 * Set a neck loop over a partner's head. The loop's path is
 * `placeOverHeadPath`'s, read on the partner's displayed body at the action's
 * start, so a partner who bows, kneels or sits first is met where they are. The
 * hand that holds the loop at entry first presents it level before the chest
 * (its nearest edge `PRESENT` off the chest, `BELOW` the shoulders), turned as
 * it will go over the head, and the other hand closes on the loop's other
 * handle there by `ready`, without carrying it. Both hands carry it along the
 * path over the stroke; at `strokeEnd` it is worn on the partner's upper chest
 * (the sternum region's bone) and both grips end, and the hands return. Both
 * arms are laid in one course (`courseArmGoal` with `with`). Before any of it,
 * the loop's inner half-breadth is checked against the partner's head radius,
 * and the hands' highest places, above the crown, against the arm's reach from
 * each shoulder, from the dresser's stance: chosen as Vahrenkamp, Asfour and
 * Dillmann 2013's Algorithm 1 tries base poses
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
