import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { decomposeAutoMovieSingularMatrix } from "../math/decomposeAutoMovieSingularMatrix";
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
 * to the admitted authored posture is projected onto the null space of the
 * support-task Jacobian, Δθ = (I − VᵣVᵣᵀ)(θ_authored − θ_seed), so the
 * row-space (task) content stays warm and the null space returns to authored.
 * The task moves only to second order; the subsequent bounded fit corrects it.
 *
 * Coordinates are the native independent twist coordinates
 * θ = 2 atan(q_axis / w) owned by {@link projectPhysicalJointRotation}. The
 * Jacobian uses central differences with the error-optimal step ε^(1/3); its
 * truncation and rounding noise is of relative order ε^(2/3), which is the
 * singular-value cutoff that separates numerical null directions from the
 * row space. ROM projection follows the update.
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
  /** Warm seed placements; borrowed, never mutated. */ seed: Readonly<
    Record<string, P.ITransform>
  >;
}): Record<string, P.ITransform> {
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
        projectPhysicalJointRotation(joint, relative(input.seed, joint)),
        axis,
      ),
  );
  const authored: number[] = coordinates.map(
    ({ joint, axis }: { joint: P.IJoint; axis: P.IAxis }): number =>
      angle(
        projectPhysicalJointRotation(joint, relative(input.authored, joint)),
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
    decomposeAutoMovieSingularMatrix(design, {
      maxEntries: 65536,
      maxSweeps: 64,
      orthogonalityTolerance: 1e-10,
    });
  const largest: number = Math.max(0, ...decomposition.singularValues);
  const cutoff: number =
    largest *
    Math.max(
      decomposition.relativeNullCutoff,
      Number.EPSILON ** (2 / 3) * Math.max(design.length, coordinates.length),
    );

  // Remove every row-space component of the authored difference.
  const update: number[] = [...difference];
  if (largest > 0)
    decomposition.singularValues.forEach(
      (singular: number, column: number): void => {
        if (!(singular > cutoff)) return;
        const basis: number[] = decomposition.rightColumns[column]!;
        const projection: number = basis.reduce(
          (sum: number, component: number, index: number): number =>
            sum + component * difference[index]!,
          0,
        );
        for (let index: number = 0; index < update.length; index++)
          update[index] = update[index]! - basis[index]! * projection;
      },
    );
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

/** Parent-frame to child-frame joint rotation, as the native motor owner reads it. */
function relative(
  poses: Readonly<Record<string, P.ITransform>>,
  joint: P.IJoint,
): P.ITransform["rotation"] {
  return Quaternion.multiply(
    Quaternion.inverse(
      Quaternion.multiply(
        poses[joint.parent]!.rotation,
        joint.parentFrame.rotation,
      ),
    ),
    Quaternion.multiply(
      poses[joint.child]!.rotation,
      joint.childFrame.rotation,
    ),
  );
}

/** Independent twist coordinate of one admitted joint rotation. */
function angle(rotation: P.ITransform["rotation"], axis: P.IAxis): number {
  const sign: number = rotation.w < 0 ? -1 : 1;
  return 2 * Math.atan2(rotation[axis.axis] * sign, Math.abs(rotation.w));
}
