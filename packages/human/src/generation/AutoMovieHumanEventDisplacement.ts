import { AutoMovieHumanLoftChain as Loft } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanSplineCurve as Curve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain as Chain } from "../lofting/IAutoMovieHumanLoftChain";

/** Carry a prescribed world displacement and both station derivatives into a loft's own moving frame. */
export namespace AutoMovieHumanEventDisplacement {
  /** World vector in calibration millimetres, or its station derivative. */
  export type Vector = [number, number, number];
  /** Three columns of a section frame or one of its derivatives. */
  type Matrix = [Vector, Vector, Vector];

  /**
   * Add `q(s) D(t)` without rotating that world displacement with the child.
   * With M=[u,v,v×u], local jets solve M c=qD, M c'=q'D-M'c,
   * M c''=q''D-2M'c'-M''c. Changing values and slopes alone left stale
   * second jets in quintic spans and changed the intended world correction.
   * Sampling and spline projection retain the event's existing phase grid.
   */
  export function layer(chain: Chain, index: number, vectors: readonly Vector[], q: readonly [number, number, number]): Chain.ILayer {
    if (!q.every(Number.isFinite) || vectors.length !== 4 * chain.order)
      throw new Error("An event displacement needs finite scalar jets and four vectors per section control");
    const own: Chain.ILayer = chain.layers[index]!;
    const frame: ReturnType<typeof Loft.frame> = Loft.frame(chain, own.y);
    if (own.frame !== undefined && (own.frameSlopes === undefined || own.frameCurvatures === undefined))
      throw new Error("A framed event displacement requires both frame station jets");
    const u: Vector = frame.u;
    const v: Vector = frame.v;
    const du: Vector = own.frameSlopes?.u ?? [0, 0, 0];
    const dv: Vector = own.frameSlopes?.v ?? [0, 0, 0];
    const ddu: Vector = own.frameCurvatures?.u ?? [0, 0, 0];
    const ddv: Vector = own.frameCurvatures?.v ?? [0, 0, 0];
    const matrix: Matrix = [u, v, cross(v, u)];
    const first: Matrix = [du, dv, add(cross(dv, u), cross(v, du))];
    const second: Matrix = [ddu, ddv, add(add(cross(ddv, u), scale(cross(dv, du), 2)), cross(v, ddu))];
    const columns: Vector[] = [cross(matrix[1], matrix[2]), cross(matrix[2], matrix[0]), cross(matrix[0], matrix[1])];
    const determinant: number = dot(matrix[0], columns[0]!);
    if (!Number.isFinite(determinant) || determinant === 0 || ![...matrix, ...first, ...second].every((column: Vector): boolean => column.every(Number.isFinite)))
      throw new Error("An event displacement needs finite invertible frame jets");
    const inverse: (vector: Vector) => Vector = (vector: Vector): Vector => columns.map((column: Vector): number => dot(column, vector) / determinant) as Vector;
    const jets: Vector[][] = [[], [], []];
    for (const vector of vectors) {
      if (!vector.every(Number.isFinite)) throw new Error("An event displacement vector must be finite");
      const value: Vector = inverse(scale(vector, q[0]));
      const slope: Vector = inverse(sub(scale(vector, q[1]), multiply(first, value)));
      const curvature: Vector = inverse(sub(sub(scale(vector, q[2]), scale(multiply(first, slope), 2)), multiply(second, value)));
      jets[0]!.push(value); jets[1]!.push(slope); jets[2]!.push(curvature);
    }
    const coefficients: number[][] = jets.map((values: Vector[]): number[] => Curve.project(values.map((value: Vector): [number, number] => [value[0], value[1]]), chain.order));
    const lift: number[][] = jets.map((values: Vector[]): number[] => Curve.project(values.map((value: Vector): [number, number] => [value[2], value[2]]), chain.order).slice(0, chain.order));
    const sum: (original: readonly number[] | undefined, delta: readonly number[]) => number[] = (original: readonly number[] | undefined, delta: readonly number[]): number[] => delta.map((value: number, i: number): number => (original?.[i] ?? 0) + value);
    const lifted: boolean = own.lift !== undefined || lift.some((values: number[]): boolean => values.some((value: number): boolean => value !== 0));
    return {
      ...own,
      coefficients: sum(own.coefficients, coefficients[0]!),
      slopes: sum(own.slopes, coefficients[1]!),
      ...(own.curvatures === undefined ? {} : { curvatures: sum(own.curvatures, coefficients[2]!) }),
      ...(lifted ? { lift: sum(own.lift, lift[0]!), liftSlopes: sum(own.liftSlopes, lift[1]!), ...(own.curvatures === undefined && own.liftCurvatures === undefined ? {} : { liftCurvatures: sum(own.liftCurvatures, lift[2]!) }) } : {}),
    };
  }

  /** A matrix acts on a local vector by its three world columns. */
  function multiply(matrix: Matrix, vector: Vector): Vector { return [0, 1, 2].map((axis: number): number => matrix[0][axis]! * vector[0] + matrix[1][axis]! * vector[1] + matrix[2][axis]! * vector[2]) as Vector; }
  /** Vector sum in one world frame. */
  function add(a: Vector, b: Vector): Vector { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  /** Vector difference in one world frame. */
  function sub(a: Vector, b: Vector): Vector { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  /** Scalar product with a dimensional factor. */
  function scale(a: Vector, factor: number): Vector { return [factor * a[0], factor * a[1], factor * a[2]]; }
  /** Euclidean inner product. */
  function dot(a: Vector, b: Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  /** Oriented area vector. */
  function cross(a: Vector, b: Vector): Vector { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
}
