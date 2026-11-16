import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanBodyFitRows } from "./HumanBodyFitRows";
import { HumanFitBalance } from "./HumanFitBalance";
import { HumanJacobian } from "./HumanJacobian";

/**
 * Included angles and a centre-of-mass position in the whole-body fit.
 * These are relationships of the displayed body, rather than a bone moved
 * as a substitute for them. The sprint set needs its knee, hip and centre
 * constrained together with its four supports.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two measurements and the consumer requiring them.
 * @evidence contracts/development/design.md#principled-representation An angle between three bone-carried landmarks and a world centre-of-mass point, in degrees and metres, become scalar rows of the existing whole-body fit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns these goals' reading and analytic slopes; HumanBodyFitRows and HumanBodyFitMerit share them, and HumanFitBalance owns the mass model.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No changed joint ranges, proxy bone or action-specific result.
 */
export namespace HumanFitGoals {
  /**
   * One point carried by a bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bone-local convention and default.
   * @evidence contracts/development/design.md#principled-representation A bone and a local point are a rigidly carried landmark.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two fields the landmark reading uses.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The bone is the canonical closed vocabulary.
   */
  export interface IPoint {
    /** The bone carrying the point. */
    bone: AutoMovieHumanoidBone;
    /** Metres in that bone's frame; its origin when absent. */
    point?: IAutoMovieVector3;
  }

  /**
   * The arithmetic mean of one or more bone-carried points: a joint or,
   * for example, the midpoint of the two shoulders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the averaging and the single-point case.
   * @evidence contracts/development/design.md#principled-representation A nonempty tuple of rigid points defines one affine landmark.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by each of an angle's three landmarks.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type excludes an empty mean; the runtime reading checks it too.
   */
  export type Landmark = readonly [IPoint, ...IPoint[]];

  /**
   * An unsigned included angle or closed angle interval, strictly between zero and 180 degrees.
   * A solve needs a noncollinear starting configuration for its analytic
   * derivative; collinear or coincident rays are reported explicitly.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the vertex, units, range and derivative's nondegeneracy premise.
   * @evidence contracts/development/design.md#principled-representation Three ordered landmarks define the two rays about their middle landmark.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The landmarks, desired angle and optional existing l1 price.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The actual geometric angle is constrained, rather than a clinical joint angle assumed equivalent to it.
   */
  export interface IAngle {
    /** First endpoint, vertex, second endpoint. */
    points: readonly [Landmark, Landmark, Landmark];
    /** Desired included angle or ordered inclusive bounds, degrees in (0, 180). */
    degrees: number | readonly [number, number];
    /** Price per milliradian missed; the fit's price when absent. */
    price?: number;
  }

  /**
   * A world position of the body's segmental centre of mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, units, axes and price.
   * @evidence contracts/development/design.md#principled-representation A point and selected Cartesian axes constrain the physical mass centre.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the rows and merit both read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The centre is measured by HumanFitBalance's mass model, not assigned to a bone.
   */
  export interface ICentre {
    /** Desired world metres, finite on every axis. */
    point: IAutoMovieVector3;
    /** Projection axes held: world axes or finite nonzero world directions, normalized by the reading; all three world axes when absent. */
    axes?: readonly ("x" | "y" | "z" | IAutoMovieVector3)[];
    /** Price per millimetre missed; the fit's price when absent. */
    price?: number;
  }

  /**
   * The additional quantities of one displayed-body reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each value's unit and ordering.
   * @evidence contracts/development/design.md#principled-representation Values of the goals on the same bones as every contact row.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by the rows, merit and final residuals.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No predicted or unclamped configuration is read.
   */
  export interface IReading {
    /** Included angles, radians, in goal order. */
    angles: number[];
    /** Segmental centre, world metres; absent when not requested. */
    centre?: IAutoMovieVector3;
  }

  /**
   * Read the goals on resolved bones.
   *
   * @param body The body and its mass model.
   * @param bones The displayed bones.
   * @param angles The angle goals.
   * @param centre The requested mass centre, if any.
   * @returns Radians and world metres.
   * @throws If an angle or point is invalid, or an angle has a zero ray.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, result and invalid geometry.
   * @evidence contracts/development/implementation.md#principled-implementation Included angles are atan2 of cross-product length and dot product; the mass centre is the existing segmental reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One angle map and an optional centre reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid targets throw instead of yielding a fabricated point or angle.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the landmarks plus the mass segments when a centre is requested; no new forward kinematics.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the fit's resolved bones and HumanFitBalance's cached mass model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function read(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    angles: readonly IAngle[],
    centre?: ICentre,
  ): IReading {
    if (
      centre !== undefined &&
      !Object.values(centre.point).every(Number.isFinite)
    )
      throw new Error("A centre-of-mass goal needs finite world coordinates");
    return {
      angles: angles.map((target: IAngle): number => angle(bones, target)),
      ...(centre === undefined
        ? {}
        : { centre: HumanFitBalance.centre(body, bones) }),
    };
  }

  /**
   * The actual unsigned angle, radians.
   *
   * @param bones The resolved bones.
   * @param target The three landmarks and valid desired angle.
   * @returns The included angle, radians.
   * @throws If the target is invalid or either ray has zero length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units, vertex and degeneracies.
   * @evidence contracts/development/implementation.md#principled-implementation atan2 of the sine numerator and cosine numerator gives the unsigned geometric angle without acos cancellation near its endpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three landmarks and two vector products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing bones, empty means and zero rays throw.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the points defining the three landmarks.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The owning reading calls once per angle.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function angle(
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    target: IAngle,
  ): number {
    bounds(target);
    const [u, v]: [IAutoMovieVector3, IAutoMovieVector3] = rays(bones, target);
    return Math.atan2(Vector3.length(Vector3.cross(u, v)), Vector3.dot(u, v));
  }

  /**
   * Validated angle limits in radians; a scalar has coincident limits.
   *
   * @param target The geometric angle goal.
   * @returns Its ordered inclusive limits in radians.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States units, scalar convention and validity.
   * @evidence contracts/development/implementation.md#principled-implementation Converts the goal's degree interval to radians without changing its physical width.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One normalization, validation and conversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejects reversed, nonfinite or endpoint-singular goals rather than clipping them.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Rows, merit and residuals share this convention.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bounds(target: IAngle): readonly [number, number] {
    const degrees: readonly [number, number] =
      typeof target.degrees === "number"
        ? [target.degrees, target.degrees]
        : target.degrees;
    if (!(degrees[0] > 0 && degrees[0] <= degrees[1] && degrees[1] < 180))
      throw new Error(
        "An included-angle goal needs ordered degrees strictly between 0 and 180",
      );
    return [(degrees[0] * Math.PI) / 180, (degrees[1] * Math.PI) / 180];
  }

  /**
   * The included angle's analytic derivative per posture-variable unit.
   *
   * @param bones The same bones the motions were derived from.
   * @param motions The existing geometric Jacobian's variable motions.
   * @param target The three landmarks.
   * @returns Radians per variable's unit, in motion order.
   * @throws At collinear rays, where the unsigned angle has no unique derivative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the Jacobian units and noncollinearity requirement.
   * @evidence contracts/development/implementation.md#principled-implementation Differentiates atan2 of cross length and dot: with unit n along u cross v, gradients of the angle in its two rays are (u cross n)/|u|² and (n cross v)/|v|²; the vertex moves both rays negatively. Rigid-point velocities are HumanJacobian's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two ray gradients dotted with each variable's endpoint-minus-vertex velocities.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A singular angle is reported instead of inventing a bending plane or perturbing the pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in variables times landmark points; uses no finite-difference fits or forward kinematics.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the fit's existing bones and geometric Jacobian motions.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function slopes(
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    motions: readonly HumanJacobian.IMotion[],
    target: IAngle,
  ): number[] {
    const [u, v]: [IAutoMovieVector3, IAutoMovieVector3] = rays(bones, target);
    const cross: IAutoMovieVector3 = Vector3.cross(u, v);
    const length: number = Vector3.length(cross);
    if (!(length > 0))
      throw new Error(
        "An included-angle fit needs a noncollinear starting configuration",
      );
    const n: IAutoMovieVector3 = Vector3.scale(cross, 1 / length);
    const gu: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(u, n),
      1 / Vector3.dot(u, u),
    );
    const gv: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(n, v),
      1 / Vector3.dot(v, v),
    );
    return motions.map((motion: HumanJacobian.IMotion): number => {
      const a: IAutoMovieVector3 = velocity(bones, target.points[0], motion);
      const b: IAutoMovieVector3 = velocity(bones, target.points[1], motion);
      const c: IAutoMovieVector3 = velocity(bones, target.points[2], motion);
      return (
        Vector3.dot(gu, Vector3.subtract(a, b)) +
        Vector3.dot(gv, Vector3.subtract(c, b))
      );
    });
  }

  /**
   * Unit projection directions of a positional centre goal.
   *
   * @param target The positional goal.
   * @returns Unit world directions, preserving their given order.
   * @throws If an explicit direction is zero or non-finite.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States normalization, frame, order and invalid directions.
   * @evidence contracts/development/implementation.md#principled-implementation A position constrained on a direction is its scalar projection; normalization keeps the row in metres regardless of the author's vector length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure World-axis basis vectors or normalized supplied directions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid directions throw rather than becoming an unrelated world axis.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in requested axes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The rows, merit and result use this same direction convention.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function directions(target: ICentre): IAutoMovieVector3[] {
    return (target.axes ?? (["x", "y", "z"] as const)).map(
      (axis: "x" | "y" | "z" | IAutoMovieVector3): IAutoMovieVector3 => {
        if (typeof axis === "string") {
          if (axis === "x") return { x: 1, y: 0, z: 0 };
          if (axis === "y") return { x: 0, y: 1, z: 0 };
          if (axis === "z") return { x: 0, y: 0, z: 1 };
          throw new Error("A centre goal names an unknown world axis");
        }
        const length: number = Vector3.length(axis);
        if (!(length > 0) || !Object.values(axis).every(Number.isFinite))
          throw new Error(
            "A centre goal needs finite nonzero projection directions",
          );
        return Vector3.scale(axis, 1 / length);
      },
    );
  }

  /**
   * Append the angle and centre equalities using the row owner's builder.
   *
   * @param step The whole-body step.
   * @param equal The existing equality-row builder, receiving already scaled slopes.
   * @param mm The row owner's millimetres/milliradians scale.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States row order and scaling.
   * @evidence contracts/development/implementation.md#principled-implementation The same scalar values the merit reads are linearised by the angle derivative and the segmental centre's mass-weighted point Jacobian.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Angle rows, then selected Cartesian centre rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every goal uses its own price or the existing default; no action is named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One angle derivative per target and one centre Jacobian shared across its axes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the owning equality builder and HumanFitBalance.velocities.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rows(
    step: HumanBodyFitRows.IStep,
    equal: (
      key: string,
      f: (r: HumanBodyFitRows.IReading) => number,
      goal: number,
      coef: number[],
      weight: number,
      upper?: number,
    ) => void,
    mm: number,
  ): void {
    step.angles.forEach((target: IAngle, k: number): void => {
      const [lo, hi]: readonly [number, number] = bounds(target);
      equal(
        `angle:${k}`,
        (r: HumanBodyFitRows.IReading): number => r.angles[k]!,
        lo,
        slopes(step.at.bones, step.motions, target).map(
          (v: number, i: number): number => v * step.units[i]! * mm,
        ),
        target.price ?? step.price,
        hi,
      );
    });
    if (step.centre === undefined) return;
    const target: ICentre = step.centre;
    const columns: IAutoMovieVector3[] = HumanFitBalance.velocities(
      step.body,
      step.at.bones,
      step.motions,
    );
    directions(target).forEach((axis: IAutoMovieVector3, k: number): void =>
      equal(
        `centre:${k}`,
        (r: HumanBodyFitRows.IReading): number => Vector3.dot(r.centre!, axis),
        Vector3.dot(target.point, axis),
        columns.map(
          (v: IAutoMovieVector3, i: number): number =>
            Vector3.dot(v, axis) * step.units[i]! * mm,
        ),
        target.price ?? step.price,
      ),
    );
  }
}

/** The world mean of a nonempty set of bone-carried points. */
function landmark(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  points: HumanFitGoals.Landmark,
): IAutoMovieVector3 {
  if (points.length === 0)
    throw new Error("A landmark needs at least one point");
  let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const point of points) {
    const bone: IAutoMovieResolvedBone | undefined = bones.get(point.bone);
    if (bone === undefined)
      throw new Error(`A landmark's bone ${point.bone} is absent`);
    const placed: IAutoMovieVector3 =
      point.point === undefined
        ? bone.worldPosition
        : Vector3.add(
            bone.worldPosition,
            Quaternion.rotateVector(bone.worldRotation, point.point),
          );
    sum = Vector3.add(sum, placed);
  }
  return Vector3.scale(sum, 1 / points.length);
}

/** The mean velocity of the same rigid landmarks under one existing Jacobian motion. */
function velocity(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  points: HumanFitGoals.Landmark,
  motion: HumanJacobian.IMotion,
): IAutoMovieVector3 {
  let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const point of points) {
    const at: IAutoMovieVector3 = landmark(bones, [point]);
    sum = Vector3.add(sum, HumanJacobian.velocity(motion, point.bone, at));
  }
  return Vector3.scale(sum, 1 / points.length);
}

/** Endpoint-minus-vertex rays; a zero ray does not define an included angle. */
function rays(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  target: HumanFitGoals.IAngle,
): [IAutoMovieVector3, IAutoMovieVector3] {
  const vertex: IAutoMovieVector3 = landmark(bones, target.points[1]);
  const u: IAutoMovieVector3 = Vector3.subtract(
    landmark(bones, target.points[0]),
    vertex,
  );
  const v: IAutoMovieVector3 = Vector3.subtract(
    landmark(bones, target.points[2]),
    vertex,
  );
  if (!(Vector3.length(u) > 0 && Vector3.length(v) > 0))
    throw new Error("An included angle needs two nonzero rays");
  return [u, v];
}
