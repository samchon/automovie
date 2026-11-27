import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmShapes } from "./HumanArmShapes";
import { HumanArmTrajectoryJacobians as J } from "./HumanArmTrajectoryJacobians";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/*
 * Read each limited point on the actual hand and the site's asked frame.
 * Parameter site: The task and its effector-local point limits.
 * Parameter at: The site's current world frame, including its moving parent.
 * Parameter own: The actual hand.
 * Parameter frame: The posed material colliders of the arm and digits.
 * Returns: The points' geometric readings; none for a task without limits.
 * When limits name no asked rotation.
 */
export function HumanArmTrajectoryLimits(
  site: M.ISite,
  at: P.ILocated,
  own: IAutoMovieMotionHumanArmGeometry.IPlaced,
  frame: IAutoMovieMotionHumanArmGeometry.IFrame,
): HumanArmTrajectoryLimits.IRead[] {
  const material: HumanArmTrajectoryLimits.IRead[] =
    site.skinDistance === undefined
      ? []
      : [skin(frame, own, at.point, site.skinDistance)];
  if (site.limits === undefined) return material;
  const rotation: IAutoMovieQuaternion | undefined =
    at.rotation ?? site.rotation;
  if (rotation === undefined)
    throw new Error("Task point limits require an asked effector rotation");
  return material.concat(
    site.limits.map(
      (
        limit: NonNullable<M.ISite["limits"]>[number],
      ): HumanArmTrajectoryLimits.IRead => {
        const contact: IAutoMovieVector3 = P.pad(own, limit.contact);
        const point: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          at.point,
          AutoMovieEngineQuaternion.rotateVector(
            rotation,
            AutoMovieEngineVector3.subtract(limit.contact, site.contact),
          ),
        );
        return {
          contact,
          point,
          distance: 1000 * AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(contact, point)),
          allowance: Math.max(0, 1000 * limit.bound - T.TOLERANCE),
        };
      },
    ),
  );
}

/*
 * Hard task points carried by an effector, read identically by the trajectory
 * merit, convex model and fine configuration check. A point's target follows
 * the site's asked frame, including a site riding the other arm.
 */
export namespace HumanArmTrajectoryLimits {
  /*
   * One task point's current and asked places and its numerical bound.
   */
  export interface IRead {
    /*
     * The effector-carried point, world metres.
     */
    contact: IAutoMovieVector3;
    /*
     * The point's target on the site's asked frame, world metres.
     */
    point: IAutoMovieVector3;
    /*
     * Its current displacement, millimetres.
     */
    distance: number;
    /*
     * The law's bound less the solver's allowance, millimetres, never negative.
     */
    allowance: number;
  }

  /*
   * Linearise the limited points' distance bounds at one hold waypoint.
   * Parameter c: The trajectory context.
   * Parameter at: The current merit evaluation and its placements.
   * Parameter jac: The shared segment Jacobians at the iterate.
   * Parameter a: The arm.
   * Parameter k: The waypoint.
   * Parameter site: Its task.
   * Parameter weight: The exact-penalty weight.
   * Parameter index: The convex owner's variable mapping.
   * Returns: One affine distance row per nonzero task-point residual.
   */
  export function rows(
    c: M.IContext,
    at: M.IEvaluation,
    jac: readonly (readonly J.IJacobian[])[],
    a: number,
    k: number,
    site: M.ISite,
    weight: number,
    index: (a: number, k: number, f: number) => number,
  ): IAutoMovieMotionHumanQuadraticProgram.IRow[] {
    if (site.limits === undefined && site.skinDistance === undefined) return [];
    const located: P.ILocated = P.located(
      c,
      (arm: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
        at.placed[arm]![k]!,
      a,
      k,
      site,
    );
    return HumanArmTrajectoryLimits(
      site,
      located,
      at.placed[a]![k]!,
      c.frames[a]![k]!,
    ).flatMap(
      (
        limit: IRead,
        i: number,
      ): IAutoMovieMotionHumanQuadraticProgram.IRow[] => {
        if (limit.distance <= 1e-6) return [];
        const dir: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
          AutoMovieEngineVector3.subtract(limit.contact, limit.point),
          1000 / limit.distance,
        );
        const variables: number[] = c.free[a]!.map(
          (_: number, f: number): number => index(a, k, f),
        );
        const coef: number[] = J.carried(
          at,
          jac,
          a,
          k,
          "hand",
          limit.contact,
        ).map((column: IAutoMovieVector3): number => AutoMovieEngineVector3.dot(column, dir));
        if (located.on !== undefined) {
          const parent: NonNullable<P.ILocated["on"]> = located.on;
          variables.push(
            ...c.free[parent.arm]!.map((_: number, f: number): number =>
              index(parent.arm, k, f),
            ),
          );
          coef.push(
            ...J.carried(at, jac, parent.arm, k, parent.owner, limit.point).map(
              (column: IAutoMovieVector3): number => -AutoMovieEngineVector3.dot(column, dir),
            ),
          );
        }
        return [
          {
            key: `t|${a}|${k}|${i}`,
            index: variables,
            coef,
            l: -Infinity,
            u: limit.allowance - limit.distance,
            weight,
          },
        ];
      },
    );
  }
}

/*
 * The closest material point of the union of hand and digit solids to the
 * requested site.
 */
function skin(
  frame: IAutoMovieMotionHumanArmGeometry.IFrame,
  own: IAutoMovieMotionHumanArmGeometry.IPlaced,
  point: IAutoMovieVector3,
  bound: number,
): HumanArmTrajectoryLimits.IRead {
  const shapes: IAutoMovieMotionHumanArmGeometry.IShape[] =
    HumanArmShapes.colliders(frame, own);
  let index: number = 0;
  let nearest: IAutoMoviePhysicalShapeNearest.IResult | undefined;
  for (const collider of frame.colliders) {
    for (const solid of collider.shapes) {
      const placed: IAutoMovieMotionHumanArmGeometry.IShape = shapes[index++]!;
      if (collider.owner !== "hand") continue;
      if (
        nearest !== undefined &&
        AutoMovieEngineVector3.distance(placed.centre, point) - placed.radius >
          nearest.distance
      )
        continue;
      const read: IAutoMoviePhysicalShapeNearest.IResult = AutoMovieEnginePhysics.physicalShapeNearest(
        placed.pose,
        solid,
        point,
        point,
      );
      if (nearest === undefined || read.distance < nearest.distance)
        nearest = read;
    }
  }
  if (nearest === undefined)
    throw new Error("A material hand contact requires a hand collider");
  return {
    contact: nearest.point,
    point,
    distance: 1000 * Math.abs(nearest.distance),
    allowance: Math.max(0, 1000 * bound - T.TOLERANCE),
  };
}
