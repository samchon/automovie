import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieSolidVector } from "../geometry/construction/AutoMovieSolidVector";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { getConstraint } from "../rom/getConstraint";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import type { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";
import { indexSkeletonTopology } from "./indexSkeletonTopology";
import { resolvePose } from "./resolvePose";

/**
 * Put a point of a digit (its tip or its pad, a frame on its distal phalanx)
 * on a world point, with the digit's own joints alone, inside their range of
 * motion: the inverse kinematics of one finger or the thumb with the hand
 * where the pose has placed it.
 *
 * Every free axis of every joint of the digit (an axis its constraint does
 * not hold immobile) is a variable, in clinical degrees. The fit minimizes
 * the squared distance from the effector to the target, plus, when a target
 * normal is given, the squared misalignment of the effector's normal with it
 * scaled by the effector's distance from its joint, the distal phalanx's
 * length for a tip (an arc length, so a degree of tilt counts as the
 * millimetres it swings the phalanx), plus the interphalangeal
 * coupling of a finger: the distal joint follows the middle one at the ratio
 * `coupling`, a weighted term rather than a hard tie, so a pad can still lay
 * flat on a key (the coupling of hand animation, DIP = 2/3 PIP, Rijpkema and
 * Girard 1991, SIGGRAPH 25(4):339-348, as relayed by the hand-animation
 * literature; provisional until read at the source). The coupling's
 * residual is likewise that distance times the angle by which the distal
 * joint misses the ratio.
 *
 * The method is Levenberg-Marquardt (Madsen, Nielsen and Tingleff 2004,
 * "Methods for non-linear least squares problems", IMM DTU, Algorithm 3.16,
 * with the damping start tau = 1e-3 and Nielsen's update rule given there).
 * The Jacobian is read by central differences on the engine's own forward
 * kinematics, so the angles mean what `resolvePose` displays. Every trial is
 * projected into the range (`clampJointToSkeleton`) before it is measured,
 * as a fit that searches a pose must be measured after the joint limits. A
 * variable that stands on a bound its descent pushes against (the clamp
 * undoes a resolution's move along the negative gradient) is held for the
 * step and the step is solved for the others, the active set of a projected
 * Newton method (Bertsekas 1982, "Projected Newton methods for optimization
 * problems with simple constraints", SIAM J. Control Optim. 20(2):221-246),
 * so a joint at its limit does not stall the joints still free. A
 * step is accepted only when it lowers the measured cost, and the fit stops
 * when the step it would take moves no joint by more than `ROM_TOLERANCE`,
 * the resolution to which the engine resolves a joint's angle; a rejected
 * step doubles the damping growth, which shrinks the next step, so the stop
 * is always reached.
 *
 * The fit descends from two starts, the pose's own angles for the digit and
 * the middle of every range, and keeps the lower cost: a digit folded the
 * wrong way round its target sits in a local minimum the other start lies
 * beyond. The result is deterministic for its input: two fixed starts, a
 * fixed order of variables and no random draw. A
 * target outside the digit's workspace ends at the reachable point nearest
 * it, and `residual` reports the distance left, so a caller refuses or
 * accepts by its own bound.
 *
 * @param input The rig, the posed body, the digit's joints and the effector and target.
 * @returns The digit's fitted joints, the effector's world point and the residual.
 * @throws {Error} When the digit names no joint, or a bone cannot be resolved.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the variables, the cost and its units, the coupling's source and status, the method and its cited constants, the stop rule and its owner, determinism and the out-of-reach behaviour.
 * @evidence contracts/development/implementation.md#principled-implementation Levenberg-Marquardt (Madsen, Nielsen and Tingleff 2004) on the engine's forward kinematics, every trial measured after the range clamp, the bound variables held by a projected Newton active set (Bertsekas 1982), stopping at the engine's joint-angle resolution.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One residual function over the digit's variables, one descent per start with one damped normal-equation step on the free variables solved by `AutoMovieSolidVector.solve`, one acceptance test, the lower of two starts kept.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No iteration count is chosen: the fit ends at the joint-angle resolution, and an unreached target reports its residual instead of being counted as met.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each evaluation is one forward kinematics of the rig, linear in its bones; a Jacobian costs two per variable (at most 9 for a digit of three joints) and the active set's probe one clamp per variable; a step solves one system of the free variables, at most 9; two starts double the work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input; a caller keeps the result by its own plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the returned joints belong to the caller.
 */
export function fitDigitToTarget(
  input: fitDigitToTarget.IInput,
): fitDigitToTarget.IResult {
  if (input.bones.length === 0)
    throw new Error("A digit fit needs the digit's joints");
  const topology: IAutoMovieSkeletonTopology =
    input.topology ?? indexSkeletonTopology(input.skeleton);
  const coupling: number | null = input.coupling ?? null;

  // The digit's free axes, in the order of its joints.
  const variables: IVariable[] = [];
  for (const bone of input.bones) {
    const constraint: IAutoMovieJointConstraint | null = getConstraint(
      bone,
      input.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
        ?.constraint ?? null,
    );
    for (const axis of AXES)
      if (constraint === null || constraint[axis] !== null)
        variables.push({ bone, axis, range: constraint?.[axis] ?? null });
  }
  const clamps: Map<
    AutoMovieHumanoidBone,
    (joint: IAutoMovieJointPose) => IAutoMovieJointPose
  > = new Map(
    input.bones.map(
      (
        bone: AutoMovieHumanoidBone,
      ): [
        AutoMovieHumanoidBone,
        (joint: IAutoMovieJointPose) => IAutoMovieJointPose,
      ] => [bone, clampJointToSkeleton.of(bone, input.skeleton)],
    ),
  );
  const others: IAutoMovieJointPose[] = input.pose.joints.filter(
    (j: IAutoMovieJointPose): boolean => !input.bones.includes(j.bone),
  );

  // The digit's joints for a vector of variables, projected into the range.
  const joints = (x: readonly number[]): IAutoMovieJointPose[] =>
    input.bones.map((bone: AutoMovieHumanoidBone): IAutoMovieJointPose => {
      const joint: IAutoMovieJointPose = {
        bone,
        flexion: null,
        abduction: null,
        twist: null,
      };
      variables.forEach((v: IVariable, i: number): void => {
        if (v.bone === bone) joint[v.axis] = x[i]!;
      });
      return clamps.get(bone)!(joint);
    });
  const read = (list: readonly IAutoMovieJointPose[]): number[] =>
    variables.map((v: IVariable): number => {
      const joint: IAutoMovieJointPose | undefined = list.find(
        (j: IAutoMovieJointPose): boolean => j.bone === v.bone,
      );
      return joint?.[v.axis] ?? 0;
    });

  // The effector's world frame under the digit's joints.
  const place = (
    list: readonly IAutoMovieJointPose[],
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
    const pose: IAutoMoviePose = {
      ...input.pose,
      joints: [...others, ...list],
    };
    const resolved: IAutoMovieResolvedBone | undefined = resolvePose(
      pose,
      input.skeleton,
      input.jointAxes,
      input.restFrames,
      topology,
    ).find(
      (r: IAutoMovieResolvedBone): boolean => r.bone === input.effector.bone,
    );
    if (resolved === undefined)
      throw new Error(`A digit fit cannot resolve ${input.effector.bone}`);
    return {
      point: Vector3.add(
        resolved.worldPosition,
        Quaternion.rotateVector(resolved.worldRotation, input.effector.point),
      ),
      normal: Quaternion.rotateVector(
        resolved.worldRotation,
        input.effector.normal,
      ),
    };
  };

  // The residual vector, metres: position, then the normal's misalignment
  // and the coupling, each as an arc length on the distal phalanx.
  const length: number = Vector3.length(input.effector.point);
  const residual = (x: readonly number[]): number[] => {
    const list: IAutoMovieJointPose[] = joints(x);
    const at = place(list);
    const r: number[] = [
      at.point.x - input.target.x,
      at.point.y - input.target.y,
      at.point.z - input.target.z,
    ];
    if (input.normal !== undefined) {
      const miss: IAutoMovieVector3 = Vector3.cross(
        at.normal,
        Vector3.normalize(input.normal),
      );
      r.push(miss.x * length, miss.y * length, miss.z * length);
    }
    if (coupling !== null && input.bones.length >= 3) {
      const middle: number = list[1]!.flexion ?? 0;
      const distal: number = list[2]!.flexion ?? 0;
      r.push(((distal - coupling * middle) * Math.PI * length) / 180);
    }
    return r;
  };
  const cost = (r: readonly number[]): number =>
    0.5 * r.reduce((sum: number, v: number): number => sum + v * v, 0);

  // Central differences in degrees: the step is the engine's joint
  // resolution, the scale every angle is resolved to.
  const jacobian = (x: readonly number[]): number[][] => {
    const columns: number[][] = variables.map(
      (_v: IVariable, i: number): number[] => {
        const up: number[] = [...x];
        const down: number[] = [...x];
        up[i] = up[i]! + ROM_TOLERANCE;
        down[i] = down[i]! - ROM_TOLERANCE;
        const a: number[] = residual(up);
        const b: number[] = residual(down);
        return a.map(
          (v: number, k: number): number => (v - b[k]!) / (2 * ROM_TOLERANCE),
        );
      },
    );
    return columns[0]!.map((_r: number, k: number): number[] =>
      columns.map((c: number[]): number => c[k]!),
    );
  };

  const n: number = variables.length;
  const normal = (
    jac: readonly (readonly number[])[],
    res: readonly number[],
  ): { A: number[][]; g: number[] } => ({
    A: Array.from({ length: n }, (_a: unknown, i: number): number[] =>
      Array.from({ length: n }, (_b: unknown, j: number): number =>
        jac.reduce(
          (sum: number, row: readonly number[]): number =>
            sum + row[i]! * row[j]!,
          0,
        ),
      ),
    ),
    g: Array.from({ length: n }, (_a: unknown, i: number): number =>
      jac.reduce(
        (sum: number, row: readonly number[], k: number): number =>
          sum + row[i]! * res[k]!,
        0,
      ),
    ),
  });

  // The variables the range holds: a variable whose descent direction the
  // clamp undoes stands on a bound it is pushed against, so the step leaves
  // it where it is and solves for the others (the active set of a projected
  // Newton method, Bertsekas 1982).
  const held = (x: readonly number[], g: readonly number[]): boolean[] =>
    x.map((v: number, i: number): boolean => {
      if (g[i] === 0) return false;
      const probe: number[] = [...x];
      probe[i] = v - Math.sign(g[i]!) * ROM_TOLERANCE;
      return Math.abs(read(joints(probe))[i]! - v) < ROM_TOLERANCE / 2;
    });

  // One descent from a start, to the joint-angle resolution.
  const descend = (start: readonly number[]): number[] => {
    let x: number[] = read(joints(start));
    let r: number[] = residual(x);
    let { A, g } = normal(jacobian(x), r);
    let mu: number =
      TAU * Math.max(...A.map((row: number[], i: number): number => row[i]!));
    let nu: number = 2;
    for (;;) {
      const fixed: boolean[] = held(x, g);
      const free: number[] = x
        .map((_v: number, i: number): number => i)
        .filter((i: number): boolean => !fixed[i]);
      if (free.length === 0) break;
      const solved: number[] | null = AutoMovieSolidVector.solve(
        free.map((i: number): number[] =>
          free.map((j: number): number => A[i]![j]! + (i === j ? mu : 0)),
        ),
        free.map((i: number): number => -g[i]!),
      );
      if (solved === null) break;
      const h: number[] = x.map((): number => 0);
      free.forEach((i: number, k: number): void => {
        h[i] = solved[k]!;
      });
      if (Math.max(...h.map((v: number): number => Math.abs(v))) <= ROM_TOLERANCE)
        break;
      const trial: number[] = read(
        joints(x.map((v: number, i: number): number => v + h[i]!)),
      );
      const tr: number[] = residual(trial);
      const predicted: number =
        0.5 *
        h.reduce(
          (sum: number, v: number, i: number): number =>
            sum + v * (mu * v - g[i]!),
          0,
        );
      const rho: number =
        predicted > 0 ? (cost(r) - cost(tr)) / predicted : -Infinity;
      if (rho > 0) {
        x = trial;
        r = tr;
        ({ A, g } = normal(jacobian(x), r));
        mu *= Math.max(1 / 3, 1 - (2 * rho - 1) ** 3);
        nu = 2;
      } else {
        mu *= nu;
        nu *= 2;
      }
    }
    return x;
  };

  // Two starts, the pose's own angles and the middle of every range, the
  // lower cost kept: a digit's fit has a local minimum where a joint folds
  // the wrong way round the target, and the range's middle lies on the
  // other side of it.
  const middle: number[] = variables.map((v: IVariable): number =>
    v.range === null ? 0 : (v.range.min + v.range.max) / 2,
  );
  const x: number[] = [read(input.pose.joints), middle]
    .map(descend)
    .reduce((best: number[], next: number[]): number[] =>
      cost(residual(next)) < cost(residual(best)) ? next : best,
    );

  const fitted: IAutoMovieJointPose[] = joints(x);
  const at = place(fitted);
  return {
    joints: fitted,
    point: at.point,
    normal: at.normal,
    residual: Vector3.length(Vector3.subtract(at.point, input.target)),
  };
}

/**
 * Companion types of {@link fitDigitToTarget}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation A posed rig, the digit's joints proximal to distal, a bone-local effector frame and a world target point with an optional normal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the fit reads and what its caller needs back: the joints, where the effector ended and how far from the target.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's poses, bones and vectors; the effector is the region frame `resolveAutoMovieHumanoidSurfaces` already gives.
 */
export namespace fitDigitToTarget {
  /** What a digit fit reads. */
  export interface IInput {
    /** The rig. */
    skeleton: IAutoMovieSkeleton;

    /** The posed body: its root, arm and hand place the digit's base; its own entries for the digit's joints are the fit's start. */
    pose: IAutoMoviePose;

    /** The digit's joints, proximal to distal: a finger's three, or the thumb's metacarpal, proximal and distal. */
    bones: readonly AutoMovieHumanoidBone[];

    /** The point brought to the target, in its bone's rest frame relative to the bone's joint, metres, with the outward unit normal there: a region frame of the digit's tip or pad. */
    effector: {
      bone: AutoMovieHumanoidBone;
      point: IAutoMovieVector3;
      normal: IAutoMovieVector3;
    };

    /** The target, world metres. */
    target: IAutoMovieVector3;

    /** The world direction the effector's normal is turned onto, when the contact needs one (a pad laid on a key faces against the key's normal); none when absent. */
    normal?: IAutoMovieVector3;

    /** The ratio of the distal joint's flexion to the middle joint's that a finger keeps as a weighted prior; no coupling when absent (the thumb). */
    coupling?: number;

    /** The joint axes the pose is read with, as `resolvePose` takes them; the skeleton's own when absent. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** The rest frames the pose's clinical angles are lifted by, as `resolvePose` takes them; none when absent. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /** The rig's topology, when the caller has it. */
    topology?: IAutoMovieSkeletonTopology;
  }

  /** What a digit fit returns. */
  export interface IResult {
    /** The digit's joints, inside their range, clinical degrees. */
    joints: IAutoMovieJointPose[];

    /** Where the effector ended, world metres. */
    point: IAutoMovieVector3;

    /** The effector's outward unit normal there, world frame. */
    normal: IAutoMovieVector3;

    /** The distance from the effector to the target, metres; zero within rounding when the target is reached. */
    residual: number;
  }
}

/** A variable of the fit: one free axis of one joint. */
interface IVariable {
  bone: AutoMovieHumanoidBone;
  axis: (typeof AXES)[number];

  /** The axis's range, clinical degrees; none when the joint has no constraint. */
  range: IAutoMovieAngleRange | null;
}

/** The clinical axes of a joint, in the order variables are read. */
const AXES = ["flexion", "abduction", "twist"] as const;

/** The damping start of Levenberg-Marquardt relative to the largest diagonal entry of the normal matrix (Madsen, Nielsen and Tingleff 2004, section 3.2, tau = 1e-3 for a start believed close). */
const TAU: number = 1e-3;
