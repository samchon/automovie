import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";
import { solvePhysicalTargetStep } from "./solvePhysicalTargetStep";

/** One bounded articulation solver shared by geometric targets. Native coordinates preserve ROM and anchors; SVD active-set steps and backtracking accept only actual residual decreases. Deterministic metre residuals contain no actor or anatomy policy. */
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
  ) => (probe: Readonly<Record<string, P.ITransform>>) => number[];
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
  const descendants: Map<string, string[]> = new Map(
    joints.map((joint: P.IJoint): [string, string[]] => {
      const bones: Set<string> = new Set([joint.child]);
      for (let pass: number = 0; pass < input.profile.segments.length; pass++)
        for (const candidate of input.profile.joints)
          if (bones.has(candidate.parent)) bones.add(candidate.child);
      return [joint.id, [...bones]];
    }),
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
    const model: (poses: Readonly<Record<string, P.ITransform>>) => number[] =
      input.linearize?.(targets) ?? measure;
    const baseline: number[] = model(targets);
    if (baseline.length !== errors.length || !baseline.every(Number.isFinite))
      throw new Error("Invalid articulated target linearization");
    const columns: number[][] = coordinates.map(
      (
        { axis }: { joint: P.IJoint; axis: P.IAxis },
        index: number,
      ): number[] => {
        const step: number =
          values[index]! + 1e-4 <= axis.maximum
            ? Math.min(1e-4, axis.maximum - values[index]!)
            : -Math.min(1e-4, values[index]! - axis.minimum);
        if (step === 0) return errors.map((): number => 0);
        const probe: number[] = [...values];
        probe[index] = probe[index]! + step;
        const residual: number[] = model(build(probe));
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
      const poses: Record<string, P.ITransform> = build(candidate);
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

  /** Reconstruct each candidate through shared anchor-preserving subtree motion. */
  function build(parameters: readonly number[]): Record<string, P.ITransform> {
    const poses: Record<string, P.ITransform> = structuredClone(input.targets);
    for (const joint of joints) {
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
