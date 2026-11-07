import type { AutoMovieHumanClinicalIkInput as AutoMovieHumanClinicalIk } from "./AutoMovieHumanClinicalIkInput";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanTargetPoint as TargetPoint } from "./AutoMovieHumanTargetPoint";

/** Common clinical residuals, channel access and small dense elimination; no pose or body is cached. */
export namespace AutoMovieHumanClinicalIkMath {
  /** Form the damped normal equations in the caller's original coordinate order. */
  export function normal(
    columns: number[][],
    residual: number[],
    previous: number[],
    prior: number[],
    priorSquared: number,
    ridge: number,
    relative: number,
  ): { matrix: number[][]; right: number[] } {
    const matrix: number[][] = columns.map(
      (row: number[], i: number): number[] =>
        columns.map(
          (column: number[], j: number): number =>
            row.reduce(
              (sum: number, value: number, k: number): number =>
                sum + value * column[k]!,
              0,
            ) *
              (i === j ? 1 + relative : 1) +
            (i === j ? ridge + priorSquared : 0),
        ),
    );
    const right: number[] = columns.map(
      (row: number[], index: number): number =>
        -(
          row.reduce(
            (sum: number, value: number, i: number): number =>
              sum + value * residual[i]!,
            0,
          ) +
          priorSquared * (previous[index]! - prior[index]!)
        ),
    );
    return { matrix, right };
  }

  /** Bone-point admission reads every coordinate, including sparse local tuples. */
  export function bonePoint(
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

  /** Read a registered path without requiring clients to cast their pose. */
  export function read(pose: unknown, path: string): number {
    let value: unknown = pose;
    for (const part of path.split(".")) {
      if (typeof value !== "object" || value === null) return 0;
      value = Reflect.get(value, part);
    }
    return typeof value === "number" ? value : 0;
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
    weighted: boolean = true,
  ): number[] {
    return targets.flatMap(
      (target: AutoMovieHumanClinicalIk.ITarget): number[] => {
        const point: Controls.MetrePoint = pointAt(output, target);
        return point.map(
          (v: number, i: number): number =>
            (v - target.position[i]!) * (weighted ? (target.weight ?? 1) : 1),
        );
      },
    );
  }

  /** Resolve an admitted rigid point and refuse invalid FK, never substitute an origin. */
  export function pointAt(
    output: AutoMovieHumanSkeleton.IProjection,
    point: AutoMovieHumanClinicalIk.IBonePoint &
      Pick<AutoMovieHumanClinicalIk.ITarget, "witness">,
  ): Controls.MetrePoint {
    return TargetPoint.resolve(
      new Map(
        output.posed.map(
          (
            placement: (typeof output.posed)[number],
          ): [string, AutoMovieHumanSkeleton.IPlacement] => [
            placement.bone,
            placement,
          ],
        ),
      ),
      point,
    );
  }

  /** Read each required coordinate so sparse arrays cannot skip admission. */
  export function finitePoint(value: unknown): value is Controls.MetrePoint {
    return (
      Array.isArray(value) &&
      value.length === 3 &&
      [0, 1, 2].every((axis: number): boolean => Number.isFinite(value[axis]))
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
      for (let r: number = c + 1; r < n; r++) {
        const factor: number = a[r]![c]! / divisor;
        for (let j: number = c; j <= n; j++)
          a[r]![j] = a[r]![j]! - factor * a[c]![j]!;
      }
    }
    const solution: number[] = new Array<number>(n).fill(0);
    for (let row: number = n - 1; row >= 0; row--) {
      let value: number = a[row]![n]!;
      for (let column: number = row + 1; column < n; column++)
        value -= a[row]![column]! * solution[column]!;
      solution[row] = value / a[row]![row]!;
    }
    return solution;
  }
}
