import type {
  IAutoMovieAlgebra,
  IAutoMovieConicArc,
  IAutoMovieConicArcField,
  IAutoMovieConicFieldJet,
  IAutoMovieConicHermite,
  IAutoMovieConicHermiteField,
  IAutoMoviePolarSector,
} from "@automovie/interface";

import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";

/** Shared projective G2 geometry at an already selected numeric clock. */
export namespace AutoMovieConicHermiteField {
  /** Stable logarithm of a positive sum with a primal scaling gauge. */
  export function logSum<T>(
    ops: IAutoMovieAlgebra<T>,
    values: readonly T[],
  ): T {
    if (values.length === 0) return ops.constant(-Infinity);
    const largest: number = Math.max(
      ...values.map((value: T): number => ops.value(value)),
    );
    return sumAtMaximum(ops, values, largest);
  }

  /** Rational cubic point at a fixed log-odds clock or an explicit endpoint. */
  export function projective<T>(
    ops: IAutoMovieAlgebra<T>,
    patch: IAutoMovieConicHermite.IPatch<T>,
    weights: readonly T[],
    clock: number | null,
    position: "first" | "interior" | "last" = "interior",
  ): IAutoMovieConicHermiteField.IProjective<T> {
    if (position === "first")
      return { point: [patch.extent, ops.constant(0)], logs: [] };
    if (position === "last")
      return {
        point: [ops.subtract(patch.extent, patch.deficit), patch.height],
        logs: [],
      };
    if (clock === null)
      return { point: [ops.constant(NaN), ops.constant(NaN)], logs: [] };
    const raw: T[] = weights.map(
      (weight: T, i: number): T =>
        ops.add(
          weight,
          ops.constant((i === 1 || i === 2 ? Math.log(3) : 0) + i * clock),
        ),
    );
    const primals: number[] = raw.map((value: T): number => ops.value(value));
    const maximum: number = Math.max(...primals);
    const pivot: number = primals.indexOf(maximum);
    const normalizer: T = sumAtMaximum(ops, raw, maximum);
    const logs: T[] = raw.map((value: T): T => ops.subtract(value, normalizer));
    const base: readonly [T, T] = patch.points[pivot]!;
    let x: T = base[0];
    let y: T = base[1];
    for (let i: number = 0; i < 4; i++) {
      const probability: T = ops.exp(logs[i]!);
      x = ops.add(
        x,
        ops.multiply(probability, ops.subtract(patch.points[i]![0], base[0])),
      );
      y = ops.add(
        y,
        ops.multiply(probability, ops.subtract(patch.points[i]![1], base[1])),
      );
    }
    return {
      point: [
        ops.subtract(patch.extent, ops.multiply(patch.deficit, x)),
        ops.multiply(patch.height, y),
      ],
      logs,
    };
  }

  /** Unit tangent from positive projective pair sums. */
  export function direction<T>(
    ops: IAutoMovieAlgebra<T>,
    patch: IAutoMovieConicHermite.IPatch<T>,
    reading: IAutoMovieConicHermiteField.IProjective<T>,
    position: "first" | "interior" | "last",
  ): IAutoMovieConicHermiteField.IDirection<T> {
    if (position !== "interior") {
      const first: readonly [T, T] =
        position === "first" ? patch.points[0]! : patch.points[2]!;
      const last: readonly [T, T] =
        position === "first" ? patch.points[1]! : patch.points[3]!;
      const x: T = ops.multiply(patch.deficit, ops.subtract(last[0], first[0]));
      const y: T = ops.multiply(patch.height, ops.subtract(last[1], first[1]));
      const edge: T = AutoMovieConicArcField.norm(ops, x, y);
      return {
        tangent:
          position === "first"
            ? [ops.constant(0), ops.constant(1)]
            : [
                ops.divide(ops.subtract(ops.constant(0), x), edge),
                ops.divide(y, edge),
              ],
        logSpeed: ops.log(edge),
      };
    }
    const xs: T[] = [];
    const ys: T[] = [];
    for (let i: number = 0; i < 4; i++)
      for (let j: number = i + 1; j < 4; j++) {
        const coefficient: T = ops.add(
          ops.add(reading.logs[i]!, reading.logs[j]!),
          ops.constant(Math.log(j - i)),
        );
        const dx: T = ops.subtract(patch.points[j]![0], patch.points[i]![0]);
        const dy: T = ops.subtract(patch.points[j]![1], patch.points[i]![1]);
        if (ops.value(dx) > 0) xs.push(ops.add(coefficient, ops.log(dx)));
        if (ops.value(dy) > 0) ys.push(ops.add(coefficient, ops.log(dy)));
      }
    const lx: T = ops.add(ops.log(patch.deficit), logSum(ops, xs));
    const ly: T = ops.add(ops.log(patch.height), logSum(ops, ys));
    const gauge: T = ops.constant(Math.max(ops.value(lx), ops.value(ly)));
    const x: T = ops.exp(ops.subtract(lx, gauge));
    const y: T = ops.exp(ops.subtract(ly, gauge));
    const speed: T = AutoMovieConicArcField.norm(ops, x, y);
    return {
      tangent: [
        ops.divide(ops.subtract(ops.constant(0), x), speed),
        ops.divide(y, speed),
      ],
      logSpeed: ops.add(gauge, ops.log(speed)),
    };
  }

  /** Prepared G2 source partials at the final primal clock. */
  export function read(
    patch: IAutoMovieConicHermite.IPatch<IAutoMovieConicFieldJet.IJet>,
    ray: IAutoMovieConicArc.IRay,
  ): IAutoMovieConicArcField.IReading | IAutoMovieConicArcField.IFailure {
    if (ray.position === "interior" && ray.clock === null)
      return {
        kind: "failure",
        detail:
          "A G2 source reading requires the selected finite interior log-odds clock.",
      };

    const ops: IAutoMovieAlgebra<IAutoMovieConicFieldJet.IJet> =
      AutoMovieConicFieldJet.AD;
    const weights: IAutoMovieConicFieldJet.IJet[] = patch.weights.map(
      (weight: IAutoMovieConicFieldJet.IJet): IAutoMovieConicFieldJet.IJet =>
        ops.log(weight),
    );
    const reading: IAutoMovieConicHermiteField.IProjective<IAutoMovieConicFieldJet.IJet> =
      projective(ops, patch, weights, ray.clock, ray.position);
    const tangent: IAutoMovieConicHermiteField.IDirection<IAutoMovieConicFieldJet.IJet> =
      direction(ops, patch, reading, ray.position);
    return AutoMovieConicArcField.finish(
      AutoMovieConicArcField.orient(
        ops,
        { point: reading.point, tangent: tangent.tangent },
        ray.reverse,
      ),
      ray,
    );
  }

  /** Numeric phase geometry from the final shared projective reading. */
  export function ray(
    patch: IAutoMovieConicHermite.IPatch,
    reading: IAutoMovieConicHermiteField.IProjective<number>,
    clock: number | null,
    position: "first" | "interior" | "last",
  ): IAutoMovieConicArc.IRay | null {
    const directionValue: IAutoMovieConicHermiteField.IDirection<number> =
      direction(AutoMovieConicFieldJet.NUMBER, patch, reading, position);
    let logCurvature: number;
    if (position === "first") logCurvature = Math.log(patch.curvature);
    else if (position === "last")
      logCurvature =
        Math.log(2 / 3) +
        Math.log(patch.weights[3]!) +
        Math.log(patch.weights[1]!) -
        2 * Math.log(patch.weights[2]!) +
        Math.log(patch.deficit) +
        Math.log(patch.height) +
        Math.log(patch.points[1]![1]) +
        Math.log(patch.points[2]![0]) -
        3 * directionValue.logSpeed;
    else {
      const area: number =
        Math.log(patch.deficit) +
        Math.log(patch.height) +
        Math.log(patch.points[1]![1]);
      const small: number = Math.log(patch.points[2]![0]);
      const determinants: number[] = [];
      for (let missing: number = 0; missing < 4; missing++) {
        const indices: number[] = [0, 1, 2, 3].filter(
          (i: number): boolean => i !== missing,
        );
        const i: number = indices[0]!;
        const j: number = indices[1]!;
        const k: number = indices[2]!;
        determinants.push(
          reading.logs[i]! +
            reading.logs[j]! +
            reading.logs[k]! +
            Math.log((j - i) * (k - i) * (k - j)) +
            area +
            (missing === 0 || missing === 3 ? small : 0),
        );
      }
      logCurvature =
        logSum(AutoMovieConicFieldJet.NUMBER, determinants) -
        3 * directionValue.logSpeed;
    }
    const radial: IAutoMoviePolarSector.Jet =
      position === "first"
        ? [
            patch.extent,
            0,
            patch.extent - patch.curvature * patch.extent * patch.extent,
          ]
        : polarGeometry(reading.point, directionValue.tangent, logCurvature);

    return {
      point: reading.point,
      tangent: directionValue.tangent,
      radial,
      logCurvature,
      native: null,
      clock,
      position,
      reverse: false,
    };
  }

  /*
   * Preserve the ordered log-sum arithmetic while reusing an already read
   * primal gauge.
   */
  function sumAtMaximum<T>(
    ops: IAutoMovieAlgebra<T>,
    values: readonly T[],
    largest: number,
  ): T {
    const gauge: T = ops.constant(largest);
    let sum: T = ops.constant(0);
    for (const value of values)
      sum = ops.add(sum, ops.exp(ops.subtract(value, gauge)));
    return ops.add(gauge, ops.log(sum));
  }

  /*
   * Polar slope and second derivative from unit direction and logarithmic
   * geometric curvature.
   */
  function polarGeometry(
    point: readonly [number, number],
    tangent: readonly [number, number],
    curvature: number,
  ): IAutoMoviePolarSector.Jet {
    const rho: number = Math.hypot(...point);
    const dot: number =
      (point[0] / rho) * tangent[0] + (point[1] / rho) * tangent[1];
    const cross: number =
      (point[0] / rho) * tangent[1] - (point[1] / rho) * tangent[0];
    if (!(cross > 0)) return [NaN, NaN, NaN];
    const ratio: number = dot / cross;
    return [
      rho,
      rho * ratio,
      rho *
        (1 +
          2 * ratio * ratio -
          Math.exp(curvature + Math.log(rho)) * (1 + ratio * ratio) ** 1.5),
    ];
  }
}
