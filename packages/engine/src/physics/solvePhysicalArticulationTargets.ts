import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";
import { solvePhysicalTargetStep } from "./solvePhysicalTargetStep";

/**
 * One bounded articulation solver shared by geometric targets. Native coordinates preserve ROM and anchors; SVD active-set steps and backtracking accept only actual residual decreases. Deterministic metre residuals contain no actor or anatomy policy.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (One bounded articulation solver shared by geometric targets) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (One bounded articulation solver shared by geometric targets) directly over its typed inputs (`input`) as nested iteration of depth 3 (some over input.bones; some over input.profile.segments; every over result), delegating to `Number.isSafeInteger`, `Number.isFinite`, `input.measure`, `result.every`, `selected.has`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (5 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 64, 1024, 0.0001, 0.001, 0.25, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 256 lines and 19 top-level statements that reuses `Number.isSafeInteger`, `Number.isFinite`, `input.measure`, `result.every`, `selected.has` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 18 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (some over input.bones; some over input.profile.segments; every over result), performed once per call with 29 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 29 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function solvePhysicalArticulationTargets(input: {
  /** Admitted fixed-pivot tree. */ profile: P;
  /** Actuated child bones, including branches solved together. */ bones: readonly string[];
  /** Borrowed admitted world motor goals. */ targets: Readonly<
    Record<string, P.ITransform>
  >;
  /** Fixed-size finite geometric residual vector, at most 1024 entries. */ measure: (
    poses: Readonly<Record<string, P.ITransform>>,
  ) => number[];
  /** Optional witness model refreshed at each accepted configuration, used only for Jacobian probes. Nonlinear acceptance always uses measure. */ linearize?: (
    poses: Readonly<Record<string, P.ITransform>>,
  ) => (
    probe: Readonly<Record<string, P.ITransform>>,
    moved?: ReadonlySet<string>,
  ) => number[];
  /** Positive update budget, at most 64. */ iterations: number;
  /** Positive metre residual early-out. */ tolerance: number;
}): { targets: Record<string, P.ITransform>; residual: number } {
  if (
    !Number.isSafeInteger(input.iterations) ||
    input.iterations < 1 ||
    input.iterations > 64 ||
    !(input.tolerance > 0) ||
    !Number.isFinite(input.tolerance) ||
    !input.bones.length ||
    input.bones.some(
      (bone: string): boolean =>
        !input.profile.segments.some(
          (segment: P.ISegment): boolean => segment.bone === bone,
        ),
    )
  )
    throw new Error("Invalid articulated target solve");
  const selected: Set<string> = new Set(input.bones);
  let rows: number | undefined;
  /** Residual dimensions and finiteness remain invariant during every probe. */
  const measure: (poses: Readonly<Record<string, P.ITransform>>) => number[] = (
    poses: Readonly<Record<string, P.ITransform>>,
  ): number[] => {
    const result: number[] = input.measure(poses);
    if (
      !result.length ||
      result.length > 1024 ||
      (rows !== undefined && rows !== result.length) ||
      !result.every(Number.isFinite)
    )
      throw new Error("Invalid articulated target residual budget");
    rows = result.length;
    return result;
  };
  const joints: P.IJoint[] = input.profile.joints.filter(
    (joint: P.IJoint): boolean => selected.has(joint.child),
  );
  const coordinates: { joint: P.IJoint; axis: P.IAxis }[] = joints.flatMap(
    (joint: P.IJoint): { joint: P.IJoint; axis: P.IAxis }[] =>
      joint.axes
        .filter((axis: P.IAxis): boolean => axis.maximum > axis.minimum)
        .map((axis: P.IAxis): { joint: P.IJoint; axis: P.IAxis } => ({
          joint,
          axis,
        })),
  );
  if (coordinates.length > 64)
    throw new Error("Articulated target coordinate budget exceeded");
  const children: Map<string, string[]> = new Map();
  for (const joint of input.profile.joints) {
    const branch: string[] = children.get(joint.parent) ?? [];
    branch.push(joint.child);
    children.set(joint.parent, branch);
  }
  const subtrees: Map<string, string[]> = new Map();
  const descendants: Map<string, string[]> = new Map(
    joints.map((joint: P.IJoint): [string, string[]] => [
      joint.id,
      subtree(joint.child),
    ]),
  );
  const movedByJoint: Map<P.IJoint, ReadonlySet<string>> = new Map(
    joints.map((joint: P.IJoint): [P.IJoint, ReadonlySet<string>] => [
      joint,
      new Set(descendants.get(joint.id)!),
    ]),
  );
  let values: number[] = coordinates.map(
    ({ joint, axis }: { joint: P.IJoint; axis: P.IAxis }): number => {
      const relative: P.ITransform["rotation"] = Quaternion.multiply(
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
  let targets: Record<string, P.ITransform> = build(values);
  let errors: number[] = measure(targets);
  for (
    let iteration: number = 0;
    iteration < input.iterations &&
    Math.hypot(...errors) > input.tolerance &&
    coordinates.length;
    iteration++
  ) {
    const model: (
      poses: Readonly<Record<string, P.ITransform>>,
      moved?: ReadonlySet<string>,
    ) => number[] = input.linearize?.(targets) ?? measure;
    const baseline: number[] = model(targets);
    if (baseline.length !== errors.length || !baseline.every(Number.isFinite))
      throw new Error("Invalid articulated target linearization");
    const columns: number[][] = coordinates.map(
      (
        { joint, axis }: { joint: P.IJoint; axis: P.IAxis },
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
          { axis }: { joint: P.IJoint; axis: P.IAxis },
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
      const poses: Record<string, P.ITransform> = build(
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
  return { targets, residual: Math.hypot(...errors) };

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
    base?: Readonly<Record<string, P.ITransform>>,
    previous?: readonly number[],
  ): Record<string, P.ITransform> {
    const changed: Set<P.IJoint> = new Set(
      coordinates.flatMap(
        (
          coordinate: (typeof coordinates)[number],
          index: number,
        ): P.IJoint[] =>
          previous === undefined || parameters[index] !== previous[index]
            ? [coordinate.joint]
            : [],
      ),
    );
    const poses: Record<string, P.ITransform> = base
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
      const relative: P.ITransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 };
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
