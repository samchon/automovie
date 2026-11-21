import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMovieSolvePhysicalArticulationTargets,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";
import { solvePhysicalTargetStep } from "./solvePhysicalTargetStep";

/**
 * Shared coordinate and residual caps for one bounded numerical fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Caps one combined target system at 64 free coordinates and 1024 finite scalar rows.
 */
export const PHYSICAL_TARGET_LIMITS = { coordinates: 64, rows: 1024 } as const;

/** Admitted articulation trees with unique names in the same candidate pose map. */
type IPhysicalTargetForestInput = Omit<
  IAutoMovieSolvePhysicalArticulationTargets.IInput,
  "profile"
> & {
  readonly segments: readonly Pick<IAutoMoviePhysicalSegment, "bone">[];
  readonly joints: readonly IAutoMoviePhysicalJoint[];
};

/** The best finite candidate and its number of attempted bounded updates. */
type IPhysicalTargetForestResult =
  IAutoMovieSolvePhysicalArticulationTargets.IResult & {
    readonly iterations: number;
  };

/**
 * Fit metre residuals across one or more fixed-root articulation trees. The
 * caller supplies admitted topology and globally unique joint and bone names.
 * Coordinates are bounded joint radians. The projected poses keep each pivot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the admitted forest, residual units, fixed roots and joint coordinates.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the existing bounded target step and projected rotations. It accepts a backtrack only when the measured norm falls and reports attempted updates.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The same joint loop and row machinery serve a single tree and a forest through their borrowed joints, bones and poses.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Admits finite fixed-size residuals, caps rows and free coordinates, and keeps the best measured candidate when a step stalls.
 * @evidence contracts/development/implementation.md#efficient-algorithms Compiles branches once, probes their moved dependencies and bounds the update and backtracking loops.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Candidate construction copies changing subtrees and borrows the other branches from the last accepted pose.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Row, coordinate and iteration caps bound work per call. Candidate scratch is local.
 */
export function solvePhysicalTargetForest(
  input: IPhysicalTargetForestInput,
): IPhysicalTargetForestResult {
  if (
    !Number.isSafeInteger(input.iterations) ||
    input.iterations < 1 ||
    input.iterations > 64 ||
    !(input.tolerance > 0) ||
    !Number.isFinite(input.tolerance) ||
    !input.bones.length ||
    input.bones.some(
      (bone: string): boolean =>
        !input.segments.some(
          (segment: Pick<IAutoMoviePhysicalSegment, "bone">): boolean =>
            segment.bone === bone,
        ),
    )
  )
    throw new Error("Invalid articulated target solve");
  const selected: Set<string> = new Set(input.bones);
  let rows: number | undefined;
  /** Residual dimensions and finiteness remain invariant during every probe. */
  const measure: (
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ) => number[] = (
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): number[] => {
    const result: number[] = input.measure(poses);
    if (
      !result.length ||
      result.length > PHYSICAL_TARGET_LIMITS.rows ||
      (rows !== undefined && rows !== result.length) ||
      !result.every(Number.isFinite)
    )
      throw new Error("Invalid articulated target residual budget");
    rows = result.length;
    return result;
  };
  const joints: IAutoMoviePhysicalJoint[] = input.joints.filter(
    (joint: IAutoMoviePhysicalJoint): boolean => selected.has(joint.child),
  );
  const coordinates: {
    joint: IAutoMoviePhysicalJoint;
    axis: IAutoMoviePhysicalJointAxis;
  }[] = joints.flatMap(
    (
      joint: IAutoMoviePhysicalJoint,
    ): {
      joint: IAutoMoviePhysicalJoint;
      axis: IAutoMoviePhysicalJointAxis;
    }[] =>
      joint.axes
        .filter(
          (axis: IAutoMoviePhysicalJointAxis): boolean =>
            axis.maximum > axis.minimum,
        )
        .map(
          (
            axis: IAutoMoviePhysicalJointAxis,
          ): {
            joint: IAutoMoviePhysicalJoint;
            axis: IAutoMoviePhysicalJointAxis;
          } => ({
            joint,
            axis,
          }),
        ),
  );
  if (coordinates.length > PHYSICAL_TARGET_LIMITS.coordinates)
    throw new Error("Articulated target coordinate budget exceeded");
  const children: Map<string, string[]> = new Map();
  for (const joint of input.joints) {
    const branch: string[] = children.get(joint.parent) ?? [];
    branch.push(joint.child);
    children.set(joint.parent, branch);
  }
  const subtrees: Map<string, string[]> = new Map();
  const descendants: Map<string, string[]> = new Map(
    joints.map((joint: IAutoMoviePhysicalJoint): [string, string[]] => [
      joint.id,
      subtree(joint.child),
    ]),
  );
  const movedByJoint: Map<
    IAutoMoviePhysicalJoint,
    ReadonlySet<string>
  > = new Map(
    joints.map(
      (
        joint: IAutoMoviePhysicalJoint,
      ): [IAutoMoviePhysicalJoint, ReadonlySet<string>] => [
        joint,
        new Set(descendants.get(joint.id)!),
      ],
    ),
  );
  let values: number[] = coordinates.map(
    ({
      joint,
      axis,
    }: {
      joint: IAutoMoviePhysicalJoint;
      axis: IAutoMoviePhysicalJointAxis;
    }): number => {
      const relative: IAutoMovieRigidTransform["rotation"] =
        Quaternion.multiply(
          Quaternion.inverse(
            Quaternion.multiply(
              input.targets[joint.parent]!.rotation,
              joint.parentFrame.rotation,
            ),
          ),
          Quaternion.multiply(
            input.targets[joint.child]!.rotation,
            joint.childFrame.rotation,
          ),
        );
      const angle: number =
        2 *
        Math.atan2(
          relative[axis.axis] * (relative.w < 0 ? -1 : 1),
          Math.abs(relative.w),
        );
      return Math.max(axis.minimum, Math.min(axis.maximum, angle));
    },
  );
  let targets: Record<string, IAutoMovieRigidTransform> = build(values);
  let errors: number[] = measure(targets);
  let iterations: number = 0;
  while (
    iterations < input.iterations &&
    Math.hypot(...errors) > input.tolerance &&
    coordinates.length
  ) {
    iterations++;
    const model: (
      poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
      moved?: ReadonlySet<string>,
    ) => number[] = input.linearize?.(targets) ?? measure;
    const baseline: number[] = model(targets);
    if (baseline.length !== errors.length || !baseline.every(Number.isFinite))
      throw new Error("Invalid articulated target linearization");
    const columns: number[][] = coordinates.map(
      (
        {
          joint,
          axis,
        }: {
          joint: IAutoMoviePhysicalJoint;
          axis: IAutoMoviePhysicalJointAxis;
        },
        index: number,
      ): number[] => {
        const step: number =
          values[index]! + 1e-4 <= axis.maximum
            ? Math.min(1e-4, axis.maximum - values[index]!)
            : -Math.min(1e-4, values[index]! - axis.minimum);
        if (step === 0) return errors.map((): number => 0);
        const probe: number[] = [...values];
        probe[index] = probe[index]! + step;
        const residual: number[] = model(
          build(probe, targets, values),
          movedByJoint.get(joint),
        );
        if (
          residual.length !== errors.length ||
          !residual.every(Number.isFinite)
        )
          throw new Error("Invalid articulated target linearization");
        return residual.map(
          (value: number, row: number): number =>
            (value - baseline[row]!) / step,
        );
      },
    );
    const delta: number[] = solvePhysicalTargetStep({
      columns,
      errors,
      coordinates: coordinates.map(
        (
          {
            axis,
          }: {
            joint: IAutoMoviePhysicalJoint;
            axis: IAutoMoviePhysicalJointAxis;
          },
          index: number,
        ): { value: number; minimum: number; maximum: number } => ({
          value: values[index]!,
          minimum: axis.minimum,
          maximum: axis.maximum,
        }),
      ),
      damping: 0.001,
    });
    const scale: number = Math.min(
      1,
      0.25 / Math.max(1e-30, Math.hypot(...delta)),
    );
    let accepted: boolean = false;
    const before: number = Math.hypot(...errors);
    for (let backtrack: number = 0; backtrack < 8; backtrack++) {
      const candidate: number[] = values.map(
        (value: number, index: number): number =>
          Math.max(
            coordinates[index]!.axis.minimum,
            Math.min(
              coordinates[index]!.axis.maximum,
              value + delta[index]! * scale * 2 ** -backtrack,
            ),
          ),
      );
      const poses: Record<string, IAutoMovieRigidTransform> = build(
        candidate,
        targets,
        values,
      );
      const residual: number[] = measure(poses);
      if (Math.hypot(...residual) >= before) continue;
      values = candidate;
      targets = poses;
      errors = residual;
      accepted = true;
      break;
    }
    if (
      !accepted ||
      before - Math.hypot(...errors) <=
        64 * Number.EPSILON * Math.max(1, before)
    )
      break;
  }
  return { targets, residual: Math.hypot(...errors), iterations };

  /** Compile each actual tree branch once for this admitted profile invocation. */
  function subtree(bone: string): string[] {
    const previous: string[] | undefined = subtrees.get(bone);
    if (previous) return previous;
    const result: string[] = [
      bone,
      ...(children.get(bone) ?? []).flatMap((child: string): string[] =>
        subtree(child),
      ),
    ];
    subtrees.set(bone, result);
    return result;
  }

  /** Admit the seed once, then own only branches changed from the accepted pose. The shared setter replaces vectors on mutable pose shells, so unchanged accepted branches remain borrowed and untouched. */
  function build(
    parameters: readonly number[],
    base?: Readonly<Record<string, IAutoMovieRigidTransform>>,
    previous?: readonly number[],
  ): Record<string, IAutoMovieRigidTransform> {
    const changed: Set<IAutoMoviePhysicalJoint> = new Set(
      coordinates.flatMap(
        (
          coordinate: (typeof coordinates)[number],
          index: number,
        ): IAutoMoviePhysicalJoint[] =>
          previous === undefined || parameters[index] !== previous[index]
            ? [coordinate.joint]
            : [],
      ),
    );
    const poses: Record<string, IAutoMovieRigidTransform> = base
      ? { ...base }
      : structuredClone(input.targets);
    if (base) {
      const owned: Set<string> = new Set();
      for (const joint of changed)
        for (const bone of descendants.get(joint.id)!)
          if (!owned.has(bone)) {
            poses[bone] = { ...base[bone]! };
            owned.add(bone);
          }
    }
    for (const joint of joints) {
      if (base && !changed.has(joint)) continue;
      const relative: IAutoMovieRigidTransform["rotation"] = {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      };
      for (let index: number = 0; index < coordinates.length; index++)
        if (coordinates[index]!.joint === joint)
          relative[coordinates[index]!.axis.axis] = Math.tan(
            Math.max(
              -Math.PI + 1e-12,
              Math.min(Math.PI - 1e-12, parameters[index]!),
            ) / 2,
          );
      const norm: number = Math.hypot(relative.x, relative.y, relative.z, 1);
      setPhysicalTargetJointRotation(
        poses,
        joint,
        descendants.get(joint.id)!,
        projectPhysicalJointRotation(joint, {
          x: relative.x / norm,
          y: relative.y / norm,
          z: relative.z / norm,
          w: 1 / norm,
        }),
      );
    }
    return poses;
  }
}
