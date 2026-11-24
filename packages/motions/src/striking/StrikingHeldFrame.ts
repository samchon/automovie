import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../law/HumanRefusal";

/** The record of `IReadEdged`'s site. */
type IReadEdged = { point: IAutoMovieVector3; direction: IAutoMovieVector3 };

/** The record of `IReadTip`'s site. */
type IReadTip = { point: IAutoMovieVector3; direction: IAutoMovieVector3 };

/**
 * The working points and axes read from a held prop's rigid frame. A two-point
 * working line is distinct from a surface normal, and the point's own frame
 * supplies the roll reference, so reading commutes with a rigid scene change.
 */
export namespace StrikingHeldFrame {
  /**
   * The tool a held prop is, in the hand's grip frame: what `of` reads at an
   * action's entry, and what a grasp not yet taken would hold (a pick-up's
   * candidate grip, its prop's frame in that grip).
   *
   * @param held The prop in the hand's grip frame.
   * @param points The working point, optional working-line origin and edge; a
   *   blade's `point` and `edge` when absent.
   * @returns The tool in the hand's frame.
   * @throws {HumanRefusal} When a named affordance is absent, listing the ones
   *   it has, or named working-line endpoints coincide.
   */
  export function read(
    held: IAutoMovieMotionHumanHeld.IHeld,
    points: IAutoMovieMotionHumanStrikingHeld.IPoints = {
      tip: "point",
      edge: "edge",
    },
  ): IAutoMovieMotionHumanStrikingHeld.ITool {
    const prop: string = held.prop;
    const side: AutoMovieHumanSide = held.side;
    const tip: IReadTip = AutoMovieMotionHumanHeld.point(held, points.tip);
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
    const edged: IReadEdged | undefined =
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
   * alternatives resolve a parallel direction without changing its roll under a
   * rigid scene transform.
   *
   * @param axis The unit working axis.
   * @param direction The preferred edge direction.
   * @param fallback Alternative directions, the canonical hand axes when
   *   absent.
   * @returns A perpendicular unit vector.
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
