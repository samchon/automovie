import { physicalShapeNearest, Quaternion, Vector3 } from "@automovie/engine";
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

/**
 * Hard task points carried by an effector, read identically by the trajectory
 * merit, convex model and fine configuration check. A point's target follows
 * the site's asked frame, including a site riding the other arm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names all three consumers and the two frames.
 * @evidence contracts/development/design.md#principled-representation A rigid point's local offset and world displacement bound, with the same SE(3) composition as the site's primary contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader and its geometric result; no solver or alternate task representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The numerical solver allowance is reserved inside each law's bound, never added to it.
 */
export namespace HumanArmTrajectoryLimits {
  /**
   * One task point's current and asked places and its numerical bound.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every member states its geometric frame or millimetre unit.
   * @evidence contracts/development/design.md#principled-representation Two world points and their Euclidean displacement, with the permitted residual after reserving numerical allowance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The same reading serves the merit, convex point row and fine configuration check.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries the law's actual bound without combining angles and distances.
   */
  export interface IRead {
    /** The effector-carried point, world metres. */
    contact: IAutoMovieVector3;
    /** The point's target on the site's asked frame, world metres. */
    point: IAutoMovieVector3;
    /** Its current displacement, millimetres. */
    distance: number;
    /** The law's bound less the solver's allowance, millimetres, never negative. */
    allowance: number;
  }

  /**
   * Read each limited point on the actual hand and the site's asked frame.
   *
   * @param site The task and its effector-local point limits.
   * @param at The site's current world frame, including its moving parent.
   * @param own The actual hand.
   * @param frame The posed material colliders of the arm and digits.
   * @returns The points' geometric readings; none for a task without limits.
   * @throws {Error} When limits name no asked rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States frames, empty case, units and the invalid task.
   * @evidence contracts/development/implementation.md#principled-implementation The target is the primary contact plus the rotated difference between the two effector-local offsets; P.pad reads the actual point by the same rigid composition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame validation and one map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires a declared frame rather than choosing an axis from the actual solution; reserves T.TOLERANCE inside the physical bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per task point, without a kinematic solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares P.pad and the already located site across the merit, model and configuration check.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns geometric values and retains nothing.
   */
  export function of(
    site: M.ISite,
    at: P.ILocated,
    own: IAutoMovieMotionHumanArmGeometry.IPlaced,
    frame: IAutoMovieMotionHumanArmGeometry.IFrame,
  ): IRead[] {
    const material: IRead[] = site.skinDistance === undefined
      ? [] : [skin(frame, own, at.point, site.skinDistance)];
    if (site.limits === undefined) return material;
    const rotation: IAutoMovieQuaternion | undefined =
      at.rotation ?? site.rotation;
    if (rotation === undefined)
      throw new Error("Task point limits require an asked effector rotation");
    return material.concat(site.limits.map(
      (limit: NonNullable<M.ISite["limits"]>[number]): IRead => {
        const contact: IAutoMovieVector3 = P.pad(own, limit.contact);
        const point: IAutoMovieVector3 = Vector3.add(
          at.point,
          Quaternion.rotateVector(
            rotation,
            Vector3.subtract(limit.contact, site.contact),
          ),
        );
        return {
          contact,
          point,
          distance: 1000 * Vector3.length(Vector3.subtract(contact, point)),
          allowance: Math.max(0, 1000 * limit.bound - T.TOLERANCE),
        };
      },
    ));
  }

  /**
   * Linearise the limited points' distance bounds at one hold waypoint.
   *
   * @param c The trajectory context.
   * @param at The current merit evaluation and its placements.
   * @param jac The shared segment Jacobians at the iterate.
   * @param a The arm.
   * @param k The waypoint.
   * @param site Its task.
   * @param weight The exact-penalty weight.
   * @param index The convex owner's variable mapping.
   * @returns One affine distance row per nonzero task-point residual.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the shared iterate, derivative source, row meaning and units.
   * @evidence contracts/development/implementation.md#principled-implementation A distance derivative is its unit residual dotted with the point Jacobian; a riding target subtracts the parent's point Jacobian at that target.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared geometric reading followed by one sparse affine row per point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Extracts the convex owner's existing point rows with the same residual threshold and numerical allowance; no independent finite differences or alternative merit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the task points and participating arms' free coordinates.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares of, P.located and J.carried with the merit, fine check and existing trajectory constraints.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns rows and retains nothing.
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
    const located: P.ILocated = P.located(c, at.placed, a, k, site);
    return of(site, located, at.placed[a]![k]!, c.frames[a]![k]!).flatMap(
      (
        limit: IRead,
        i: number,
      ): IAutoMovieMotionHumanQuadraticProgram.IRow[] => {
        if (limit.distance <= 1e-6) return [];
        const dir: IAutoMovieVector3 = Vector3.scale(
          Vector3.subtract(limit.contact, limit.point),
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
        ).map((column: IAutoMovieVector3): number => Vector3.dot(column, dir));
        if (located.on !== undefined) {
          const parent: NonNullable<P.ILocated["on"]> = located.on;
          variables.push(
            ...c.free[parent.arm]!.map((_: number, f: number): number =>
              index(parent.arm, k, f),
            ),
          );
          coef.push(
            ...J.carried(at, jac, parent.arm, k, parent.owner, limit.point).map(
              (column: IAutoMovieVector3): number => -Vector3.dot(column, dir),
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
  /** The closest material point of the union of hand and digit solids to the requested site. */
  function skin(
    frame: IAutoMovieMotionHumanArmGeometry.IFrame,
    own: IAutoMovieMotionHumanArmGeometry.IPlaced,
    point: IAutoMovieVector3,
    bound: number,
  ): IRead {
    const shapes: IAutoMovieMotionHumanArmGeometry.IShape[] = HumanArmShapes.colliders(frame, own);
    let index: number = 0;
    let nearest: IAutoMoviePhysicalShapeNearest.IResult | undefined;
    for (const collider of frame.colliders) {
      for (const solid of collider.shapes) {
        const placed: IAutoMovieMotionHumanArmGeometry.IShape = shapes[index++]!;
        if (collider.owner !== "hand") continue;
        if (nearest !== undefined && Vector3.distance(placed.centre, point) - placed.radius > nearest.distance) continue;
        const read: IAutoMoviePhysicalShapeNearest.IResult = physicalShapeNearest(placed.pose, solid, point, point);
        if (nearest === undefined || read.distance < nearest.distance) nearest = read;
      }
    }
    if (nearest === undefined) throw new Error("A material hand contact requires a hand collider");
    return {
      contact: nearest.point,
      point,
      distance: 1000 * Math.abs(nearest.distance),
      allowance: Math.max(0, 1000 * bound - T.TOLERANCE),
    };
  }}
