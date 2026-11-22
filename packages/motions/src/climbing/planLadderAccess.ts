import { Quaternion, Vector3, wrapDegrees } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClimbLadder,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLadder,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { support } from "../actions/support";
import { getUp } from "../floor/getUp";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { HumanLadder } from "./HumanLadder";
import type { ILadderAccessGrip } from "./ILadderAccessGrip";
import { ladderAccessRails } from "./ladderAccessRails";
import { seatLadderAccessGrips } from "./seatLadderAccessGrips";

/** Both sides, left first, the order each beat moves its limbs in. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** The widest gap between the ladder's rung plane and the landing's near edge, metres (provisional: a step across, not a stride). */
const MAX_GAP: number = 0.25;

/** How far behind the rungs the floor stance stands, metres (provisional: the toes under the first rung). */
const FLOOR_STANCE: number = 0.38;

/** Heel room on the landing beyond its near edge, foot lengths (provisional: the toe joint inside the edge by most of the foot). */
const HEEL_ROOM: number = 0.84;

/** Height of the hands' first rung above the floor, statures (provisional: about shoulder height less the arm's bend). */
const GRIP_HEIGHT: number = 0.69;

/** Seconds per ladder beat (provisional). */
const BEAT: number = 0.65;

/** Lateral margin of a sole inside a rung's or landing's edge, metres (provisional). */
const SOLE_MARGIN: number = 0.07;

/** The swing waypoints' height above the landing, foot lengths (provisional: the toe clear of the edge). */
const EDGE_RISE: number = 0.55;

/** The near waypoint's distance outside the landing's edge, foot lengths (provisional: the toes clear of the edge's face). */
const EDGE_BUFFER: number = 0.62;

/** Seconds to let go of a rail and stand (provisional). */
const RELEASE: number = 0.4;

/** Seconds to settle a standing stance at either end of the route (provisional). */
const SETTLE: number = 0.3;

/** Depth the landing needs beyond the heel room, metres (provisional: the far stance's heel). */
const LANDING_MARGIN: number = 0.12;

/** The share of the body weight a grip bears on the ladder (provisional). */
const GRIP_LOAD: number = 0.1;

/**
 * Connect a fixed rung ladder's floor and upper surface in either direction.
 * Every target is a floor point, a point on a real rung or rail, or the
 * landing's surface. The shared support planner fits each change of load.
 * The ascent ends with both feet at an edge stance just inside the landing's
 * near edge; a descent first steps each foot, one at a time, from where the
 * performer stands to that edge stance, then replays the ascent backwards.
 *
 * @param context The actor and fixed placed geometry.
 * @param ladder The existing physical rung geometry.
 * @param exit The upper supporting surface and selected direction.
 * @returns A fully staged continuous multi-contact route.
 * @throws {HumanRefusal} If the geometry and initial standing stance do not admit the route or a contact cannot bear.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the geometry, direction, contact ownership and refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the actor's limb lengths and the named fixed rung, rail and landing geometry to construct the existing support planner's actual contact targets in one direction or its reverse.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare fixture frames then build one support history, delegating the pose fit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A local prop-point adapter retains true support ownership and uses only positions on the authored fixtures; the staging constants are provisional and stated as such.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the rungs climbed: a fixed number of stances per rung, each fitted once by the support law at plan time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each staged point is computed once and looked up by its target name for both the fit and the grip seating.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the staged points and grip windows for the plan's lifetime.
 */
export function planLadderAccess(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanClimbLadder.IParams>,
  ladder: IAutoMovieMotionHumanLadder.ILadder,
  exit: IAutoMovieMotionHumanClimbLadder.ILanding,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const frame: HumanFrame.IPrepared = HumanFrame.prepare(ladder.frame);
  const down: boolean = exit.direction === "down";
  const landing: IAutoMovieMotionHumanPropReader = context.prop(exit.prop);
  const surface: IAutoMovieAffordance | undefined =
    landing.prop.affordances?.find(
      (item: IAutoMovieAffordance): boolean =>
        item.id === exit.point && item.kind === "surface",
    );
  const refuse = (reason: string): never => {
    throw new HumanRefusal({
      kind: "affordance",
      axis: "landing.point",
      value: exit.point,
      reason,
      fix: "stage a fixed horizontal surface directly above the ladder and face it from the departure side",
    });
  };
  if (
    landing.prop.fixed !== true ||
    landing.prop.motion !== undefined ||
    landing.prop.hasArticulations === true ||
    surface?.width === undefined ||
    surface.depth === undefined
  )
    return refuse(
      "the named landing needs a fixed surface with width and depth",
    );

  const model: IAutoMovieRigidTransform = landing.frame(context.start);
  const center: IAutoMovieVector3 = Vector3.add(
    model.position,
    Quaternion.rotateVector(model.rotation, surface.frame.translation),
  );
  const turn: IAutoMovieQuaternion = Quaternion.multiply(
    model.rotation,
    surface.frame.rotation,
  );
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
    x: 0,
    y: 1,
    z: 0,
  });
  const across: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
    x: 1,
    y: 0,
    z: 0,
  });
  const into: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
    x: 0,
    y: 0,
    z: 1,
  });
  const local: IAutoMovieVector3 = frame.local(center);
  const yaw: number = ladder.frame.yaw;
  const acrossIn: IAutoMovieVector3 = frame.local(Vector3.add(center, across));
  const intoIn: IAutoMovieVector3 = frame.local(Vector3.add(center, into));
  if (
    normal.y < 0.999 ||
    Math.abs(acrossIn.z - local.z) > 0.03 ||
    Math.abs(intoIn.x - local.x) > 0.03
  )
    return refuse(
      "the landing must be level and aligned to the ladder's upper edge",
    );
  const near: number = local.z - surface.depth / 2;
  const height: number = local.y;
  if (
    -near > 0.03 ||
    near > MAX_GAP ||
    height < ladder.spacing ||
    height > (ladder.count + 0.5) * ladder.spacing
  )
    return refuse(
      "the staged landing does not meet the ladder at a reachable height and depth",
    );
  const expected: number = Math.max(
    1,
    Math.floor((height - 0.35 * ladder.spacing) / ladder.spacing),
  );
  if (context.params.rungs !== undefined && context.params.rungs !== expected)
    return refuse(
      "the specified last rung does not meet the named landing (needs " +
        expected +
        ")",
    );
  const trace: IAutoMovieVector3 = frame.local(context.entry.posture.root);
  const heelRoom: number = HEEL_ROOM * body.measure.footLength;
  if (
    context.entry.base.kind !== "standing" ||
    Math.abs(wrapDegrees(context.entry.posture.yaw - yaw)) > 15 ||
    Math.abs(trace.x) > 0.15 ||
    (down
      ? trace.z < near + heelRoom || trace.z > near + surface.depth - 0.08
      : trace.z >= -0.1 || -trace.z > 0.55)
  )
    return refuse(
      "the performer is outside the standing approach to this route",
    );

  const ladderProp: IAutoMovieMotionHumanPropReader = context.prop(
    context.params.ladder,
  );
  if (
    ladderProp.prop.motion !== undefined ||
    ladderProp.prop.hasArticulations === true
  )
    return refuse("the ladder must remain fixed through the transfer");
  const sideRails: ladderAccessRails.IPair | undefined = ladderAccessRails.read(
    ladderProp,
    frame,
    context.start,
  );
  if (sideRails === undefined)
    return refuse("the top transfer needs two fixed side rails on the ladder");

  type Part = IAutoMovieMotionHumanClimbLadder.Limb;
  type Contact = IAutoMovieMotionHumanSupport.IContact;
  type Points = Record<AutoMovieHumanSide, IAutoMovieVector3>;
  const staged: Map<string, IAutoMovieVector3> = new Map();
  const rung: ReturnType<typeof HumanLadder.prepareRung> =
    HumanLadder.prepareRung(ladder);
  const dip: number = Math.abs(body.rest.get("leftFoot")!.x);
  if (
    dip + SOLE_MARGIN > ladder.width / 2 ||
    Math.abs(local.x) + dip + SOLE_MARGIN > surface.width / 2 ||
    heelRoom + LANDING_MARGIN > surface.depth
  )
    return refuse("the rung or landing does not leave room for both soles");

  const target = (
    subject: string,
    key: string,
    point: IAutoMovieVector3,
  ): IAutoMovieMotionTarget => {
    staged.set(subject + "/" + key, point);
    return { kind: "prop", subject, point: key };
  };
  const floor: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    frame.point({ x: 0, y: 0, z: -FLOOR_STANCE }),
    yaw,
  );
  const entered: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const toes: Points = {
    left: entered.get("leftToes")!.worldPosition,
    right: entered.get("rightToes")!.worldPosition,
  };
  const neutralToe = (side: AutoMovieHumanSide): IAutoMovieVector3 => {
    const leg: IAutoMovieHumanLimbGoal =
      floor.limbs[side === "left" ? "leftLeg" : "rightLeg"]!;
    return HumanFoot.point(body, side, "mtp", {
      ankle: leg.point,
      rotation: leg.rotation!,
    });
  };
  const soleLift: Readonly<Record<AutoMovieHumanSide, number>> = {
    left: neutralToe("left").y - ladder.frame.origin.y,
    right: neutralToe("right").y - ladder.frame.origin.y,
  };
  for (const side of SIDES) {
    const sole: number = Math.min(
      ...HumanFoot.sockets(body, entered, side).map((socket) => socket.point.y),
    );
    const expected: number = ladder.frame.origin.y + (down ? height : 0);
    if (Math.abs(sole - expected) > 0.025)
      return refuse("the entering soles are above or below the named surface");
  }
  const feet = (side: AutoMovieHumanSide, up: boolean): Contact => {
    let at: IAutoMovieVector3;
    if (up)
      at = frame.point({
        x: side === "left" ? dip : -dip,
        y: height + soleLift[side],
        z: near + heelRoom,
      });
    else if (down) at = neutralToe(side);
    else at = toes[side];
    return {
      part: side === "left" ? "leftFoot" : "rightFoot",
      kind: "bear",
      target: up
        ? target(exit.prop, exit.point + ":" + side, at)
        : { kind: "point", frame: "world", at, normal: { x: 0, y: 1, z: 0 } },
    };
  };
  const grips: number = Math.max(
    2,
    Math.round((GRIP_HEIGHT * body.measure.stature) / ladder.spacing),
  );
  const history: IAutoMovieMotionHumanSupport.IStance[] = [];
  const current: Map<Part, Contact> = new Map();
  const capture = (
    event: string,
    seconds: number = BEAT,
    stood: boolean = false,
  ): void => {
    history.push({
      contacts: [...current.values()],
      event,
      seconds,
      ...(stood ? { prefer: getUp.POSES.stood } : {}),
    });
  };
  const put = (contact: Contact): void => {
    current.set(contact.part as Part, contact);
  };
  const hand = (side: AutoMovieHumanSide, level: number): Contact => {
    const part: Part = side === "left" ? "leftHand" : "rightHand";
    if (level <= ladder.count)
      return {
        part,
        kind: "grip",
        target: target(
          context.params.ladder,
          "rung" + level + ":" + side,
          rung(
            level,
            (side === "left" ? 1 : -1) *
              Math.min(ladder.width * 0.37, body.measure.chestBreadth / 2),
          ),
        ),
      };
    const rail: ladderAccessRails.IRail = sideRails[side];
    const wanted: number =
      (ladder.frame.origin.y + level * ladder.spacing - rail.center.y) /
      rail.axis.y;
    const along: number = Math.min(rail.half, Math.max(-rail.half, wanted));
    return {
      part,
      kind: "grip",
      target: target(
        context.params.ladder,
        rail.id + ":" + level,
        Vector3.add(rail.center, Vector3.scale(rail.axis, along)),
      ),
    };
  };
  const foot = (side: AutoMovieHumanSide, level: number): Contact => {
    const center: IAutoMovieVector3 = rung(level, side === "left" ? dip : -dip);
    return {
      part: side === "left" ? "leftFoot" : "rightFoot",
      kind: "bear",
      target: target(context.params.ladder, "foot" + level + ":" + side, {
        ...center,
        y: center.y + ladder.radius + soleLift[side],
      }),
    };
  };
  for (const side of SIDES) put(feet(side, false));
  capture("floor", SETTLE, true);
  for (const side of SIDES) {
    put(hand(side, grips));
    capture(side + "Grip");
  }
  for (let n: number = 1; n <= expected; n++) {
    for (const side of SIDES) {
      put(hand(side, grips + n));
      capture(side + "Hand" + n);
      put(foot(side, n));
      capture(side + "Foot" + n);
    }
  }
  // Take the real rails before changing either foot from a rung to the
  // ledge, including a shorter actor whose last rung grips still fit.
  const railLevel: number = Math.max(ladder.count + 1, grips + expected);
  if (grips + expected <= ladder.count)
    for (const side of SIDES) {
      put(hand(side, railLevel));
      capture(side + "TopRail");
    }
  for (const side of SIDES) {
    put(feet(side, true));
    capture(side + "Landing");
  }
  for (const side of SIDES) {
    current.delete(side === "left" ? "leftHand" : "rightHand");
    capture(side + "Release", RELEASE, true);
  }
  capture("landing", SETTLE, true);
  // A descent replays the ascent backwards, but first steps each foot, one
  // at a time, from where the performer stands on the landing back to the
  // edge stance the ascent ends on, so the side rails are within reach.
  const entryFoot = (side: AutoMovieHumanSide): Contact => ({
    part: side === "left" ? "leftFoot" : "rightFoot",
    kind: "bear",
    target: target(exit.prop, exit.point + ":" + side + ":entry", toes[side]),
  });
  const course: IAutoMovieMotionHumanSupport.IStance[] = down
    ? [
        {
          contacts: [entryFoot("left"), entryFoot("right")],
          event: "landingEntry",
          seconds: SETTLE,
          prefer: getUp.POSES.stood,
        },
        {
          contacts: [feet("left", true), entryFoot("right")],
          event: "leftEdge",
          seconds: BEAT,
          prefer: getUp.POSES.stood,
        },
        // Each key is solved from the one before; a descent that starts on
        // the landing would carry its lean onto the rungs, so every descending
        // stance prefers the upright stand over its feet.
        ...[...history].reverse().map(
          (
            stance: IAutoMovieMotionHumanSupport.IStance,
          ): IAutoMovieMotionHumanSupport.IStance => ({
            ...stance,
            prefer: getUp.POSES.stood,
          }),
        ),
      ]
    : history;
  const landed = (contact: Contact): boolean =>
    contact.target !== undefined &&
    contact.target !== "on" &&
    contact.target.kind === "prop" &&
    contact.target.subject === exit.prop;
  const gripWindows: ILadderAccessGrip[] = [];
  const plan: IAutoMovieMotionHumanActionPlan = support.plan(
    {
      ...context,
      params: { stances: course },
      aim: (reference: IAutoMovieMotionTarget, seconds: number) => {
        const point: IAutoMovieVector3 | undefined =
          reference.kind === "prop"
            ? staged.get(reference.subject + "/" + reference.point)
            : undefined;
        return point === undefined
          ? context.aim(reference, seconds)
          : { point, normal };
      },
    },
    {
      via: (
        previous: Contact,
        next: Contact,
      ): IAutoMovieVector3[] | undefined => {
        if (!next.part.endsWith("Foot") || landed(previous) === landed(next))
          return undefined;
        const side: AutoMovieHumanSide =
          next.part === "leftFoot" ? "left" : "right";
        const above = (z: number): IAutoMovieVector3 =>
          frame.point({
            x: side === "left" ? dip : -dip,
            y: height + soleLift[side] + body.measure.footLength * EDGE_RISE,
            z,
          });
        const beforeEdge: IAutoMovieVector3 = above(
          near - body.measure.footLength * EDGE_BUFFER,
        );
        const beyondEdge: IAutoMovieVector3 = above(near + heelRoom);
        return landed(next)
          ? [beforeEdge, beyondEdge]
          : [beyondEdge, beforeEdge];
      },
      level: landed,
      observe: (
        window: IAutoMovieMotionHumanContactWindow,
        contact: Contact,
      ): void => {
        const reference: Contact["target"] = contact.target;
        if (
          window.kind !== "grip" ||
          reference === undefined ||
          reference === "on" ||
          reference.kind !== "prop" ||
          reference.subject !== context.params.ladder
        )
          return;
        const point: IAutoMovieVector3 | undefined = staged.get(
          reference.subject + "/" + reference.point,
        );
        if (point === undefined) return;
        gripWindows.push({
          side: contact.part === "leftHand" ? "left" : "right",
          point,
          rail: !reference.point.startsWith("rung"),
          window,
        });
      },
    },
  );
  // The direction the gripping palms face, for the rung and rail seats.
  const intoLadder: IAutoMovieVector3 = HumanFrame.prepare({
    origin: { x: 0, y: 0, z: 0 },
    yaw,
  }).point({ x: 0, y: 0, z: -1 });
  return {
    ...plan,
    posture: seatLadderAccessGrips(body, intoLadder, plan, gripWindows),
    contacts: plan.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow =>
        window.kind === "grip" ? { ...window, load: GRIP_LOAD } : window,
    ),
    base: { kind: "standing" },
  };
}
