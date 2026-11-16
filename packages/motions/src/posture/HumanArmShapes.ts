import {
  Quaternion,
  Vector3,
  physicalShapeNormal,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanColliders } from "./HumanColliders";
import { HumanShapeFraming } from "./HumanShapeFraming";

/**
 * The shapes an arm placed by the trajectory's coordinates
 * (`HumanArmGeometry`) meets: the segment each of its probes lies on, the
 * shapes a probe or a segment may come within a reach of (screened by
 * bounding spheres first, as the tangle audit's own pose does), the arm's
 * own colliders placed as shapes another arm is read against, and one
 * shape's outward normal and signed distance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what an arm placed by the coordinates meets and which owner places the arm.
 * @evidence contracts/development/design.md#principled-representation Shapes are indices into the frame's placed shapes, each with its bounding sphere, so a query returns indices the trajectory's pairs key on.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The probe's segment, the screens, the arm's colliders as shapes, and one shape's normal and distance, read by the trajectory's context, model, pairs, refinement, waypoints and Jacobians.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape is named: every query reads the frame it is given.
 */
export namespace HumanArmShapes {
  /**
   * The arm's segment a probe lies on.
   *
   * @param at The frame.
   * @param probe The probe.
   * @returns The segment: an axis sphere's by its place along the arm, a collider probe's by its owner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation An axis sphere's segment is its place along the arm's axis probes, a collider probe's the segment its collider rides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per probe kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The collider probe's owner is read from the frame, not guessed from its index.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A lookup with nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function segment(
    at: G.IFrame,
    probe: number,
  ): "upperArm" | "lowerArm" | "hand" {
    if (probe >= G.SURFACE) {
      const owner: "upper" | "lower" | "hand" = at.owners[probe - G.SURFACE]!;
      return owner === "upper"
        ? "upperArm"
        : owner === "lower"
          ? "lowerArm"
          : "hand";
    }
    return probe < 2 ? "upperArm" : probe < 6 ? "lowerArm" : "hand";
  }

  /**
   * The shapes a placed arm's probe may come within a reach of; a collider
   * probe's segment sphere is screened first, as the tangle audit's own pose
   * does.
   *
   * @param at The frame.
   * @param placed The arm placed.
   * @param probe The probe.
   * @param reach The reach, metres.
   * @param screened The placement's screen (`screen`), when it is read for many probes; taken here when absent.
   * @returns The shapes' indices.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A bounding sphere's distance never exceeds the shape's, so a shape whose sphere lies beyond the reach cannot come within it and is left out.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure An axis probe reads the frame's shapes directly; a collider probe filters its segment's screen.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only shapes that surely lie out of reach are left out; the exact distance stays the caller's.
   * @evidence contracts/development/implementation.md#efficient-algorithms One point-to-sphere distance per shape, over the segment's screen when one is given.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A screen taken once is read for every probe of the placement.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function nearby(
    at: G.IFrame,
    placed: G.IPlaced,
    probe: number,
    reach: number,
    screened?: IScreen,
  ): number[] {
    const [p, r]: readonly [IAutoMovieVector3, number] = placed.probes[probe]!;
    if (probe < G.SURFACE) return near(at, p, r + reach);
    const owner: "upper" | "lower" | "hand" = at.owners[probe - G.SURFACE]!;
    return (screened ?? screen(at, placed, reach))[owner].filter(
      (i: number): boolean =>
        Vector3.length(Vector3.subtract(p, at.shapes[i]!.centre)) -
          at.shapes[i]!.radius <
        r + reach,
    );
  }

  /**
   * The shapes each of a placed arm's segments may come within a reach of,
   * by their bounding spheres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each list holds.
   * @evidence contracts/development/design.md#principled-representation The shape indices per segment, the screen `nearby` filters.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three lists, read by `nearby`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Indices into the frame's shapes, not copies.
   */
  export type IScreen = Record<"upper" | "lower" | "hand", number[]>;

  /**
   * The shapes each of a placed arm's segments may come within a reach of:
   * the screen `nearby` reads a surface probe's shapes from, taken once for
   * every probe of the same placement.
   *
   * @param at The frame.
   * @param placed The arm placed.
   * @param reach The reach, metres.
   * @returns The shapes' indices by segment.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each segment's bounding sphere, placed by its own joint, against every shape's sphere.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading per segment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The segment's sphere is the frame's own bound of its colliders.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three sphere screens per placement instead of one per probe.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by `nearby` for every surface probe of the placement.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function screen(
    at: G.IFrame,
    placed: G.IPlaced,
    reach: number,
  ): IScreen {
    const of = (
      owner: "upper" | "lower" | "hand",
      o: IAutoMovieVector3,
      w: IAutoMovieQuaternion,
    ): number[] =>
      near(
        at,
        Vector3.add(o, Quaternion.rotateVector(w, at.bounds[owner].centre)),
        at.bounds[owner].radius + reach,
      );
    return {
      upper: of("upper", placed.shoulder, placed.upper),
      lower: of("lower", placed.elbow, placed.lower),
      hand: of("hand", placed.wrist, placed.hand),
    };
  }

  /**
   * The arm's own colliders placed where coordinates put it, as shapes
   * another arm is read against.
   *
   * @param at The frame.
   * @param placed The arm placed.
   * @returns The shapes, in the order of the frame's colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each collider rides its segment's joint: its pose composed with the joint's place and turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose per collider and one bounded shape per shape.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The colliders are the frame's own, in its order.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the arm's colliders.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each shape's sphere is `bounded`'s.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function colliders(at: G.IFrame, placed: G.IPlaced): G.IShape[] {
    const out: G.IShape[] = [];
    for (const c of at.colliders) {
      const [o, w]: [IAutoMovieVector3, IAutoMovieQuaternion] =
        c.owner === "upper"
          ? [placed.shoulder, placed.upper]
          : c.owner === "lower"
            ? [placed.elbow, placed.lower]
            : [placed.wrist, placed.hand];
      const pose: HumanColliders.IPlaced["pose"] = {
        ...c.pose,
        position: Vector3.add(o, Quaternion.rotateVector(w, c.pose.position)),
        rotation: Quaternion.multiply(w, c.pose.rotation),
      };
      for (const shape of c.shapes)
        out.push(bounded(c.bone, c.part, pose, shape));
    }
    return out;
  }

  /**
   * A placed shape with its bounding sphere (`HumanShapeFraming.sphere`).
   *
   * @param bone The bone its segment rides on.
   * @param part The audit's part, -1 for another body's.
   * @param pose The segment's world pose.
   * @param shape The shape.
   * @returns The shape.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The sphere is the one the clearance reading tests a point against first, so every screen bounds the same distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No radius is padded.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per shape, a hull's own sphere aside.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The sphere is `HumanShapeFraming.sphere`'s, the one owner of a placed shape's bound.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bounded(
    bone: AutoMovieHumanoidBone,
    part: number,
    pose: HumanColliders.IPlaced["pose"],
    shape: HumanColliders.IPlaced["shapes"][number],
  ): G.IShape {
    // Its bounding sphere is the clearance reading's own (`HumanShapeFraming.sphere`).
    return {
      bone,
      part,
      pose,
      shape,
      ...HumanShapeFraming.sphere(pose, shape),
    };
  }

  /**
   * The shapes whose bounding sphere lies within a reach of a point.
   *
   * @param at The frame.
   * @param p The point.
   * @param reach The reach, metres.
   * @returns The shapes' indices.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A shape whose bounding sphere lies beyond the reach cannot come within it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the frame's shapes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reach is the caller's; nothing is added to it.
   * @evidence contracts/development/implementation.md#efficient-algorithms One distance per shape.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure query with nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function near(
    at: G.IFrame,
    p: IAutoMovieVector3,
    reach: number,
  ): number[] {
    const out: number[] = [];
    at.shapes.forEach((shape: G.IShape, i: number): void => {
      if (
        Vector3.length(Vector3.subtract(p, shape.centre)) - shape.radius <
        reach
      )
        out.push(i);
    });
    return out;
  }

  /**
   * One shape's outward normal at a point near it: the gradient of its
   * distance there (`physicalShapeNormal`).
   *
   * @param at The frame.
   * @param shape The shape's index.
   * @param p The point.
   * @returns The unit normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's normal of the shape at the point, its distance's gradient.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The direction from the shape's centre is only the engine's fallback where the gradient vanishes.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The engine's query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `physicalShapeNormal`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function normal(
    at: G.IFrame,
    shape: number,
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const s: G.IShape = at.shapes[shape]!;
    return physicalShapeNormal(
      s.pose,
      s.shape,
      p,
      Vector3.normalize(Vector3.subtract(p, s.centre)),
    );
  }

  /**
   * A segment's signed distance to one shape.
   *
   * @param at The frame.
   * @param shape The shape's index.
   * @param a The segment's one end.
   * @param b Its other end; `a` for a point.
   * @returns Metres, negative inside.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's signed segment-to-shape distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A point is the segment from it to itself, read by the same query.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The engine's query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `physicalShapeSegmentDistance`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function gap(
    at: G.IFrame,
    shape: number,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number {
    const s: G.IShape = at.shapes[shape]!;
    return physicalShapeSegmentDistance(s.pose, s.shape, a, b);
  }

  /**
   * A point carried from one placement of a shape into another's world
   * frame, holding its coordinates relative to that shape. Both placements
   * must describe the same rigid collider.
   *
   * @param now The reference placement.
   * @param next The placement the point is read against.
   * @param point The point at `next`, world metres.
   * @returns The point at `now`, world metres, and the rotation carrying a direction with it.
   */
  export function relative(
    now: G.IShape,
    next: G.IShape,
    point: IAutoMovieVector3,
  ): { point: IAutoMovieVector3; turn: IAutoMovieQuaternion } {
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      now.pose.rotation,
      Quaternion.inverse(next.pose.rotation),
    );
    return {
      point: Vector3.add(
        now.pose.position,
        Quaternion.rotateVector(
          turn,
          Vector3.subtract(point, next.pose.position),
        ),
      ),
      turn,
    };
  }
}
