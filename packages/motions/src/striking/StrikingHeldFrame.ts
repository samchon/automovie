import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * The working points and axes read from a held prop's rigid frame. A two-point
 * working line is distinct from a surface normal, and the point's own frame
 * supplies the roll reference, so reading commutes with a rigid scene change.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the held frame, working line and roll convention.
 * @evidence contracts/development/design.md#principled-representation Affordance frames carried by the prop's offset in the grip, with an explicit line between two distinct points when requested.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The held facade delegates its point reading and perpendicular-axis construction here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop kind or world-axis roll is substituted for a two-point working line.
 */
export namespace StrikingHeldFrame {
  /**
   * The tool a held prop is, in the hand's grip frame: what `of` reads at an
   * action's entry, and what a grasp not yet taken would hold (a pick-up's
   * candidate grip, its prop's frame in that grip).
   *
   * @param held The prop in the hand's grip frame.
   * @param points The working point, optional working-line origin and edge; a blade's `point` and `edge` when absent.
   * @returns The tool in the hand's frame.
   * @throws {HumanRefusal} When a named affordance is absent, listing the ones it has, or named working-line endpoints coincide.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input's frame, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation An affordance's translation is its point and its rotated `+Y` its outward direction; an explicit `from` gives the line toward the working point, otherwise its declared along direction or its grip-to-point line for a surface normal supplies it; the point frame supplies the roll reference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One change of frame for the point, the axis and the edge.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A prop without the named point is refused; an edge that is missing or parallel to the axis is replaced by a direction square to the axis, stated in `IPoints`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A scan of the prop's few affordances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one reading of a tool from a held frame, for the held prop and a candidate grip alike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function read(
    held: IAutoMovieMotionHumanHeld.IHeld,
    points: IAutoMovieMotionHumanStrikingHeld.IPoints = {
      tip: "point",
      edge: "edge",
    },
  ): IAutoMovieMotionHumanStrikingHeld.ITool {
    const prop: string = held.prop;
    const side: IAutoMovieMotionHumanHand.Side = held.side;
    const tip: { point: IAutoMovieVector3; direction: IAutoMovieVector3 } =
      AutoMovieMotionHumanHeld.point(held, points.tip);
    // An explicit origin defines the working line separately from the
    // point's normal. Without one, a working
    // affordance whose +Y the archetype declares along the tool (a muzzle, a
    // sword's point) gives it; one whose +Y is a face's normal (a club's
    // strike) gives only the point, and the line is the grip's to it.
    const pointed: IAutoMovieAffordance = held.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === points.tip,
    )!;
    const runFrom: IAutoMovieVector3 | undefined =
      points.from === undefined
        ? undefined
        : Vector3.subtract(
            tip.point,
            AutoMovieMotionHumanHeld.point(held, points.from).point,
          );
    if (runFrom !== undefined && Vector3.length(runFrom) === 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "from",
        value: points.from,
        reason: `${prop}.${points.from} and ${points.tip} coincide, so they define no working line`,
        fix: "name distinct affordance points for the working line",
      });
    const axis: IAutoMovieVector3 =
      runFrom !== undefined
        ? Vector3.normalize(runFrom)
        : pointed.direction === "normal"
          ? Vector3.normalize(tip.point)
          : Vector3.normalize(tip.direction);
    const pointFrame: IAutoMovieQuaternion = Quaternion.multiply(
      held.frame.rotation,
      pointed.frame.rotation,
    );
    const roll: readonly [IAutoMovieVector3, IAutoMovieVector3] = [
      Quaternion.rotateVector(pointFrame, { x: 0, y: 0, z: 1 }),
      Quaternion.rotateVector(pointFrame, { x: 1, y: 0, z: 0 }),
    ];
    const edged:
      | { point: IAutoMovieVector3; direction: IAutoMovieVector3 }
      | undefined =
      points.edge !== undefined &&
      held.affordances.some(
        (a: IAutoMovieAffordance): boolean => a.id === points.edge,
      )
        ? AutoMovieMotionHumanHeld.point(held, points.edge)
        : undefined;
    const run: number | undefined = held.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === points.edge,
    )?.length;
    const length: number =
      runFrom === undefined
        ? Math.max(0, Vector3.dot(tip.point, axis))
        : Vector3.length(runFrom);
    return {
      prop,
      side,
      tip: tip.point,
      axis,
      edge: square(axis, edged?.direction ?? roll[0], roll),
      rolls: edged === undefined,
      length,
      span:
        edged === undefined || run === undefined
          ? null
          : [
              Vector3.dot(Vector3.subtract(tip.point, edged.point), axis) -
                run / 2,
              Vector3.dot(Vector3.subtract(tip.point, edged.point), axis) +
                run / 2,
            ],
      held,
      wields: {
        prop,
        side,
        tip: points.tip,
        ...(points.from === undefined ? {} : { from: points.from }),
        ...(edged !== undefined && points.edge !== undefined
          ? { edge: points.edge }
          : {}),
      },
    };
  }

  /**
   * The unit part of a direction perpendicular to an axis; source-frame
   * alternatives resolve a parallel direction without changing its roll
   * under a rigid scene transform.
   *
   * @param axis The unit working axis.
   * @param direction The preferred edge direction.
   * @param fallback Alternative directions, the canonical hand axes when absent.
   * @returns A perpendicular unit vector.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the direction, alternatives and frame covariance.
   * @evidence contracts/development/implementation.md#principled-implementation Orthogonal projection removes the component along the unit axis and normalizes the first nondegenerate residual.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered projection loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Explicit two-point tools supply the point frame's orthogonal axes, so a surface normal never invents their working line or roll.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most three vectors.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the held-point reader and facade's hand-frame alignment.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Pure vector arithmetic.
   */
  export const square = (
    axis: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    fallback?: readonly IAutoMovieVector3[],
  ): IAutoMovieVector3 => {
    for (const candidate of [
      direction,
      ...(fallback ?? [
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
      ]),
    ]) {
      const across: IAutoMovieVector3 = Vector3.subtract(
        candidate,
        Vector3.scale(axis, Vector3.dot(candidate, axis)),
      );
      if (Vector3.length(across) > 1e-6) return Vector3.normalize(across);
    }
    return { x: 1, y: 0, z: 0 };
  };
}
