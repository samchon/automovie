import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieRigidTransform,
  IAutoMovieSolvePhysicalChainTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { seedPhysicalChainTarget } from "./seedPhysicalChainTarget";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";

/**
 * Bounded damped least squares on the admitted profile's actual joint frames,
 * its damping adapted to the chain's smallest singular value (Nakamura and
 * Hanafusa 1986; Buss 2004).
 * This changes motor targets, never solved bodies. Each angular update stays
 * inside its source-derived box limit and rotates the complete child subtree.
 * The returned residual explicitly retains an unreachable endpoint goal.
 * Unchanged branches are borrowed; every written pose shell is detached first.
 */
export function solvePhysicalChainTarget(
  input: IAutoMovieSolvePhysicalChainTarget.IInput,
): IAutoMovieSolvePhysicalChainTarget.IResult {
  if (
    !Number.isSafeInteger(input.iterations) ||
    input.iterations < 1 ||
    input.iterations > 64 ||
    !(input.tolerance > 0) ||
    !Number.isFinite(input.tolerance) ||
    input.chain.length < 2 ||
    ![input.goal.x, input.goal.y, input.goal.z].every(Number.isFinite)
  )
    throw new Error("Invalid physical chain target or work budget");
  const targets: Record<string, IAutoMovieRigidTransform> = {
    ...input.targets,
  };
  const owned: Set<string> = new Set();
  const parents: Map<string, IAutoMoviePhysicalJoint> = new Map();
  const children: Map<string, string[]> = new Map();
  for (const joint of input.profile.joints) {
    parents.set(joint.child, joint);
    const list: string[] = children.get(joint.parent) ?? [];
    list.push(joint.child);
    children.set(joint.parent, list);
  }
  const endpoint: string = input.chain.at(-1)!;
  const joints: IAutoMoviePhysicalJoint[] = input.chain
    .map((bone: string): IAutoMoviePhysicalJoint | undefined =>
      parents.get(bone),
    )
    .filter(
      (
        joint: IAutoMoviePhysicalJoint | undefined,
      ): joint is IAutoMoviePhysicalJoint => joint !== undefined,
    )
    .reverse();
  const descendants: Map<string, string[]> = new Map(
    joints.map((joint: (typeof joints)[number]): [string, string[]] => {
      const bones: Set<string> = new Set();
      const pending: string[] = [joint.child];
      while (pending.length) {
        const bone: string = pending.pop()!;
        if (bones.has(bone)) continue;
        bones.add(bone);
        pending.push(...(children.get(bone) ?? []));
      }
      return [joint.id, [...bones]];
    }),
  );
  const gap: () => number = (): number =>
    Vector3.length(
      Vector3.subtract(
        physicalSupportPoint(targets[endpoint]!, input.localPoint),
        input.goal,
      ),
    );
  // A goal already within tolerance is met: the straight-chain seed is not
  // run for it. Near a straight chain the exact two-bone answer to a gap d
  // is a bend of sqrt(2 d / length), so seeding a sub-tolerance gap would
  // turn rounding-sized residuals into a large joint step.
  let residual: number = gap();
  if (residual > input.tolerance) {
    seedPhysicalChainTarget({ ...input, targets, rotate });
    residual = gap();
  }
  for (
    let iteration: number = 0;
    iteration < input.iterations && residual > input.tolerance;
    iteration++
  ) {
    // One damped least-squares step over every free coordinate of the chain
    // (Buss 2004, "Introduction to Inverse Kinematics with Jacobian Transpose,
    // Pseudoinverse and Damped Least Squares methods", Section 5): each
    // column is the axis's world direction crossed with the endpoint's lever
    // from its pivot, and dtheta = J^T (J J^T + lambda^2 I)^-1 r. The damping
    // follows the smallest singular value sigma (Nakamura and Hanafusa 1986,
    // "Inverse kinematic solutions with singularity robustness for robot
    // manipulator control", eq. 26): zero while sigma >= epsilon, else
    // lambda_max^2 (1 - (sigma / epsilon)^2), so a straightening chain whose
    // stretch row vanishes still steps along it instead of stalling.
    const tip: IAutoMovieVector3 = physicalSupportPoint(
      targets[endpoint]!,
      input.localPoint,
    );
    const error: IAutoMovieVector3 = Vector3.subtract(input.goal, tip);
    const columns: {
      joint: IAutoMoviePhysicalJoint;
      axis: IAutoMoviePhysicalJointAxis;
      column: IAutoMovieVector3;
    }[] = [];
    let scale: number = 0;
    for (const joint of joints) {
      const parent: IAutoMovieRigidTransform = targets[joint.parent]!;
      const frame: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
        parent.rotation,
        joint.parentFrame.rotation,
      );
      const pivot: IAutoMovieVector3 = Vector3.add(
        parent.position,
        Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
      );
      const lever: IAutoMovieVector3 = Vector3.subtract(tip, pivot);
      scale = Math.max(scale, Vector3.length(lever));
      for (const axis of joint.axes) {
        if (!(axis.maximum > axis.minimum)) continue;
        const direction: IAutoMovieVector3 = Quaternion.rotateVector(frame, {
          x: axis.axis === "x" ? 1 : 0,
          y: axis.axis === "y" ? 1 : 0,
          z: axis.axis === "z" ? 1 : 0,
        });
        columns.push({ joint, axis, column: Vector3.cross(direction, lever) });
      }
    }
    if (columns.length === 0 || !(scale > 0)) break;
    const m: number[][] = [0, 1, 2].map((i: number): number[] =>
      [0, 1, 2].map((j: number): number =>
        columns.reduce(
          (sum: number, entry): number =>
            sum + component(entry.column, i) * component(entry.column, j),
          0,
        ),
      ),
    );
    const sigma: number = Math.sqrt(Math.max(0, smallestEigenvalue(m)));
    const epsilon: number = DAMPING_THRESHOLD * scale;
    const lambda: number =
      sigma >= epsilon
        ? 0
        : DAMPING_MAXIMUM * scale * Math.sqrt(1 - (sigma / epsilon) ** 2);
    for (let i: number = 0; i < 3; i++) {
      const row: number[] = m[i]!;
      row[i] = row[i]! + lambda * lambda;
    }
    const y: IAutoMovieVector3 | undefined = solve3(m, error);
    if (!y) break;
    const steps: number[] = columns.map(
      (entry): number => Vector3.dot(entry.column, y),
    );
    const largest: number = Math.max(...steps.map(Math.abs));
    const shrink: number = largest > MAXIMUM_STEP ? MAXIMUM_STEP / largest : 1;
    columns.forEach((entry, i: number): void =>
      rotate(entry.joint, entry.axis, steps[i]! * shrink),
    );
    residual = gap();
  }
  return { targets, residual };

  /** Apply one admitted angular update to exactly the joint's descendants. */
  function rotate(
    joint: IAutoMoviePhysicalJoint,
    axis: IAutoMoviePhysicalJointAxis,
    request: number,
  ): void {
    const parent: IAutoMovieRigidTransform = targets[joint.parent]!;
    const child: IAutoMovieRigidTransform = targets[joint.child]!;
    const frame: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
      parent.rotation,
      joint.parentFrame.rotation,
    );
    const relative: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
      Quaternion.inverse(frame),
      Quaternion.multiply(child.rotation, joint.childFrame.rotation),
    );
    // A rotation about one free axis can create a locked quaternion coordinate
    // or move another free coordinate outside its box. Admit all of them.
    const localAxis: IAutoMovieVector3 = {
      x: axis.axis === "x" ? 1 : 0,
      y: axis.axis === "y" ? 1 : 0,
      z: axis.axis === "z" ? 1 : 0,
    };
    const candidate: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
      Quaternion.fromAxisAngle(localAxis, (request * 180) / Math.PI),
      relative,
    );
    const admitted: IAutoMovieRigidTransform["rotation"] =
      projectPhysicalJointRotation(joint, candidate);
    for (const bone of descendants.get(joint.id)!)
      if (!owned.has(bone)) {
        targets[bone] = { ...targets[bone]! };
        owned.add(bone);
      }
    setPhysicalTargetJointRotation(
      targets,
      joint,
      descendants.get(joint.id)!,
      admitted,
    );
  }
}

/**
 * The singular value below which the step is damped, over the chain's longest
 * lever (Nakamura and Hanafusa 1986's epsilon, set relative to the chain).
 */
const DAMPING_THRESHOLD: number = 0.05;

/** The damping at a singular chain, over its longest lever (their lambda_0). */
const DAMPING_MAXIMUM: number = 0.05;

/**
 * The largest joint step per iteration, radians: Buss 2004's clamp on a damped
 * step far from the goal, Section 5.
 */
const MAXIMUM_STEP: number = 0.5;

/** A vector's component by index. */
function component(v: IAutoMovieVector3, i: number): number {
  return i === 0 ? v.x : i === 1 ? v.y : v.z;
}

/**
 * The smallest eigenvalue of a symmetric 3 x 3 matrix in closed form (Smith
 * 1961, "Eigenvalues of a symmetric 3 x 3 matrix", Communications of the ACM
 * 4(4) p.168).
 */
function smallestEigenvalue(m: readonly (readonly number[])[]): number {
  const a = (i: number, j: number): number => m[i]![j]!;
  const p1: number = a(0, 1) ** 2 + a(0, 2) ** 2 + a(1, 2) ** 2;
  const q: number = (a(0, 0) + a(1, 1) + a(2, 2)) / 3;
  const p2: number =
    (a(0, 0) - q) ** 2 + (a(1, 1) - q) ** 2 + (a(2, 2) - q) ** 2 + 2 * p1;
  if (!(p2 > 0)) return q;
  const p: number = Math.sqrt(p2 / 6);
  const b = (i: number, j: number): number =>
    (a(i, j) - (i === j ? q : 0)) / p;
  const det: number =
    b(0, 0) * (b(1, 1) * b(2, 2) - b(1, 2) * b(2, 1)) -
    b(0, 1) * (b(1, 0) * b(2, 2) - b(1, 2) * b(2, 0)) +
    b(0, 2) * (b(1, 0) * b(2, 1) - b(1, 1) * b(2, 0));
  const phi: number = Math.acos(Math.min(1, Math.max(-1, det / 2))) / 3;
  return q + 2 * p * Math.cos(phi + (2 * Math.PI) / 3);
}

/** The solution of a 3 x 3 system by Cramer's rule; none when singular. */
function solve3(
  m: readonly (readonly number[])[],
  r: IAutoMovieVector3,
): IAutoMovieVector3 | undefined {
  const det3 = (c: readonly (readonly number[])[]): number =>
    c[0]![0]! * (c[1]![1]! * c[2]![2]! - c[1]![2]! * c[2]![1]!) -
    c[0]![1]! * (c[1]![0]! * c[2]![2]! - c[1]![2]! * c[2]![0]!) +
    c[0]![2]! * (c[1]![0]! * c[2]![1]! - c[1]![1]! * c[2]![0]!);
  const d: number = det3(m);
  if (!(Math.abs(d) > 0) || !Number.isFinite(d)) return undefined;
  const v: number[] = [r.x, r.y, r.z];
  const replaced = (k: number): number[][] =>
    m.map((row: readonly number[], i: number): number[] =>
      row.map((value: number, j: number): number => (j === k ? v[i]! : value)),
    );
  return {
    x: det3(replaced(0)) / d,
    y: det3(replaced(1)) / d,
    z: det3(replaced(2)) / d,
  };
}
