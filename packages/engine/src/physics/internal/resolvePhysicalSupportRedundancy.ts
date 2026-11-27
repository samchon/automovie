import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieResolvePhysicalSupportRedundancy,
  IAutoMovieRigidTransform,
  IAutoMovieSingularDecomposition,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { decomposeSingularMatrix } from "../../math/internal/decomposeSingularMatrix";
import { physicalJointRelativeRotation } from "./physicalJointRelativeRotation";
import { AutoMovieEnginePhysicalSingularBudget } from "../AutoMovieEnginePhysicalSingularBudget";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";

/*
 * Return a warm support seed's redundant coordinates to the authored posture.
 *
 * A warm seed keeps the previous fit's task-space choice, such as which way a
 * near-straight chain bends. The support task constrains only each endpoint and
 * its planted floor witnesses, so a coordinate change in that task's null space
 * (a limb swivel or patch yaw) has no restoring term in the least-squares fit,
 * whose steps never leave the row space. Carried forward from step to step,
 * such a change accumulates under root sway. This applies Liégeois's redundancy
 * resolution once to the seed: the coordinate difference to the admitted
 * authored posture is split along the right singular directions of the
 * support-task Jacobian. Directions are returned to authored from the smallest
 * linearized task effect upward while the root-sum-square of those effects
 * stays within the fit's own residual tolerance; the remaining directions keep
 * the warm task-space choice. The null space therefore always returns, and a
 * near-singular row (whose singular value is small but whose task effect is
 * second order) does not hold a first-order posture offset. The subsequent
 * bounded fit corrects the task within the same tolerance.
 *
 * Coordinates are the native independent twist coordinates θ = 2 atan(q_axis /
 * w) owned by projectPhysicalJointRotation. The Jacobian uses central
 * differences with the error-optimal step ε^(1/3); its truncation and rounding
 * noise is of relative order ε^(2/3), far below the tolerance budget, so
 * numerically null directions always return. ROM projection follows the
 * update.
 */
export function resolvePhysicalSupportRedundancy(
  input: IAutoMovieResolvePhysicalSupportRedundancy.IInput,
): Record<string, IAutoMovieRigidTransform> {
  if (input.tolerance <= 0)
    throw new Error("Invalid support redundancy tolerance");
  const coordinates: {
    joint: IAutoMoviePhysicalJoint;
    axis: IAutoMoviePhysicalJointAxis;
  }[] = [];
  for (const segment of input.order) {
    const joint: IAutoMoviePhysicalJoint | undefined = input.joints.get(
      segment.bone,
    );
    if (!joint || !input.selected.has(segment.bone)) continue;
    for (const axis of joint.axes)
      if (axis.maximum > axis.minimum) coordinates.push({ joint, axis });
  }
  if (!coordinates.length) return { ...input.seed };
  if (coordinates.length > 64)
    throw new Error("Support redundancy coordinate budget exceeded");

  // Admitted coordinates of the warm seed and of the authored anchor.
  const seed: number[] = coordinates.map(
    ({
      joint,
      axis,
    }: {
      joint: IAutoMoviePhysicalJoint;
      axis: IAutoMoviePhysicalJointAxis;
    }): number =>
      angle(
        projectPhysicalJointRotation(
          joint,
          physicalJointRelativeRotation(input.seed, joint),
        ),
        axis,
      ),
  );
  const authored: number[] = coordinates.map(
    ({
      joint,
      axis,
    }: {
      joint: IAutoMoviePhysicalJoint;
      axis: IAutoMoviePhysicalJointAxis;
    }): number =>
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

  // Each coordinate's index by its joint and axis, read by `rotation`.
  const indices: Map<
    IAutoMoviePhysicalJoint,
    Map<IAutoMoviePhysicalJointAxis, number>
  > = new Map();
  coordinates.forEach(
    (coordinate: (typeof coordinates)[number], index: number): void => {
      let axes: Map<IAutoMoviePhysicalJointAxis, number> | undefined =
        indices.get(coordinate.joint);
      if (!axes) indices.set(coordinate.joint, (axes = new Map()));
      axes.set(coordinate.axis, index);
    },
  );

  // Central-difference support-task Jacobian at the seed, one column per
  // coordinate. A probe moves only its joint's descendants, so a limb whose
  // endpoint and floor witnesses lie outside them reads the same poses in both
  // probes and its rows' differences are exactly zero: only the limbs the
  // probe moves are evaluated, the rest left at that zero.
  const step: number = Math.cbrt(Number.EPSILON);
  const baseline: number[] = rows(input.seed);
  const offsets: number[] = [];
  let count: number = 0;
  for (const limb of input.pattern.limbs) {
    offsets.push(count);
    count += limbRows(input.seed, limb).length;
  }
  const columns: number[][] = coordinates.map(
    (coordinate: (typeof coordinates)[number], index: number): number[] => {
      const moved: ReadonlySet<string> = new Set(
        input.descendants.get(coordinate.joint.child)!,
      );
      const column: number[] = new Array<number>(count).fill(0);
      const plus: Record<string, IAutoMovieRigidTransform> = build(
        seed,
        index,
        step,
      );
      const minus: Record<string, IAutoMovieRigidTransform> = build(
        seed,
        index,
        -step,
      );
      input.pattern.limbs.forEach(
        (
          limb: IAutoMovieFootfallPattern["limbs"][number],
          at: number,
        ): void => {
          if (!touches(limb, moved)) return;
          const high: number[] = limbRows(plus, limb);
          const low: number[] = limbRows(minus, limb);
          for (let row: number = 0; row < high.length; row++)
            column[offsets[at]! + row] = (high[row]! - low[row]!) / (2 * step);
        },
      );
      return column;
    },
  );
  const design: number[][] = baseline.map((_: number, row: number): number[] =>
    columns.map((column: number[]): number => column[row]!),
  );
  const decomposition: IAutoMovieSingularDecomposition =
    decomposeSingularMatrix(
      design,
      AutoMovieEnginePhysicalSingularBudget.DEFAULTS,
    );
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
  const result: Record<string, IAutoMovieRigidTransform> = {
    ...input.seed,
  };
  const changed: Set<IAutoMoviePhysicalJoint> = new Set(
    coordinates.flatMap(
      (
        coordinate: (typeof coordinates)[number],
        index: number,
      ): IAutoMoviePhysicalJoint[] =>
        update[index] !== 0 ? [coordinate.joint] : [],
    ),
  );
  const owned: Set<string> = new Set();
  for (const segment of input.order) {
    const joint: IAutoMoviePhysicalJoint | undefined = input.joints.get(
      segment.bone,
    );
    if (!joint || !changed.has(joint)) continue;
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

  /*
   * Endpoint XYZ for every limb, plus each planted floor witness height.
   */
  function rows(
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): number[] {
    return input.pattern.limbs.flatMap(
      (limb: IAutoMovieFootfallPattern["limbs"][number]): number[] =>
        limbRows(poses, limb),
    );
  }

  /*
   * One limb's rows: its endpoint XYZ, plus its planted floor witness heights.
   */
  function limbRows(
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    limb: IAutoMovieFootfallPattern["limbs"][number],
  ): number[] {
    const endpoint: IAutoMovieVector3 = physicalSupportPoint(
      poses[limb.bone]!,
      limb.localPoint,
    );
    return [
      endpoint.x,
      endpoint.y,
      endpoint.z,
      ...witnesses(limb).map(
        (point: {
          bone: string;
          localPoint: IAutoMovieRigidTransform["position"];
        }): number =>
          physicalSupportPoint(poses[point.bone]!, point.localPoint).y,
      ),
    ];
  }

  /*
   * A limb's floor witnesses, read while it is planted.
   */
  function witnesses(limb: IAutoMovieFootfallPattern["limbs"][number]): {
    bone: string;
    localPoint: IAutoMovieRigidTransform["position"];
  }[] {
    return input.planted.has(limb.bone) ? (limb.floorPoints ?? []) : [];
  }

  /*
   * Whether a probe moving these bones moves any of a limb's rows.
   */
  function touches(
    limb: IAutoMovieFootfallPattern["limbs"][number],
    moved: ReadonlySet<string>,
  ): boolean {
    return (
      moved.has(limb.bone) ||
      witnesses(limb).some((point: { bone: string }): boolean =>
        moved.has(point.bone),
      )
    );
  }

  /*
   * One probe that changes a single coordinate, copying only that joint's
   * subtree.
   */
  function build(
    base: readonly number[],
    index: number,
    delta: number,
  ): Record<string, IAutoMovieRigidTransform> {
    const values: number[] = [...base];
    values[index] = values[index]! + delta;
    const joint: IAutoMoviePhysicalJoint = coordinates[index]!.joint;
    const descendants: readonly string[] = input.descendants.get(joint.child)!;
    const poses: Record<string, IAutoMovieRigidTransform> = {
      ...input.seed,
    };
    for (const bone of descendants) poses[bone] = { ...poses[bone]! };
    setPhysicalTargetJointRotation(
      poses,
      joint,
      descendants,
      rotation(joint, values),
    );
    return poses;
  }

  /*
   * Native twist-coordinate rotation of one joint; locked axes keep their
   * admitted value.
   */
  function rotation(
    joint: IAutoMoviePhysicalJoint,
    values: readonly number[],
  ): IAutoMovieRigidTransform["rotation"] {
    const tangent: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
    for (const axis of joint.axes) {
      const index: number | undefined = indices.get(joint)?.get(axis);
      tangent[axis.axis] = Math.tan(
        (index === undefined ? axis.minimum : values[index]!) / 2,
      );
    }
    return AutoMovieEngineQuaternion.normalize({ ...tangent, w: 1 });
  }
}

/*
 * Independent twist coordinate of one admitted joint rotation.
 */
function angle(
  rotation: IAutoMovieRigidTransform["rotation"],
  axis: IAutoMoviePhysicalJointAxis,
): number {
  const sign: number = rotation.w < 0 ? -1 : 1;
  return 2 * Math.atan2(rotation[axis.axis] * sign, Math.abs(rotation.w));
}
