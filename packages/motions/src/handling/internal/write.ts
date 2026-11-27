import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanWrite,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionPropHold,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmReach } from "../../compose/internal/AutoMovieMotionHumanArmReach";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { AutoMovieMotionInterval } from "../../compose/internal/AutoMovieMotionInterval";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { heldDigits } from "./heldDigits";
import { writeAdmission } from "./writeAdmission";
import { writeWith } from "./writeWith";

/*
 * Move the working point of a held tool along an authored planar stroke.
 *
 * Register the law and perform `registered("write", params)` after taking the
 * tool in the orientation used to write. The surface belongs to a fixed rigid
 * prop. A prop that supplies a frame reader declares its rigidity with
 * `hasArticulations: false`. The arm approaches and leaves the stroke with the
 * entry wrist attitude as its goal, turned about the line from the wrist to the
 * tip (which keeps the tip on the stroke) to the turn nearest it that the
 * forearm and the wrist meet on an arc of swivels at the stroke's first point
 * (`AutoMovieMotionHumanArmReach.attitude`). The target gives each edge time
 * proportional to its length and zero speed at each vertex, using Flash and
 * Hogan's planar minimum-jerk law (1985,
 * doi:10.1523/JNEUROSCI.05-07-01688.1985). The arm plans against that target.
 * This stages the motion of the working point. Mark making and pressure depend
 * on the scene's medium.
 */
export const write: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWrite> =
  {
    name: "write",
    interrupts: {
      any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
    },
    plan: planWrite,
  };

/*
 * A world vertex of the path and its distance along that path from the first
 * vertex, metres.
 */
interface IVertex {
  /*
   * Point of the path in the world.
   */
  point: IAutoMovieVector3;

  /*
   * Length of the path to this point.
   */
  length: number;
}

/*
 * Plan once against the surface and the existing grip, then sample the arm
 * trajectory.
 */
function planWrite(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWrite>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanWrite = context.params;
  if (p.stroke.length < 2)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "stroke",
      value: p.stroke,
      reason: "a writing stroke needs at least two finite planar vertices",
      fix: "give [X, Z] vertices in metres on the surface",
    });
  if (!(p.duration > 0))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "duration",
      value: p.duration,
      reason: "a writing stroke needs a finite positive duration",
      fix: "give the duration of this stroke in seconds",
    });
  const side: AutoMovieHumanSide =
    p.hand ?? (context.entry.holds.left === p.tool ? "left" : "right");
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    side,
    p.tool,
  );
  const tool: IAutoMovieMotionHumanPropReader = context.prop(p.tool);
  const support: IAutoMovieMotionHumanPropReader = context.prop(p.on);
  writeAdmission.surface(p.tool, p.on, tool.prop, () =>
    writeWith.stationary(context, p.on, side),
  );
  const surface: IAutoMovieAffordance | undefined =
    support.prop.affordances?.find(
      (affordance: IAutoMovieAffordance): boolean =>
        affordance.id === p.surface && affordance.kind === "surface",
    );
  if (surface === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "surface",
      value: p.surface,
      feasible: {
        kind: "alternatives",
        values: (support.prop.affordances ?? [])
          .filter((a: IAutoMovieAffordance): boolean => a.kind === "surface")
          .map((a: IAutoMovieAffordance): string => a.id),
      },
      reason: `${p.on} has no writing surface called ${p.surface}`,
      fix: "name the prop's planar surface affordance",
    });

  // The surface frame turns the planar vertices into world targets once.
  const frame: IAutoMovieRigidTransform = support.frame(context.start);
  const origin: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, surface.frame.translation),
  );
  const facing: IAutoMovieQuaternion = Quaternion.multiply(
    frame.rotation,
    surface.frame.rotation,
  );
  const vertices: IVertex[] = [];
  for (const [x, z] of p.stroke) {
    if (
      (surface.width !== undefined && Math.abs(x) > surface.width / 2) ||
      (surface.depth !== undefined && Math.abs(z) > surface.depth / 2)
    )
      throw new HumanRefusal({
        kind: "reach",
        axis: "stroke",
        value: [x, z],
        reason:
          "a stroke vertex falls outside the surface's declared rectangle",
        fix: "place the entire stroke inside the surface's width and depth",
      });
    const point: IAutoMovieVector3 = Vector3.add(
      origin,
      Quaternion.rotateVector(facing, { x, y: 0, z }),
    );
    const previous: IVertex | undefined = vertices.at(-1);
    const length: number =
      previous === undefined
        ? 0
        : previous.length +
          Vector3.length(Vector3.subtract(point, previous.point));
    if (previous !== undefined && !(length > previous.length))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "stroke",
        value: [x, z],
        reason: "consecutive stroke vertices must be finite and distinct",
        fix: "remove consecutive duplicates and use finite surface distances",
      });
    vertices.push({ point, length });
  }
  const first: IVertex = vertices[0]!;
  const last: IVertex = vertices.at(-1)!;

  // A rigid hold composes the wrist rotation before the stored prop turn.
  // The working point is the carried tip, measured from the wrist joint.
  const toolFrame: IAutoMovieRigidTransform = tool.frame(context.entry.seconds);
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      toolFrame.rotation,
      Quaternion.inverse(held.frame.rotation),
    ),
  );
  const tip: IAutoMovieMotionHumanHeld.IPointResult =
    AutoMovieMotionHumanHeld.point(held, p.tip);
  const contact: IAutoMovieVector3 = Vector3.add(
    HumanHand.offset(context.body, side, "grip").point,
    tip.point,
  );
  const site: IAutoMovieAffordance = held.affordances.find(
    (affordance: IAutoMovieAffordance): boolean => affordance.id === p.tip,
  )!;
  writeAdmission.tip(tool.prop, site);
  const entered: IAutoMovieVector3 = Vector3.add(
    toolFrame.position,
    Quaternion.rotateVector(toolFrame.rotation, site.frame.translation),
  );
  const tempo: number = context.tempo ?? 1;
  const writing: number = p.duration * tempo;
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare:
      tempo *
      AutoMovieMotionHumanTiming.transport(
        Vector3.length(Vector3.subtract(first.point, entered)),
      ),
    attack: writing,
    retract:
      tempo *
      AutoMovieMotionHumanTiming.transport(
        Vector3.length(Vector3.subtract(last.point, entered)),
      ),
  });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    context.entry.posture,
    side,
  );
  // With the other hand steadying a tool of its own, both handles turn out
  // toward their hands so the two grips stay a hand's length apart over the
  // whole stroke (`writeWith.splay`).
  const aim: writeWith.IAim | undefined =
    p.steady === undefined
      ? undefined
      : writeWith.steadyAim(context, p.steady, side, origin, facing);
  const turns: writeWith.ISplay | undefined =
    aim === undefined
      ? undefined
      : writeWith.splay(
          context.body,
          facing,
          {
            point: first.point,
            lever: Quaternion.rotateVector(rotation, contact),
          },
          {
            point: aim.target,
            lever: Quaternion.rotateVector(aim.rotation, aim.contact),
          },
          vertices.map((vertex: IVertex): IAutoMovieVector3 => vertex.point),
        );
  const asked: IAutoMovieQuaternion =
    turns === undefined
      ? rotation
      : Quaternion.normalize(Quaternion.multiply(turns.stroke, rotation));
  // A turn of the hand about the line from the wrist to the tip keeps the tip
  // where the stroke puts it, so that turn is the hand's to choose: the one
  // nearest the asked attitude that the forearm's twist and the wrist meet on
  // an arc of swivels at the stroke's first point is taken at plan time
  // (`AutoMovieMotionHumanArmReach.attitude`; Tolani, Goswami and Badler 2000,
  // section 3.2.4), not the pick-up's attitude carried into a stroke its arm
  // meets only at an arc's edge.
  const reach: IAutoMovieVector3 = Quaternion.rotateVector(asked, contact);
  const holding: IAutoMovieQuaternion = AutoMovieMotionHumanArmReach.attitude({
    body: context.body,
    posture: context.entry.posture,
    side,
    bend,
    requested: asked,
    axis: reach,
    wrist: (): IAutoMovieVector3 => Vector3.subtract(first.point, reach),
    name: "tool",
  }).rotation;
  const lever: IAutoMovieVector3 = Quaternion.rotateVector(holding, contact);
  writeWith.reach(
    context,
    side,
    vertices.map((vertex: IVertex): IAutoMovieVector3 => vertex.point),
    lever,
  );
  // The whole clock is the law's own, lengthened by a slower tempo. A
  // steadying arm is planned in the stroking arm's group, the two one
  // problem over one span (writeWith.steady).
  const group: ReturnType<typeof AutoMovieMotionHumanArm.together> =
    AutoMovieMotionHumanArm.together(context.handover, true, context.tempo);
  const steadied: writeWith.ISteadied | undefined =
    p.steady === undefined
      ? undefined
      : writeWith.steady(
          context,
          p.steady,
          side,
          origin,
          facing,
          clock,
          turns?.steady,
          group,
        );
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    body: context.body,
    side,
    from: 0,
    to: clock.duration,
    span: { start: 0, ready, relax: done, end: clock.duration },
    together: group,
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
    // The mark is as wide as the tip that makes it: the stroke's point may
    // land within the radius the tip declares; a tip declaring none is a point.
    disc: site.radius ?? 0,
    weight: (seconds: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], seconds),
    goal: (
      _posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieHumanLimbGoal => ({
      point: Vector3.subtract(
        strokePoint(vertices, last.length * ((seconds - ready) / writing)),
        lever,
      ),
      rotation: holding,
      contact,
      bend,
    }),
  });

  // The arm trajectory takes over the existing grasp without writing new
  // finger angles or ending the hold when the stroke returns.
  const kept: IAutoMovieMotionPropHold = AutoMovieMotionHumanHeld.hold(
    context,
    held,
  );
  const toolDrives: IAutoMovieMotionPropDrive[] = writeWith.drives(
    context,
    p.tool,
    p.drive ?? [],
    clock.duration,
    ready,
    done,
  );
  const digits: (
    seconds: number,
  ) => Partial<Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>> =
    heldDigits(context, held, p.drive ?? [], toolDrives);
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: {
        ...base,
        posture: (seconds: number): IAutoMovieMotionHumanPosture => {
          const posture: IAutoMovieMotionHumanPosture = base.posture(seconds);
          return {
            ...posture,
            joints: {
              ...posture.joints,
              ...kept.fingers,
              ...steadied?.hold.fingers,
            },
            digits: { ...posture.digits, ...digits(seconds) },
          };
        },
      },
      clock,
      primitives: steadied === undefined ? [arm] : [arm, steadied.primitive],
      contact: "strokeStart",
    });
  const end: number = done / clock.duration;
  return {
    ...plan,
    contacts: [
      ...plan.contacts,
      AutoMovieMotionHumanHeld.grip(held),
      ...(steadied === undefined ? [] : [steadied.contact]),
    ],
    holds: [
      ...(plan.holds ?? []),
      { ...kept, from: 1 },
      ...(steadied === undefined ? [] : [{ ...steadied.hold, from: 1 }]),
    ],
    drives: toolDrives,
    launches: (p.release ?? []).map(
      (subject: string): IAutoMovieMotionPropLaunch => {
        const frame: IAutoMovieRigidTransform = context
          .prop(subject)
          .frame(context.start + done);
        return {
          prop: subject,
          seconds: done,
          point: frame.position,
          velocity: { x: 0, y: 0, z: 0 },
          rotation: frame.rotation,
        };
      },
    ),
    mounts: [
      ...(p.take === undefined
        ? []
        : [writeWith.mount(context, p.take, p.tool, end)]),
      ...(p.leave === undefined
        ? []
        : [writeWith.mount(context, p.leave, p.on, end)]),
    ],
  };
}

/*
 * The edge at an arc-length interval, eased between its two vertices.
 */
function strokePoint(
  path: readonly IVertex[],
  distance: number,
): IAutoMovieVector3 {
  let first: number = 0;
  let last: number = path.length - 1;
  if (distance <= 0) return path[first]!.point;
  if (distance >= path[last]!.length) return path[last]!.point;
  while (last - first > 1) {
    const middle: number = Math.floor((first + last) / 2);
    if (path[middle]!.length <= distance) first = middle;
    else last = middle;
  }
  const a: IVertex = path[first]!;
  const b: IVertex = path[last]!;
  return Vector3.lerp(
    a.point,
    b.point,
    AutoMovieMotionInterval.progress(a.length, b.length, distance),
  );
}
