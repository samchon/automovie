import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { decomposeAutoMovieSingularMatrix } from "../math/decomposeAutoMovieSingularMatrix";
import { physicalJointRelativeRotation } from "./physicalJointRelativeRotation";
import { physicalSingularBudget } from "./physicalSingularBudget";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";

/**
 * Return a warm support seed's redundant coordinates to the authored posture.
 *
 * A warm seed keeps the previous fit's task-space choice, such as which way a
 * near-straight chain bends. The support task constrains only each endpoint and
 * its planted floor witnesses, so a coordinate change in that task's
 * null space (a limb swivel or patch yaw) has no restoring term in the
 * least-squares fit, whose steps never leave the row space. Carried forward
 * from step to step, such a change accumulates under root sway. This applies
 * Liégeois's redundancy resolution once to the seed: the coordinate difference
 * to the admitted authored posture is split along the right singular
 * directions of the support-task Jacobian. Directions are returned to authored
 * from the smallest linearized task effect upward while the root-sum-square of
 * those effects stays within the fit's own residual tolerance; the remaining
 * directions keep the warm task-space choice. The null space therefore always
 * returns, and a near-singular row (whose singular value is small but whose
 * task effect is second order) does not hold a first-order posture offset.
 * The subsequent bounded fit corrects the task within the same tolerance.
 *
 * Coordinates are the native independent twist coordinates
 * θ = 2 atan(q_axis / w) owned by {@link projectPhysicalJointRotation}. The
 * Jacobian uses central differences with the error-optimal step ε^(1/3); its
 * truncation and rounding noise is of relative order ε^(2/3), far below the
 * tolerance budget, so numerically null directions always return. ROM
 * projection follows the update.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Return a warm support seed's redundant coordinates to the authored posture) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Return a warm support seed's redundant coordinates to the authored posture) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over input.order; for-of over joint.axes; map over coordinates) plus a sort, delegating to `Number.isFinite`, `coordinates.push`, `coordinates.map`, `angle`, `projectPhysicalJointRotation`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 64, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 190 lines and 27 top-level statements that reuses `Number.isFinite`, `coordinates.push`, `coordinates.map`, `angle`, `projectPhysicalJointRotation` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 18 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over input.order; for-of over joint.axes; map over coordinates) plus a sort, performed once per call with 19 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 19 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function resolvePhysicalSupportRedundancy(input: {
  /** Parent-first, run-owned tree order. */ order: readonly P.ISegment[];
  /** Declared parent joints, indexed by child bone. */ joints: ReadonlyMap<
    string,
    P.IJoint
  >;
  /** Exact descendant lists, indexed by subtree root bone. */ descendants: ReadonlyMap<
    string,
    readonly string[]
  >;
  /** Coordinates owned by the support fit. */ selected: ReadonlySet<string>;
  /** Support endpoints and their optional planted witnesses. */ pattern: IAutoMovieFootfallPattern;
  /** Endpoints whose declared floor witnesses join the task. */ planted: ReadonlySet<string>;
  /** Current authored placements, the null-space anchor. */ authored: Readonly<
    Record<string, P.ITransform>
  >;
  /** The fit's own metre residual early-out; returned directions may move the task by at most this much. */ tolerance: number;
  /** Warm seed placements; borrowed, never mutated. */ seed: Readonly<
    Record<string, P.ITransform>
  >;
}): Record<string, P.ITransform> {
  if (!(input.tolerance > 0) || !Number.isFinite(input.tolerance))
    throw new Error("Invalid support redundancy tolerance");
  const coordinates: { joint: P.IJoint; axis: P.IAxis }[] = [];
  for (const segment of input.order) {
    const joint: P.IJoint | undefined = input.joints.get(segment.bone);
    if (!joint || !input.selected.has(segment.bone)) continue;
    for (const axis of joint.axes)
      if (axis.maximum > axis.minimum) coordinates.push({ joint, axis });
  }
  if (!coordinates.length) return { ...input.seed };
  if (coordinates.length > 64)
    throw new Error("Support redundancy coordinate budget exceeded");

  // Admitted coordinates of the warm seed and of the authored anchor.
  const seed: number[] = coordinates.map(
    ({ joint, axis }: { joint: P.IJoint; axis: P.IAxis }): number =>
      angle(
        projectPhysicalJointRotation(
          joint,
          physicalJointRelativeRotation(input.seed, joint),
        ),
        axis,
      ),
  );
  const authored: number[] = coordinates.map(
    ({ joint, axis }: { joint: P.IJoint; axis: P.IAxis }): number =>
      angle(
        projectPhysicalJointRotation(
          joint,
          physicalJointRelativeRotation(input.authored, joint),
        ),
        axis,
      ),
  );
  const difference: number[] = authored.map(
    (value: number, index: number): number => value - seed[index]!,
  );
  if (difference.every((value: number): boolean => value === 0))
    return { ...input.seed };

  // Central-difference support-task Jacobian at the seed, one column per coordinate.
  const step: number = Math.cbrt(Number.EPSILON);
  const baseline: number[] = rows(input.seed);
  const columns: number[][] = coordinates.map(
    (_: (typeof coordinates)[number], index: number): number[] => {
      const plus: number[] = rows(build(seed, index, step));
      const minus: number[] = rows(build(seed, index, -step));
      return plus.map(
        (value: number, row: number): number =>
          (value - minus[row]!) / (2 * step),
      );
    },
  );
  const design: number[][] = baseline.map((_: number, row: number): number[] =>
    columns.map((column: number[]): number => column[row]!),
  );
  const decomposition: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(design, physicalSingularBudget);
  // Each right singular direction k moves the linearized task by
  // sigma_k * |v_k . d| along an orthonormal left direction, so returning a
  // set of directions moves it by the root-sum-square of their effects.
  // Return the cheapest directions first while that stays within the fit's
  // own residual tolerance; numerical-null directions cost nothing.
  const effects: { column: number; projection: number; effect: number }[] =
    decomposition.singularValues.map(
      (
        singular: number,
        column: number,
      ): { column: number; projection: number; effect: number } => {
        const projection: number = decomposition.rightColumns[column]!.reduce(
          (sum: number, component: number, index: number): number =>
            sum + component * difference[index]!,
          0,
        );
        return { column, projection, effect: Math.abs(singular * projection) };
      },
    );
  effects.sort(
    (a: (typeof effects)[number], b: (typeof effects)[number]): number =>
      a.effect - b.effect || a.column - b.column,
  );
  let spent: number = 0;
  const update: number[] = [...difference];
  for (const entry of effects) {
    const total: number = Math.hypot(spent, entry.effect);
    if (total <= input.tolerance) {
      spent = total;
      continue;
    }

    // This and every costlier direction keep the warm task-space choice.
    const basis: number[] = decomposition.rightColumns[entry.column]!;
    for (let index: number = 0; index < update.length; index++)
      update[index] = update[index]! - basis[index]! * entry.projection;
    spent = Infinity;
  }
  const values: number[] = seed.map(
    (value: number, index: number): number => value + update[index]!,
  );

  // Rebuild changed joints parent-first; the ROM projection admits each result.
  const result: Record<string, P.ITransform> = { ...input.seed };
  const owned: Set<string> = new Set();
  for (const segment of input.order) {
    const joint: P.IJoint | undefined = input.joints.get(segment.bone);
    if (
      !joint ||
      !coordinates.some(
        (coordinate: (typeof coordinates)[number], index: number): boolean =>
          coordinate.joint === joint && update[index] !== 0,
      )
    )
      continue;
    const descendants: readonly string[] = input.descendants.get(joint.child)!;
    for (const bone of descendants)
      if (!owned.has(bone)) {
        result[bone] = { ...result[bone]! };
        owned.add(bone);
      }
    setPhysicalTargetJointRotation(
      result,
      joint,
      descendants,
      projectPhysicalJointRotation(joint, rotation(joint, values)),
    );
  }
  return result;

  /** Endpoint XYZ for every limb, plus each planted floor witness height. */
  function rows(poses: Readonly<Record<string, P.ITransform>>): number[] {
    return input.pattern.limbs.flatMap(
      (limb: IAutoMovieFootfallPattern["limbs"][number]): number[] => {
        const endpoint: ReturnType<typeof physicalSupportPoint> =
          physicalSupportPoint(poses[limb.bone]!, limb.localPoint);
        return [
          endpoint.x,
          endpoint.y,
          endpoint.z,
          ...(input.planted.has(limb.bone) ? (limb.floorPoints ?? []) : []).map(
            (point: {
              bone: string;
              localPoint: P.ITransform["position"];
            }): number =>
              physicalSupportPoint(poses[point.bone]!, point.localPoint).y,
          ),
        ];
      },
    );
  }

  /** One probe that changes a single coordinate, copying only that joint's subtree. */
  function build(
    base: readonly number[],
    index: number,
    delta: number,
  ): Record<string, P.ITransform> {
    const values: number[] = [...base];
    values[index] = values[index]! + delta;
    const joint: P.IJoint = coordinates[index]!.joint;
    const descendants: readonly string[] = input.descendants.get(joint.child)!;
    const poses: Record<string, P.ITransform> = { ...input.seed };
    for (const bone of descendants) poses[bone] = { ...poses[bone]! };
    setPhysicalTargetJointRotation(
      poses,
      joint,
      descendants,
      rotation(joint, values),
    );
    return poses;
  }

  /** Native twist-coordinate rotation of one joint; locked axes keep their admitted value. */
  function rotation(
    joint: P.IJoint,
    values: readonly number[],
  ): P.ITransform["rotation"] {
    const tangent: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
    for (const axis of joint.axes) {
      const index: number = coordinates.findIndex(
        (coordinate: (typeof coordinates)[number]): boolean =>
          coordinate.joint === joint && coordinate.axis === axis,
      );
      tangent[axis.axis] = Math.tan(
        (index === -1 ? axis.minimum : values[index]!) / 2,
      );
    }
    return Quaternion.normalize({ ...tangent, w: 1 });
  }
}

/** Independent twist coordinate of one admitted joint rotation. */
function angle(rotation: P.ITransform["rotation"], axis: P.IAxis): number {
  const sign: number = rotation.w < 0 ? -1 : 1;
  return 2 * Math.atan2(rotation[axis.axis] * sign, Math.abs(rotation.w));
}
