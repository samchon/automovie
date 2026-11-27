import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFitGoals,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanBodyFitRows } from "./HumanBodyFitRows";
import { HumanFitBalance } from "./HumanFitBalance";
import { HumanJacobian } from "./HumanJacobian";

/*
 * Included angles and a centre-of-mass position in the whole-body fit. These
 * are relationships of the displayed body, rather than a bone moved as a
 * substitute for them. The sprint set needs its knee, hip and centre
 * constrained together with its four supports.
 */
export namespace HumanFitGoals {
  /*
   * The additional quantities of one displayed-body reading.
   */
  export interface IReading {
    /*
     * Included angles, radians, in goal order.
     */
    angles: number[];
    /*
     * Segmental centre, world metres; absent when not requested.
     */
    centre?: IAutoMovieVector3;
  }

  /*
   * Read the goals on resolved bones.
   * Parameter body: The body and its mass model.
   * Parameter bones: The displayed bones.
   * Parameter angles: The angle goals.
   * Parameter centre: The requested mass centre, if any.
   * Returns: Radians and world metres.
   * If an angle or point is invalid, or an angle has a zero ray.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    angles: readonly IAutoMovieMotionHumanFitGoals.IAngle[],
    centre?: IAutoMovieMotionHumanFitGoals.ICentre,
  ): IReading {
    return {
      angles: angles.map(
        (target: IAutoMovieMotionHumanFitGoals.IAngle): number =>
          angle(bones, target),
      ),
      ...(centre === undefined
        ? {}
        : { centre: HumanFitBalance.centre(body, bones) }),
    };
  }

  /*
   * The actual unsigned angle, radians.
   * Parameter bones: The resolved bones.
   * Parameter target: The three landmarks and valid desired angle.
   * Returns: The included angle, radians.
   * If the target is invalid or either ray has zero length.
   */
  export function angle(
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    target: IAutoMovieMotionHumanFitGoals.IAngle,
  ): number {
    bounds(target);
    const [u, v]: [IAutoMovieVector3, IAutoMovieVector3] = rays(bones, target);
    return Math.atan2(Vector3.length(Vector3.cross(u, v)), Vector3.dot(u, v));
  }

  /*
   * Validated angle limits in radians; a scalar has coincident limits.
   * Parameter target: The geometric angle goal.
   * Returns: Its ordered inclusive limits in radians.
   */
  export function bounds(
    target: IAutoMovieMotionHumanFitGoals.IAngle,
  ): readonly [number, number] {
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

  /*
   * The included angle's analytic derivative per posture-variable unit.
   * Parameter bones: The same bones the motions were derived from.
   * Parameter motions: The existing geometric Jacobian's variable motions.
   * Parameter target: The three landmarks.
   * Returns: Radians per variable's unit, in motion order.
   * At collinear rays, where the unsigned angle has no unique
   * derivative.
   */
  export function slopes(
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    motions: readonly IAutoMovieMotionHumanJacobian.IMotion[],
    target: IAutoMovieMotionHumanFitGoals.IAngle,
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
    let atFirst: IAutoMovieVector3[] | undefined;
    let atVertex: IAutoMovieVector3[] | undefined;
    let atLast: IAutoMovieVector3[] | undefined;
    return motions.map(
      (motion: IAutoMovieMotionHumanJacobian.IMotion): number => {
        const a: IAutoMovieVector3 = velocity(
          bones,
          target.points[0],
          motion,
          (atFirst ??= []),
        );
        const b: IAutoMovieVector3 = velocity(
          bones,
          target.points[1],
          motion,
          (atVertex ??= []),
        );
        const c: IAutoMovieVector3 = velocity(
          bones,
          target.points[2],
          motion,
          (atLast ??= []),
        );
        return (
          Vector3.dot(gu, Vector3.subtract(a, b)) +
          Vector3.dot(gv, Vector3.subtract(c, b))
        );
      },
    );
  }

  /*
   * Unit projection directions of a positional centre goal.
   * Parameter target: The positional goal.
   * Returns: Unit world directions, preserving their given order.
   * If an explicit direction is zero or non-finite.
   */
  export function directions(
    target: IAutoMovieMotionHumanFitGoals.ICentre,
  ): IAutoMovieVector3[] {
    return (target.axes ?? (["x", "y", "z"] as const)).map(
      (axis: DirectionsAxis): IAutoMovieVector3 => {
        if (typeof axis === "string") {
          if (axis === "x") return { x: 1, y: 0, z: 0 };
          if (axis === "y") return { x: 0, y: 1, z: 0 };
          if (axis === "z") return { x: 0, y: 0, z: 1 };
          throw new Error("A centre goal names an unknown world axis");
        }
        const length: number = Vector3.length(axis);
        if (!(length > 0))
          throw new Error(
            "A centre goal needs finite nonzero projection directions",
          );
        return Vector3.scale(axis, 1 / length);
      },
    );
  }

  /*
   * Append the angle and centre equalities using the row owner's builder.
   * Parameter step: The whole-body step.
   * Parameter equal: The existing equality-row builder, receiving already scaled
   * slopes.
   * Parameter mm: The row owner's millimetres/milliradians scale.
   * Parameter readColumns: Optional lazy centre-velocity producer for this same
   * body, bones and ordered motions; called only after angle rows and when a
   * centre goal exists.
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
    readColumns?: () => readonly IAutoMovieVector3[],
  ): void {
    step.angles.forEach(
      (target: IAutoMovieMotionHumanFitGoals.IAngle, k: number): void => {
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
      },
    );
    if (step.centre === undefined) return;
    const target: IAutoMovieMotionHumanFitGoals.ICentre = step.centre;
    const columns: readonly IAutoMovieVector3[] =
      readColumns === undefined
        ? HumanFitBalance.velocities(step.body, step.at.bones, step.motions)
        : readColumns();
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

/*
 * The alternatives of `DirectionsAxis`'s site.
 */
type DirectionsAxis = "x" | "y" | "z" | IAutoMovieVector3;

/*
 * World mean with the original ordered sums in one owned accumulator; no
 * borrowed bone or point vector is changed.
 */
function landmark(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  points: IAutoMovieMotionHumanFitGoals.Landmark,
): IAutoMovieVector3 {
  if (points.length === 0)
    throw new Error("A landmark needs at least one point");
  const sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
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
    sum.x = sum.x + placed.x;
    sum.y = sum.y + placed.y;
    sum.z = sum.z + placed.z;
  }
  return Vector3.scale(sum, 1 / points.length);
}

/*
 * Mean current rigid-point velocity, preparing each world point at its first
 * original read for later unchanged-bone motions.
 */
function velocity(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  points: IAutoMovieMotionHumanFitGoals.Landmark,
  motion: IAutoMovieMotionHumanJacobian.IMotion,
  positions: IAutoMovieVector3[],
): IAutoMovieVector3 {
  const sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let k: number = 0;
  for (const point of points) {
    const at: IAutoMovieVector3 =
      positions[k] ?? (positions[k] = landmark(bones, [point]));
    ++k;
    const speed: IAutoMovieVector3 = HumanJacobian.velocity(
      motion,
      point.bone,
      at,
    );
    sum.x = sum.x + speed.x;
    sum.y = sum.y + speed.y;
    sum.z = sum.z + speed.z;
  }
  return Vector3.scale(sum, 1 / points.length);
}

/*
 * Endpoint-minus-vertex rays; a zero ray does not define an included angle.
 */
function rays(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  target: IAutoMovieMotionHumanFitGoals.IAngle,
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
