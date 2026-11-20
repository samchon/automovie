import {
  AffordanceArticulation,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
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
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";

/** A world vertex of the path and its distance along that path from the first vertex, metres. */
interface IVertex {
  /** Point of the path in the world. */
  point: IAutoMovieVector3;

  /** Length of the path to this point. */
  length: number;
}

/**
 * Move the working point of a held tool along an authored planar stroke.
 *
 * Register the law and perform `registered("write", params)` after taking
 * the tool in the orientation used to write. The surface belongs to a fixed
 * prop without an articulation reader. The arm approaches and leaves the
 * stroke with the entry wrist attitude as its goal. The target gives each
 * edge time proportional to its length and zero speed at each vertex, using
 * Flash and Hogan's planar minimum-jerk law (1985,
 * doi:10.1523/JNEUROSCI.05-07-01688.1985). The arm plans against that target.
 * This stages the motion of the working point. Mark making and pressure
 * depend on the scene's medium.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States registration, both fixed frames, the stroke phases, edge timing, corner rule and scope.
 * @evidence contracts/development/design.md#principled-representation A law over a held tool, a fixed planar frame and an authored time-parametrized polyline. The wrist positions follow from the held tip's measured offset.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registerable law using the canonical write parameters and existing hold, clock and trajectory APIs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No specific tool, glyph, in-hand regrasp or paper geometry is required. The author supplies the stroke.
 * @evidence contracts/development/implementation.md#principled-implementation The rigid transform fixes the tip relative to the wrist. Each target is on the surface plane, along a minimum-jerk leg of the authored stroke.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the input, place the surface and tool frames, then compose one planned arm over the entered base.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tip and surface come from the props' affordances. The contact radius is the campaign's bound.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear preparation in the stroke's vertices. The shared arm planner reads target sites by binary edge lookup and solves one trajectory.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The posture reads the planned arm trajectory through the carried-arm primitive. The world surface path is formed once for that plan.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action owns the path and trajectory samples. It starts no process and acquires no external handle.
 */
export const write: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWrite> =
  {
    name: "write",
    interrupts: {
      any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
    },
    plan: planWrite,
  };

/** Plan once against the surface and the existing grip, then sample the arm trajectory. */
function planWrite(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWrite>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanWrite = context.params;
  if (
    !Array.isArray(p.stroke) ||
    p.stroke.length < 2 ||
    p.stroke.some(
      (vertex: readonly [number, number]): boolean =>
        !Array.isArray(vertex) ||
        vertex.length !== 2 ||
        !Number.isFinite(vertex[0]) ||
        !Number.isFinite(vertex[1]),
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "stroke",
      value: p.stroke,
      reason: "a writing stroke needs at least two finite planar vertices",
      fix: "give [X, Z] vertices in metres on the surface",
    });
  if (!(Number.isFinite(p.seconds) && p.seconds > 0))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "seconds",
      value: p.seconds,
      reason: "a writing stroke needs a finite positive duration",
      fix: "give the duration of this stroke in seconds",
    });
  const side: AutoMovieHumanSide =
    p.side ?? (context.entry.holds.left === p.tool ? "left" : "right");
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
    context,
    side,
    p.tool,
  );
  const tool: IAutoMovieMotionHumanPropReader = context.prop(p.tool);
  const support: IAutoMovieMotionHumanPropReader = context.prop(p.on);
  if (
    p.on === p.tool ||
    tool.prop.fixed === true ||
    tool.prop.motion !== undefined ||
    support.prop.fixed !== true ||
    support.prop.motion !== undefined ||
    (support.prop.hasArticulations ?? support.prop.articulate !== undefined)
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "on",
      value: p.on,
      reason: "writing needs a carried tool and a separate stationary surface",
      fix: "give a fixed support without articulation and a grip-driven tool",
    });
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
    if (
      !Number.isFinite(length) ||
      (previous !== undefined && !(length > previous.length))
    )
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
  if (
    tool.prop.point !== undefined ||
    (tool.prop.articulate !== undefined &&
      (site.rides !== undefined || AffordanceArticulation.KINDS.has(site.kind)))
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "tip",
      value: p.tip,
      reason: "writing needs a working point fixed to the held tool frame",
      fix: "use a fixed working point on the tool",
    });
  const entered: IAutoMovieVector3 = Vector3.add(
    toolFrame.position,
    Quaternion.rotateVector(toolFrame.rotation, site.frame.translation),
  );
  const tempo: number = context.tempo ?? 1;
  const writing: number = p.seconds * tempo;
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
  const lever: IAutoMovieVector3 = Quaternion.rotateVector(rotation, contact);
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    body: context.body,
    side,
    from: 0,
    to: clock.duration,
    span: { start: 0, ready, relax: done, end: clock.duration },
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
    // A point target leaves the millimetre allowance to the arm solver.
    disc: 0,
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
      rotation,
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
            joints: { ...posture.joints, ...kept.fingers },
          };
        },
      },
      clock,
      primitives: [arm],
      contact: "strokeStart",
    });
  return {
    ...plan,
    contacts: [...plan.contacts, AutoMovieMotionHumanHeld.grip(held)],
    holds: [...(plan.holds ?? []), { ...kept, from: 1 }],
  };
}

/** The edge at an arc-length interval, eased between its two vertices. */
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
    minimumJerk((distance - a.length) / (b.length - a.length)).s,
  );
}
