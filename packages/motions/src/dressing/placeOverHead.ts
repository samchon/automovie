import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
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
  IAutoMovieMotionHumanPrimitive,
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
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouchStance } from "../compose/AutoMovieMotionHumanTouchStance";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunkLean } from "../handling/HumanTrunkLean";
import { pickUpAdjust } from "../handling/pickUpAdjust";
import type { pickUpPosture } from "../handling/pickUpPosture";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanWornItem } from "./HumanWornItem";
import { placeOverHeadPartner } from "./placeOverHeadPartner";
import { placeOverHeadPath } from "./placeOverHeadPath";

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

/**
 * How many even pieces of the loop's path the hip hinge is solved at the ends
 * of, once per plan (provisional: the path's few key frames, each piece a
 * fraction of the descent over the head).
 */
const HINGES: number = 8;

/** The handle names a neck loop declares. */
type Handle = "holdLeft" | "holdRight";

/** The stances a dresser is placed in, in the law's order. */
type Stance = "standing" | "stepped";

/** The dresser's chosen stance. */
interface IStance {
  /** The posture the dresser stands in at the crown. */
  posture: IAutoMovieMotionHumanPosture;

  /** The adjustment step that brings it there; null standing where it entered. */
  stride: pickUpPosture.IStance | null;
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
 * each shoulder, from the dresser's stance: chosen by inverse reachability
 * (`AutoMovieMotionHumanTouchStance.choose`, Vahrenkamp, Asfour and Dillmann
 * 2013) between standing where it entered and one adjustment step toward the
 * hands' place at the crown (`pickUpAdjust.stepped`), the first that clears it.
 * A loop too narrow for the head, or a crown neither stance clears (a standing
 * tall partner), is refused with the measure, so the partner bows or kneels.
 * Down past the crown to a seated partner's nape and chest the dresser hinges
 * at the hips by the least angle that keeps both wrists within their arms along
 * the path (`HumanTrunkLean`), as `dressPartner` reaches a kneeling crown.
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
  if (p.partner === context.subject)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "partner",
      value: p.partner,
      reason: "a loop is set over another performer's head",
      fix: "name another performer as the partner",
    });
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
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

  // A stance from which both hands clear the crown: each shoulder within
  // its arm of the hand's place at the path's apex, or brought within it
  // by the hip hinge the descent takes (`HumanTrunkLean`). A crown no
  // hinge brings within the arm is refused, naming the partner.
  const crowned = (
    stance: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture => {
    const placed: ReturnType<typeof poseBones> =
      stance === entry
        ? pose
        : poseBones(
            body,
            resolveHumanPosture(body, stance),
            undefined,
            shoulders,
          );
    const from: IAutoMovieMotionHumanActionContext<object> = on(stance);
    for (const [arm, target] of [
      [side, holding(path.apex)],
      [other, grasping(path.apex)],
    ] as const) {
      const shoulder: IAutoMovieVector3 = placed.get(
        `${arm}UpperArm`,
      )!.worldPosition;
      const miss: number = Vector3.distance(shoulder, target.point) - reach;
      if (miss <= 0) continue;
      if (
        !AutoMovieMotionHumanTouchStance.reaches(
          (wrist: HumanTrunkLean.IWrist): number =>
            HumanTrunkLean.least(from, [wrist]),
          {
            side: arm,
            point: AutoMovieMotionHumanArmTarget.goal(body, arm, target).point,
            rotation: target.rotation,
          },
        )
      )
        throw new HumanRefusal({
          kind: "reach",
          axis: "partner",
          value: p.partner,
          feasible: {
            kind: "range",
            minimum: null,
            maximum: reach,
            unit: "m",
          },
          reason: `the ${arm} hand would pass ${(miss * 1000).toFixed(0)} mm beyond the arm's reach to clear the partner's crown`,
          fix: "have the partner bow, kneel or sit first, or stand nearer",
        });
    }
    return stance;
  };

  // The context as the stance a candidate stands in: the hip hinge is
  // solved on it.
  const on = (
    stance: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanActionContext<object> =>
    stance === entry
      ? context
      : { ...context, entry: { ...context.entry, posture: stance } };

  // The dresser's stance is chosen by inverse reachability
  // (`AutoMovieMotionHumanTouchStance.choose`, Vahrenkamp et al. 2013)
  // between the law's two candidates in this order: standing where it
  // entered, then one adjustment step toward the hand's place at the
  // path's apex (`pickUpAdjust.stepped`: Tomita et al. 2024's step
  // timing, a step bounded by `pickUpAdjust.STEP`), as a dresser steps in
  // to a seated partner's knees. The step is taken only where its stance
  // clears the crown.
  const standing: pickUpPosture.IStance = {
    posture: entry,
    at: (): IAutoMovieMotionHumanPosture => entry,
    lower: (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => posture,
  };
  const stance: IStance = AutoMovieMotionHumanTouchStance.choose<
    Stance,
    IStance
  >({
    candidates: ["standing", "stepped"],
    reach: (candidate: Stance): IStance => {
      if (candidate === "standing") {
        crowned(entry);
        return { posture: entry, stride: null };
      }
      const stride: pickUpPosture.IStance | null = pickUpAdjust.stepped(
        context,
        side,
        AutoMovieMotionHumanArmTarget.goal(body, side, holding(path.apex))
          .point,
        standing,
        undefined,
        reach,
        (posture: IAutoMovieMotionHumanPosture): boolean =>
          AutoMovieMotionHumanTouchStance.reaches(crowned, posture),
      );
      if (stride === null || stride.step === undefined)
        throw new HumanRefusal({
          kind: "reach",
          axis: "partner",
          value: p.partner,
          reason:
            "no adjustment step brings both hands within their arms above the partner's crown",
          fix: "have the partner bow, kneel or sit first, or stand nearer",
        });
      return { posture: stride.posture, stride };
    },
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
  // A stepped stance is the base: the foot steps in over the reach and
  // back over the return, on the pick-up's minimum-jerk share
  // (`pickUpAdjust.plants`), as a touch's step is.
  const stride: pickUpPosture.IStance | null = stance.stride;
  const base: IAutoMovieMotionHumanActionPlan =
    stride === null
      ? AutoMovieMotionHumanBase.under(context, clock.duration)
      : {
          duration: clock.duration,
          events: [],
          contacts: pickUpAdjust.plants(
            stride,
            clock.at("ready"),
            clock.at("relax"),
            clock.duration - clock.at("relax"),
            1,
          ),
          posture: (
            seconds: number,
            _channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            resolution?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[2],
          ): IAutoMovieMotionHumanPosture =>
            stride.at(
              clock.envelope(["start", "ready"], ["relax", "end"], seconds),
              resolution,
            ),
        };
  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [side, other].map(
        (arm: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => ({
          ...AutoMovieMotionHumanArmPhrase.stroke({
            body,
            clock,
            side: arm,
            origin: origins[arm],
            path: (
              _posture: IAutoMovieMotionHumanPosture,
              _seconds: number,
              progress: number,
            ): IAutoMovieMotionHumanArmTarget.ITarget =>
              arm === side
                ? holding(path.at(progress))
                : grasping(path.at(progress)),
          }),
          // The holding hand keeps the fingers it holds the loop with.
          ...(arm === side ? { channels: [`${arm}Arm`] } : {}),
          reads: ["root", `${arm}Arm`, `${arm}Hand`],
        }),
      ),
      contact: "strokeEnd",
    });
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: clock.at("ready"),
    relax: clock.at("relax"),
    end: clock.duration,
  };
  // Past the crown the loop comes down over the head to a seated
  // partner's nape and chest, below and beyond the standing arms: the
  // hands follow it there by the least hinge at the hips that brings both
  // wrists within their arms at that point of the path
  // (`HumanTrunkLean.least`, a closed form per instant), as `dressPartner`
  // reaches a kneeling crown, so the dresser keeps its standoff at the
  // seated knees. The hinge rides the path's own progress, comes in over
  // the reach and goes out over the return on the minimum-jerk profile
  // (Flash and Hogan 1985). The crown itself is reached standing, its
  // refusal above naming the partner.
  const wrist: (
    arm: AutoMovieHumanSide,
    target: IAutoMovieMotionHumanArmTarget.ITarget,
  ) => HumanTrunkLean.IWrist = (
    arm: AutoMovieHumanSide,
    target: IAutoMovieMotionHumanArmTarget.ITarget,
  ): HumanTrunkLean.IWrist => ({
    side: arm,
    point: AutoMovieMotionHumanArmTarget.goal(body, arm, target).point,
    rotation: target.rotation,
  });
  // The hinge is solved once per plan at `HINGES` + 1 evenly spaced
  // points of the path and read between them in proportion, so a
  // posture's read solves nothing.
  const keyed: readonly number[] = Array.from(
    { length: HINGES + 1 },
    (_: unknown, k: number): number => {
      const at: IAutoMovieRigidTransform = path.at(k / HINGES);
      return HumanTrunkLean.least(on(stance.posture), [
        wrist(side, holding(at)),
        wrist(other, grasping(at)),
      ]);
    },
  );
  const hinged: (progress: number) => number = (progress: number): number => {
    const x: number = Math.min(HINGES, Math.max(0, progress * HINGES));
    const k: number = Math.min(HINGES - 1, Math.floor(x));
    return keyed[k]! + (keyed[k + 1]! - keyed[k]!) * (x - k);
  };
  const hinge: (seconds: number) => number = (seconds: number): number =>
    seconds <= span.ready
      ? hinged(0) *
        minimumJerk.share(
          span.ready > 0 ? Math.max(0, seconds / span.ready) : 1,
        )
      : seconds <= span.relax
        ? hinged(clock.progress("strokeStart", "strokeEnd", seconds))
        : hinged(1) *
          (1 -
            minimumJerk.share(
              Math.min(1, (seconds - span.relax) / (span.end - span.relax)),
            ));
  const deepest: number = Math.max(...keyed);
  const leaned: IAutoMovieMotionHumanActionPlan =
    deepest > 0
      ? {
          ...HumanTrunkLean.moving(plan, deepest),
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
  // The partner's body is both arms' obstacle, the shoulders the hands
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
 * each shoulder, from the dresser's stance: chosen by inverse reachability
 * (`AutoMovieMotionHumanTouchStance.choose`, Vahrenkamp, Asfour and Dillmann
 * 2013) between standing where it entered and one adjustment step toward the
 * hands' place at the crown (`pickUpAdjust.stepped`), the first that clears it.
 * A loop too narrow for the head, or a crown neither stance clears (a standing
 * tall partner), is refused with the measure, so the partner bows or kneels.
 * Down past the crown to a seated partner's nape and chest the dresser hinges
 * at the hips by the least angle that keeps both wrists within their arms along
 * the path (`HumanTrunkLean`), as `dressPartner` reaches a kneeling crown.
 */
export const placeOverHead: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPlaceOverHead> =
  {
    name: "placeOverHead",
    interrupts: {},
    plan: planPlaceOverHead,
  };
