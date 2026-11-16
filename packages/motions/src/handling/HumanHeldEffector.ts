import { Vector3 } from "@automovie/engine";
import type { IAutoMovieAffordance, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanHand } from "../posture/HumanHand";
import type { HumanHeld } from "./HumanHeld";

/**
 * Prepare one held prop's fixed hand-local contact and actual rim turns.
 *
 * @param context Unchanged body, entry holding state/pose, and prop reader for one synchronous effector search.
 * @param row The fixed hand surface/shape, contact directions and upright policy.
 * @param side The holding hand.
 * @param subject The actually held prop's subject id.
 * @param point The contact id; the row's own when absent.
 * @returns Fresh original effectors for each degree turn about an upright rim; non-upright contacts retain their original turn-independent geometry.
 * @throws {HumanRefusal} The original held-prop, hand, missing-contact and invalid-direction refusals, in their original admission order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/entry/prop/contact/row lifetime, turn degrees, fresh hand-axis weights and preserved admission/refusal behavior.
 * @evidence contracts/development/implementation.md#principled-implementation The existing held owner supplies the actual named contact. Grip/surface offsets, projected directions and ring centre/radius retain the original formulas; each actual turn computes the same facing and surface-relative tool weights.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Contact admission and fixed local geometry precede a detached turn reader. across owns original projection/fallback, weights owns anatomical-axis dot products, and the cold facade and steadiest search consume this same producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact, normal, ring radius, direction refusal, first-tie fallback or quaternion/solver policy is changed. Even an upright row still admits its original along direction before replacing it with the vessel axis.
 * @evidence contracts/development/implementation.md#efficient-algorithms One actual held-entry FK/contact/hand-offset preparation serves C rim candidates instead of C repeated preparations; each requested turn retains sine/cosine and actual point/axis-weight calculations. Every upright arm solve remains with the caller; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit unchanged body, entry pose/holding fact, prop frame/affordances and row establish local-geometry equivalence. Changing them requires a new producer; no candidate pose, fit, angle or judgement is reused.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The detached reader retains constant local vector/scalar geometry and surface/shape values until its synchronous owner releases it. Each output owns fresh tool/facing/along weight records, without body/context/prop readers, FK workspaces, query/time history or handles.
 */
export function HumanHeldEffector(
  context: Pick<IHumanActionContext, "body" | "entry" | "prop">,
  row: HumanHeld.IUse,
  side: HumanHand.Side,
  subject: string,
  point?: string,
): (turn?: number) => AutoMovieMotionHumanTouchEffector.IEffector {
  const held: AutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(context, side, subject);
  const name: string | undefined = point ?? row.point;
  if (name === undefined)
    throw new HumanRefusal({ kind: "affordance", axis: "point", value: name,
      feasible: { kind: "alternatives", values: held.affordances.map(
        (affordance: IAutoMovieAffordance): string => affordance.id) },
      reason: "the act names no point of a held prop to bring to its region",
      fix: "name one of the prop's contacts as `point`, or perform the act without a prop" });

  const named: ReturnType<typeof AutoMovieMotionHumanHeld.point> = AutoMovieMotionHumanHeld.point(held, name);
  const socket: IAutoMovieVector3 = HumanHand.offset(context.body, side, "grip").point;
  const normal: IAutoMovieVector3 = named.direction;
  const own: (direction: AutoMovieMotionHumanTouchEffector.Direction | undefined,
    otherwise: AutoMovieMotionHumanTouchEffector.Axis) => IAutoMovieVector3 = (
      direction: AutoMovieMotionHumanTouchEffector.Direction | undefined,
      otherwise: AutoMovieMotionHumanTouchEffector.Axis): IAutoMovieVector3 =>
      AutoMovieMotionHumanTouchEffector.direction(side, direction ?? otherwise);
  const at: IAutoMovieVector3 = Vector3.add(socket, named.point);
  const along: IAutoMovieVector3 = across(side, normal, own(row.effector.along, "fingers"));
  let ring: IGeometry["ring"];
  if (row.upright === true) {
    const origin: IAutoMovieVector3 = Vector3.add(socket, held.frame.position);
    const centre: IAutoMovieVector3 = Vector3.add(origin, Vector3.scale(normal,
      Vector3.dot(Vector3.subtract(at, origin), normal)));
    const toward: IAutoMovieVector3 = across(side, normal, own(row.effector.facing, "palm"));
    ring = { centre, radius: Vector3.length(Vector3.subtract(at, centre)),
      toward, across: Vector3.cross(normal, toward) };
  }
  const offset: IAutoMovieVector3 = HumanHand.offset(context.body, side,
    row.effector.surface, row.effector.shape).point;
  return turning({ surface: row.effector.surface, shape: row.effector.shape,
    at, normal, along: row.upright === true ? normal : along, offset,
    scale: 1 / context.body.measure.hand, ring,
    axes: { fingers: AutoMovieMotionHumanTouchEffector.axis(side, "fingers"),
      palm: AutoMovieMotionHumanTouchEffector.axis(side, "palm"),
      thumb: AutoMovieMotionHumanTouchEffector.axis(side, "thumb") } });
}

/** Fixed local data only; no held/body/context ownership crosses into the turn reader. */
interface IGeometry {
  /** The original skin surface and hand form. */
  surface: HumanHand.Surface;
  /** The original hand form. */
  shape: HumanHand.Shape;
  /** Wrist-relative contact point, metres, before any upright rim turn. */
  at: IAutoMovieVector3;
  /** Actual contact's outward unit direction in hand axes. */
  normal: IAutoMovieVector3;
  /** The actual projected direction or upright vessel axis. */
  along: IAutoMovieVector3;
  /** Wrist-relative hand surface point, metres. */
  offset: IAutoMovieVector3;
  /** Reciprocal body hand length for original dimensionless tool shares. */
  scale: number;
  /** The original three orthonormal anatomical axes. */
  axes: Record<"fingers" | "palm" | "thumb", IAutoMovieVector3>;
  /** Upright contacts alone have a fixed ring; point contacts have none. */
  ring: { centre: IAutoMovieVector3; radius: number; toward: IAutoMovieVector3; across: IAutoMovieVector3 } | undefined;
}

/** Preserve original projection, 0.3 threshold and stable least-aligned fallback. */
function across(side: HumanHand.Side, normal: IAutoMovieVector3,
  direction: IAutoMovieVector3): IAutoMovieVector3 {
  const flat: (vector: IAutoMovieVector3) => IAutoMovieVector3 = (vector: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.subtract(vector, Vector3.scale(normal, Vector3.dot(vector, normal)));
  const projected: IAutoMovieVector3 = flat(direction);
  if (Vector3.length(projected) > 0.3) return Vector3.normalize(projected);
  const spare: IAutoMovieVector3 = (["fingers", "palm", "thumb"] as const)
    .map((axis: "fingers" | "palm" | "thumb"): IAutoMovieVector3 => AutoMovieMotionHumanTouchEffector.axis(side, axis))
    .sort((a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
      Math.abs(Vector3.dot(a, normal)) - Math.abs(Vector3.dot(b, normal)))[0]!;
  return Vector3.normalize(flat(spare));
}

/** Actual turn arithmetic stays independent of admission/body/prop readers. */
function turning(fixed: IGeometry): (turn?: number) => AutoMovieMotionHumanTouchEffector.IEffector {
  return (turn: number = 0): AutoMovieMotionHumanTouchEffector.IEffector => {
    let at: IAutoMovieVector3 = fixed.at;
    let facing: IAutoMovieVector3 = fixed.normal;
    if (fixed.ring !== undefined) {
      const angle: number = (turn * Math.PI) / 180;
      facing = Vector3.add(Vector3.scale(fixed.ring.toward, Math.cos(angle)),
        Vector3.scale(fixed.ring.across, Math.sin(angle)));
      at = Vector3.add(fixed.ring.centre, Vector3.scale(facing, fixed.ring.radius));
    }
    const from: IAutoMovieVector3 = Vector3.subtract(at, fixed.offset);
    return { surface: fixed.surface, shape: fixed.shape,
      tool: weights(Vector3.scale(from, fixed.scale), fixed.axes),
      facing: weights(facing, fixed.axes), along: weights(fixed.along, fixed.axes) };
  };
}

/** Original anatomical-axis dot products, with fresh public weight records. */
function weights(vector: IAutoMovieVector3, axes: IGeometry["axes"]): Record<"fingers" | "palm" | "thumb", number> {
  return { fingers: Vector3.dot(vector, axes.fingers),
    palm: Vector3.dot(vector, axes.palm), thumb: Vector3.dot(vector, axes.thumb) };
}
