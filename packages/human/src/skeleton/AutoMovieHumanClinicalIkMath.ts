import type { IAutoMovieQuadraticRow } from "@automovie/engine/math/IAutoMovieQuadraticRow";
import { adjacentAutoMovieFloat64 } from "@automovie/engine/math/adjacentAutoMovieFloat64";
import { refineAutoMovieQuadraticProgram } from "@automovie/engine/math/refineAutoMovieQuadraticProgram";
import { solveAutoMovieQuadraticProgram } from "@automovie/engine/math/solveAutoMovieQuadraticProgram";

import type { AutoMovieHumanClinicalIk } from "./AutoMovieHumanClinicalIk";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanClinicalIkProjection as Projection } from "./AutoMovieHumanClinicalIkProjection";

/**
 * Clinical descriptor admission, QP directions, target errors and step
 * application, independent of outer iteration and evaluator ownership.
 * Projection owns raw constraint measurements and numerical envelopes.
 * The type-only public-entry reference creates no reverse runtime dependency.
 *
 * @evidence contracts/common.md#principled-implementation Retains the original descriptor admission, rigid-target equations, diagonal QP, KKT polishing and damped linear solve; representable applied caps enforce the existing twelve-degree limit.
 * @evidence contracts/common.md#clear-and-simple-design One arithmetic owner serves the unchanged public fitting loop, with only type-only references to its descriptors and no evaluator selection or retained state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No target, channel, clinical range, QP objective, status or tolerance is replaced; failure still retains actual residuals.
 * @evidence contracts/common.md#meaningful-documentation States responsibility, public API preservation, type-only dependency and the original admission and cap authority.
 * @evidence contracts/performance.md#efficient-algorithms Existing scalar/vector routines retain their original dimensions and QP work; no dense operation is added beyond the original at-most-twelve-channel normal system.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call measures its current pose and supplied equations, with no cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All arrays are call-owned or copied into returned data; no evaluator, solver handle or running task is retained.
 */
export namespace AutoMovieHumanClinicalIkMath {
  /** Shared rigid-point admission and projection preserve the original equations. */
  const { finitePoint, pointAt }: typeof Projection = Projection;

  /**
   * Apply the common direction fraction inside the original clinical box and
   * twelve-degree cap. Rounded addition can otherwise make the observed
   * difference exceed twelve, even when the scaled direction does not.
   * Move only the rounded cap endpoints inward by representable neighbors until
   * their actual binary64 differences satisfy the unchanged bound.
   *
   * @evidence contracts/common.md#principled-implementation Intersects the clinical box with representable endpoints whose subtraction from the admitted current value satisfies the exact existing twelve-degree comparison.
   * @evidence contracts/common.md#clear-and-simple-design Both constrained and unconstrained outer updates use this one application seam after their unchanged common direction fraction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance or safety epsilon is added, and targets, constraints and nonlinear acceptance remain unchanged.
   * @evidence contracts/common.md#meaningful-documentation States the addition/subtraction rounding cause, units, common fraction and original clinical interval.
   * @evidence contracts/performance.md#efficient-algorithms Constant scalar storage; inward neighbor steps cover only the rounding of a finite clinical endpoint.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar application of current inputs, with no reusable effect or result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no arrays, state, handles or tasks.
   */
  export function limitStep(
    value: number,
    direction: number,
    fraction: number,
    minimum: number,
    maximum: number,
  ): number {
    let lower: number = value - 12;
    let upper: number = value + 12;
    while (value - lower > 12) lower = adjacentAutoMovieFloat64(lower, true);
    while (upper - value > 12) upper = adjacentAutoMovieFloat64(upper, false);
    return Math.max(
      minimum,
      Math.min(maximum, Math.max(lower, Math.min(upper, value + fraction * direction))),
    );
  }

  /** Admit and copy dense descriptors before touching either evaluator capability. */
  export function admit(
    input: readonly AutoMovieHumanClinicalIk.IConstraint[] | undefined,
    channels: [string, number, number][],
  ): AutoMovieHumanClinicalIk.IConstraint[] {
    if (input === undefined) return [];
    if (!Array.isArray(input))
      throw new Error("Clinical IK constraints require a dense array");
    const ranges: [string, number, number][] = channels.map(
      (row: [string, number, number]): [string, number, number] => [...row],
    );
    return Array.from(input).map(
      (
        item: AutoMovieHumanClinicalIk.IConstraint,
      ): AutoMovieHumanClinicalIk.IConstraint => {
        if (
          !item ||
          typeof item !== "object" ||
          (item.minimum === undefined && item.maximum === undefined) ||
          (item.minimum !== undefined && !Number.isFinite(item.minimum)) ||
          (item.maximum !== undefined && !Number.isFinite(item.maximum)) ||
          (item.minimum ?? -Infinity) > (item.maximum ?? Infinity)
        )
          throw new Error("Clinical IK constraint interval is invalid");
        if (item.kind === "channel") {
          const channel: [string, number, number] | undefined = ranges.find(
            (row: [string, number, number]): boolean => row[0] === item.channel,
          );
          if (!channel)
            throw new Error("Clinical IK constraint channel must be selected");
          channel[1] = Math.max(channel[1], item.minimum ?? -Infinity);
          channel[2] = Math.min(channel[2], item.maximum ?? Infinity);
          if (channel[1] > channel[2])
            throw new Error(
              "Clinical IK channel constraint has no clinical range",
            );
          return { ...item };
        }
        if (
          item.kind !== "line-offset" ||
          !item.line ||
          !bonePoint(item.point) ||
          !bonePoint(item.line.origin) ||
          !bonePoint(item.line.end) ||
          !finitePoint(item.normal) ||
          Math.abs(Math.hypot(...item.normal) - 1) > 1e-6
        )
          throw new Error(
            "Clinical IK line-offset requires finite bone points and a unit normal",
          );
        const copy: (
          point: AutoMovieHumanClinicalIk.IBonePoint,
        ) => AutoMovieHumanClinicalIk.IBonePoint = (
          point: AutoMovieHumanClinicalIk.IBonePoint,
        ): AutoMovieHumanClinicalIk.IBonePoint => ({
          bone: point.bone,
          ...(point.localPoint === undefined
            ? {}
            : { localPoint: [...point.localPoint] as Controls.MetrePoint }),
        });
        return {
          ...item,
          normal: [...item.normal],
          point: copy(item.point),
          line: { origin: copy(item.line.origin), end: copy(item.line.end) },
        };
      },
    );
  }

  /** Bone-point admission reads every coordinate, including sparse local tuples. */
  function bonePoint(
    value: unknown,
  ): value is AutoMovieHumanClinicalIk.IBonePoint {
    if (!value || typeof value !== "object") return false;
    const point: AutoMovieHumanClinicalIk.IBonePoint =
      value as AutoMovieHumanClinicalIk.IBonePoint;
    return (
      typeof point.bone === "string" &&
      point.bone.length > 0 &&
      (point.localPoint === undefined || finitePoint(point.localPoint))
    );
  }

  /** Residual auxiliaries encode J*delta-rNew=-r with the original damping.
   * Hard interval rows use the same FK derivatives and current clinical box.
   * Original-coordinate KKT polishing uses tolerance 1e-12 and at most eight
   * corrections per QP variable, without another native solve or FK. Rejected
   * polishing retains the original solved primal; another native status stalls
   * with actual final residuals. The caller caps the whole direction to twelve degrees
   * and checks nonlinear geometry, because a linearized row is not a certificate.
   */
  export function constrained(
    jacobian: number[][],
    residual: number[],
    gradient: number[][],
    measured: number[],
    constraints: readonly AutoMovieHumanClinicalIk.IConstraint[],
    previous: number[],
    bounds: { minimum: number; maximum: number }[],
  ): number[] {
    const n: number = previous.length;
    const ids: number[] = previous.map((_: number, i: number): number => i);
    const rows: IAutoMovieQuadraticRow[] = bounds.map(
      (
        bound: { minimum: number; maximum: number },
        i: number,
      ): IAutoMovieQuadraticRow => ({
        indices: [i],
        weights: [1],
        lower: bound.minimum - previous[i]!,
        upper: bound.maximum - previous[i]!,
      }),
    );
    for (let i: number = 0; i < residual.length; i++)
      rows.push({
        indices: [...ids, n + i],
        weights: [...jacobian.map((column: number[]): number => column[i]!), -1],
        lower: -residual[i]!,
        upper: -residual[i]!,
      });
    constraints.forEach(
      (item: AutoMovieHumanClinicalIk.IConstraint, i: number): void => {
        rows.push({
          indices: ids,
          weights: gradient.map((column: number[]): number => column[i]!),
          lower: item.minimum === undefined ? null : item.minimum - measured[i]!,
          upper: item.maximum === undefined ? null : item.maximum - measured[i]!,
        });
      },
    );
    const program: Parameters<typeof solveAutoMovieQuadraticProgram>[0] = {
      diagonal: [
        ...previous.map((): number => 0.000002),
        ...residual.map((): number => 1),
      ],
      linear: new Array<number>(n + residual.length).fill(0),
      rows,
    };
    const native: ReturnType<typeof solveAutoMovieQuadraticProgram> =
      solveAutoMovieQuadraticProgram(program);
    if (native.status !== 1 || !native.primal.every(Number.isFinite))
      return previous.map((): number => 0);
    const result: ReturnType<typeof refineAutoMovieQuadraticProgram> =
      refineAutoMovieQuadraticProgram(program, native, {
        tolerance: 1e-12,
        maximumRefinements: 8 * program.diagonal.length,
      });
    return result.primal.slice(0, n);
  }

  /** Write only a path already admitted against the public channel table. */
  export function write(pose: object, path: string, value: number): void {
    const parts: string[] = path.split(".");
    let node: object = pose;
    for (const part of parts.slice(0, -1)) {
      const child: unknown = Reflect.get(node, part);
      if (typeof child !== "object" || child === null)
        Reflect.set(
          node,
          part,
          node === pose && (part === "arms" || part === "legs")
            ? { left: {}, right: {} }
            : {},
        );
      node = Reflect.get(node, part) as object;
    }
    Reflect.set(node, parts[parts.length - 1]!, value);
  }

  /** Flatten positional residuals; all target coordinates must be finite. */
  export function errors(
    output: AutoMovieHumanSkeleton.IProjection,
    targets: AutoMovieHumanClinicalIk.ITarget[],
  ): number[] {
    return targets.flatMap(
      (target: AutoMovieHumanClinicalIk.ITarget): number[] => {
        const point: Controls.MetrePoint = pointAt(output, target);
        return point.map(
          (v: number, i: number): number => v - target.position[i]!,
        );
      },
    );
  }

  /** Largest three-dimensional target residual in metres. */
  export function maximum(residual: number[]): number {
    let value: number = 0;
    for (let i: number = 0; i < residual.length; i += 3)
      value = Math.max(
        value,
        Math.hypot(residual[i]!, residual[i + 1]!, residual[i + 2]!),
      );
    return value;
  }

  /** Pivoted elimination of the small damped positive-definite normal system. */
  export function linear(matrix: number[][], right: number[]): number[] {
    const n: number = right.length;
    const a: number[][] = matrix.map((row: number[], i: number): number[] => [
      ...row,
      right[i]!,
    ]);
    for (let c: number = 0; c < n; c++) {
      let pivot: number = c;
      for (let r: number = c + 1; r < n; r++)
        if (Math.abs(a[r]![c]!) > Math.abs(a[pivot]![c]!)) pivot = r;
      [a[c], a[pivot]] = [a[pivot]!, a[c]!];
      const divisor: number = a[c]![c]!;
      if (Math.abs(divisor) < 1e-14)
        return Array.from({ length: n }, (): number => 0);
      for (let j: number = c; j <= n; j++) a[c]![j] = a[c]![j]! / divisor;
      for (let r: number = 0; r < n; r++) {
        if (r === c) continue;
        const factor: number = a[r]![c]!;
        for (let j: number = c; j <= n; j++)
          a[r]![j] = a[r]![j]! - factor * a[c]![j]!;
      }
    }
    return a.map((row: number[]): number => row[n]!);
  }
}
