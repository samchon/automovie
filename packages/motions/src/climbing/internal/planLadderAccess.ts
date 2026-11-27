import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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

import { stand } from "../../actions/internal/stand";
import { support } from "../../actions/internal/support";
import { getUp } from "../../floor/internal/getUp";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanLadder } from "./HumanLadder";
import type { ILadderAccessGrip } from "./ILadderAccessGrip";
import { ladderAccessRails } from "./ladderAccessRails";
import { ladderAccessSurface } from "./ladderAccessSurface";
import { planLadderAccessBounds } from "./planLadderAccessBounds";
import { seatLadderAccessGrips } from "./seatLadderAccessGrips";

/*
 * Connect a fixed rung ladder's floor and upper surface in either direction.
 * Every target is a floor point, a point on a real rung or rail, or the
 * landing's surface. The shared support planner fits each change of load. The
 * ascent ends with both feet at an edge stance just inside the landing's near
 * edge; a descent first steps each foot, one at a time, from where the
 * performer stands to that edge stance, then replays the ascent backwards.
 * Parameter context: The actor and fixed placed geometry.
 * Parameter ladder: The existing physical rung geometry.
 * Parameter exit: The upper supporting surface and selected direction.
 * Returns: A fully staged continuous multi-contact route.
 * If the geometry and initial standing stance do not
 * admit the route or a contact cannot bear.
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
  const surface: ladderAccessSurface.ISurface | undefined = ladderAccessSurface(
    landing.prop,
    exit.point,
  );
  const refuse = (reason: string): never => {
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "landing.point",
      value: exit.point,
      reason,
      fix: "stage a fixed horizontal surface directly above the ladder and face it from the departure side",
    });
  };
  if (surface === undefined)
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
  const lastRung: number =
    (ladder.rungs?.at(-1)?.center.y ??
      ladder.frame.origin.y + ladder.count * ladder.spacing) -
    ladder.frame.origin.y;
  if (
    -near > 0.03 ||
    near > planLadderAccessBounds.MAX_GAP ||
    height < ladder.spacing ||
    height > lastRung + 0.5 * ladder.spacing
  )
    return refuse(
      "the staged landing does not meet the ladder at a reachable height and depth",
    );
  const expected: number = Math.max(
    1,
    ladder.rungs === undefined
      ? Math.floor((height - 0.35 * ladder.spacing) / ladder.spacing)
      : ladder.rungs.filter(
          (rung: IAutoMovieMotionHumanLadder.IRung): boolean =>
            rung.center.y <=
            ladder.frame.origin.y + height - 0.35 * ladder.spacing,
        ).length,
  );
  if (context.params.rungs !== undefined && context.params.rungs !== expected)
    return refuse(
      "the specified last rung does not meet the named landing (needs " +
        expected +
        ")",
    );
  const trace: IAutoMovieVector3 = frame.local(context.entry.posture.root);
  const heelRoom: number =
    planLadderAccessBounds.HEEL_ROOM * body.measure.footLength;
  if (
    context.entry.base.kind !== "standing" ||
    Math.abs(AutoMovieEngineMath.wrapDegrees(context.entry.posture.yaw - yaw)) > 15 ||
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
    dip + planLadderAccessBounds.SOLE_MARGIN >
      Math.min(
        ladder.width,
        ...(ladder.rungs
          ?.slice(0, expected)
          .map(
            (rung: IAutoMovieMotionHumanLadder.IRung): number => rung.width,
          ) ?? []),
      ) /
        2 ||
    Math.abs(local.x) + dip + planLadderAccessBounds.SOLE_MARGIN >
      surface.width / 2 ||
    heelRoom + planLadderAccessBounds.LANDING_MARGIN > surface.depth
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
    frame.point({ x: 0, y: 0, z: -planLadderAccessBounds.FLOOR_STANCE }),
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
  for (const side of planLadderAccessBounds.SIDES) {
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
    Math.round(
      (planLadderAccessBounds.GRIP_HEIGHT * body.measure.stature) /
        ladder.spacing,
    ),
  );
  const history: IAutoMovieMotionHumanSupport.IStance[] = [];
  const current: Map<Part, Contact> = new Map();
  const capture = (
    event: string,
    seconds: number = planLadderAccessBounds.BEAT,
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
              Math.min(
                (ladder.rungs?.[level - 1]?.width ?? ladder.width) * 0.37,
                body.measure.chestBreadth / 2,
              ),
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
    const crown: IAutoMovieVector3 = rung(
      level,
      side === "left" ? dip : -dip,
      "crown",
    );
    return {
      part: side === "left" ? "leftFoot" : "rightFoot",
      kind: "bear",
      target: target(context.params.ladder, "foot" + level + ":" + side, {
        ...crown,
        y: crown.y + soleLift[side],
      }),
    };
  };
  for (const side of planLadderAccessBounds.SIDES) put(feet(side, false));
  capture("floor", planLadderAccessBounds.SETTLE, true);
  for (const side of planLadderAccessBounds.SIDES) {
    put(hand(side, grips));
    capture(side + "Grip");
  }
  for (let n: number = 1; n <= expected; n++) {
    for (const side of planLadderAccessBounds.SIDES) {
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
    for (const side of planLadderAccessBounds.SIDES) {
      put(hand(side, railLevel));
      capture(side + "TopRail");
    }
  for (const side of planLadderAccessBounds.SIDES) {
    put(feet(side, true));
    capture(side + "Landing");
  }
  for (const side of planLadderAccessBounds.SIDES) {
    current.delete(side === "left" ? "leftHand" : "rightHand");
    capture(side + "Release", planLadderAccessBounds.RELEASE, true);
  }
  capture("landing", planLadderAccessBounds.SETTLE, true);
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
          seconds: planLadderAccessBounds.SETTLE,
          prefer: getUp.POSES.stood,
        },
        {
          contacts: [feet("left", true), entryFoot("right")],
          event: "leftEdge",
          seconds: planLadderAccessBounds.BEAT,
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
            y:
              height +
              soleLift[side] +
              body.measure.footLength * planLadderAccessBounds.EDGE_RISE,
            z,
          });
        const beforeEdge: IAutoMovieVector3 = above(
          near - body.measure.footLength * planLadderAccessBounds.EDGE_BUFFER,
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
        const ordinal: number = Number(
          /^rung(\d+):/.exec(reference.point)?.[1],
        );
        const material: IAutoMovieMotionHumanLadder.IRung | undefined =
          ladder.rungs?.[ordinal - 1];
        gripWindows.push({
          side: contact.part === "leftHand" ? "left" : "right",
          point,
          rail: !reference.point.startsWith("rung"),
          ...(material === undefined ? {} : { rung: material }),
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
  let seated: IAutoMovieMotionHumanActionPlan["posture"] =
    seatLadderAccessGrips(body, intoLadder, plan, gripWindows);
  const access: IAutoMovieMotionHumanActionPlan = {
    ...plan,
    prepare: (): void => {
      plan.prepare?.();
      seated = seatLadderAccessGrips(body, intoLadder, plan, gripWindows);
    },
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture => seated(...args),
    contacts: plan.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow =>
        window.kind === "grip"
          ? { ...window, load: planLadderAccessBounds.GRIP_LOAD }
          : window,
    ),
    base: { kind: "standing" },
  };
  return HumanPreparedPlayback.rebindPosture(access, plan, body);
}
