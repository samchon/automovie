import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMovieSolvePhysicalArticulationTargets,
  IAutoMovieSolvePhysicalTargetStep,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { PHYSICAL_TARGET_LIMITS } from "./PHYSICAL_TARGET_LIMITS";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";
import { solvePhysicalTargetStep } from "./solvePhysicalTargetStep";

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
 */
export function solvePhysicalTargetForest(
  input: IPhysicalTargetForestInput,
): IPhysicalTargetForestResult {
  if (
    input.iterations < 1 ||
    input.iterations > 64 ||
    input.tolerance <= 0 ||
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
      (rows !== undefined && rows !== result.length)
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
    if (baseline.length !== errors.length)
      throw new Error("Invalid articulated target linearization");
    // One-sided columns: a row that is the least of several linear pieces
    // (a contact patch) has a different slope each way. The one-sided step
    // solves with each coordinate's slope on the side it moves to, re-solving
    // while a coordinate changes side, so its model is exact to first order
    // in the orthant the step lands in (the orthant-wise linearization of
    // Andrew and Gao 2007).
    const probe = (index: number, direction: number): number[] => {
      const { joint, axis }: (typeof coordinates)[number] = coordinates[index]!;
      const room: number =
        direction > 0
          ? axis.maximum - values[index]!
          : values[index]! - axis.minimum;
      const step: number =
        room >= 1e-4
          ? direction * Math.min(1e-4, room)
          : -direction *
            Math.min(
              1e-4,
              direction > 0
                ? values[index]! - axis.minimum
                : axis.maximum - values[index]!,
            );
      if (step === 0) return errors.map((): number => 0);
      const shifted: number[] = [...values];
      shifted[index] = shifted[index]! + step;
      const residual: number[] = model(
        build(shifted, targets, values),
        movedByJoint.get(joint),
      );
      if (residual.length !== errors.length)
        throw new Error("Invalid articulated target linearization");
      return residual.map(
        (value: number, row: number): number => (value - baseline[row]!) / step,
      );
    };
    const forward: number[][] = coordinates.map(
      (_: (typeof coordinates)[number], index: number): number[] =>
        probe(index, 1),
    );
    const backward: (number[] | undefined)[] = coordinates.map(
      (): undefined => undefined,
    );
    const bounds: IAutoMovieSolvePhysicalTargetStep.IInput["coordinates"] =
      coordinates.map(
        (
          { axis }: (typeof coordinates)[number],
          index: number,
        ): IAutoMovieSolvePhysicalTargetStep.IInput["coordinates"][number] => ({
          value: values[index]!,
          minimum: axis.minimum,
          maximum: axis.maximum,
        }),
      );
    const solve = (columns: number[][]): number[] =>
      solvePhysicalTargetStep({
        columns,
        errors,
        coordinates: bounds,
        damping: 0.001,
      });
    // The ordinary step reads every slope forward; when no backtrack of it
    // lowers the measured residual, the one-sided step is tried.
    const plain: number[] = solve(forward);
    const oneSided = (): number[] => {
      const sides: number[] = coordinates.map((): number => 1);
      let delta: number[] = plain;
      for (let round: number = 0; round < coordinates.length; round++) {
        let changed: boolean = false;
        for (let index: number = 0; index < coordinates.length; index++) {
          const side: number = delta[index]! < 0 ? -1 : 1;
          if (side === sides[index]) continue;
          sides[index] = side;
          if (side < 0) backward[index] ??= probe(index, -1);
          changed = true;
        }
        if (!changed) break;
        delta = solve(
          coordinates.map(
            (_: (typeof coordinates)[number], index: number): number[] =>
              sides[index]! < 0 ? backward[index]! : forward[index]!,
          ),
        );
      }
      // A coordinate still on the other side than its slope is held, so the
      // step stays inside the orthant its model describes.
      return delta.map((value: number, index: number): number =>
        (value < 0 ? -1 : 1) === sides[index] ? value : 0,
      );
    };
    let accepted: boolean = false;
    const before: number = Math.hypot(...errors);
    for (const direction of [(): number[] => plain, oneSided]) {
      const delta: number[] = direction();
      const scale: number = Math.min(
        1,
        0.25 / Math.max(1e-30, Math.hypot(...delta)),
      );
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
      if (accepted) break;
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

  /**
   * Admit the seed once, then own only branches changed from the accepted pose.
   * The shared setter replaces vectors on mutable pose shells, so unchanged
   * accepted branches remain borrowed and untouched.
   */
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
      : Object.fromEntries(
          Object.entries(input.targets).map(
            ([bone, pose]: [string, IAutoMovieRigidTransform]): [
              string,
              IAutoMovieRigidTransform,
            ] => [
              bone,
              { position: { ...pose.position }, rotation: { ...pose.rotation } },
            ],
          ),
        );
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
