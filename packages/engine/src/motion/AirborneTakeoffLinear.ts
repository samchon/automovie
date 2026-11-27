import { AutoMovieEngineKinematics } from "../kinematics/AutoMovieEngineKinematics";
import type { AutoMovieVector3Tuple, IAutoMovieQuaternion, IAutoMovieSolveAirborneTakeoff, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieSolidVector } from "../geometry/construction/AutoMovieSolidVector";

import { Quaternion } from "../math/Quaternion";
import type { physicalInertiaFactor } from "../physics/internal/physicalInertiaFactor";
import { AutoMoviePhysicalInertiaTensor } from "../physics/AutoMoviePhysicalInertiaTensor";
import { AirborneShapeHistory } from "./AirborneShapeHistory";
import { AirborneTakeoffQuadrature } from "./internal/AirborneTakeoffQuadrature";
import { AutoMovieEngineMotionTrajectory } from "./AutoMovieEngineMotionTrajectory";

/**
 * The linearized shooting relation `angle = turning L - lagging` in the
 * take-off frame: `turning = integral I^-1 dt`, `lagging = integral I^-1 h
 * dt`.
 *
 * Explicit fixed integration keeps the original composite Simpson grid. For
 * adaptive shooting with a resolved angular budget, adaptive Simpson instead
 * estimates both integrals together. Each panel's absolute component errors E_A
 * and E_b contribute ||E_A||_F ||L|| + ||E_b||_2 radians; these panel norms are
 * summed by the triangle inequality, with ||L|| bounded by the larger projected
 * seed norm at request shares zero and one. The unprojected seed is affine in
 * the share, so convexity of its norm and radial projection give this bound
 * throughout continuation. This is the triangle/subordinate-norm estimate for
 * the relation A L-b. It controls seed quadrature, not the nonlinear flight or
 * its sensitivities. The latter still determine the full-request physical
 * residual and admission.
 *
 * @param props The shape history, flight, request, momentum ceiling and
 *   integration mode.
 * @param into The rotation from the root's axes into the take-off frame.
 * @param angularTolerance The resolved shooting angular budget, radians;
 *   omitted callers retain the fixed-grid seed. Adaptive physical integration
 *   uses its own unchanged relative/absolute budgets.
 * @returns The matrix in seconds per kg m² and the relative-motion angle in
 *   radians.
 * @throws {Error} In fixed mode, when the step is not positive and finite or
 *   its count over the flight is not a safe integer.
 */
export function AirborneTakeoffLinear(
  props: Pick<
    IAutoMovieSolveAirborneTakeoff.IProps,
    | "history"
    | "t0"
    | "t1"
    | "h"
    | "integration"
    | "somersault"
    | "twist"
    | "maximum"
  >,
  into: IAutoMovieQuaternion,
  angularTolerance?: number,
): { turning: number[][]; lagging: number[] } {
  /** A single inverse-inertia sample and its relative-motion rate. */
  interface ISample {
    /** Inverse tensor in takeoff axes, 1/(kg m squared). */
    inverse: number[][];

    /** I inverse times shape momentum, radians/second. */
    lag: IAutoMovieVector3;
  }

  /** The two completed linear integrals. */
  type Relation = { turning: number[][]; lagging: number[] };
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let intoBasis: IAutoMovieVector3[] | undefined;
  const sample: (t: number) => ISample = (t: number): ISample => {
    const instant: ReturnType<typeof props.history> = props.history(t);
    const factor: physicalInertiaFactor.IPrepared | undefined =
      AirborneShapeHistory.factor(instant);
    if (factor !== undefined) {
      if (intoBasis === undefined) {
        const back: IAutoMovieQuaternion = Quaternion.inverse(into);
        intoBasis = [0, 1, 2].map(
          (axis: number): IAutoMovieVector3 =>
            Quaternion.rotateVector(back, {
              x: axis === 0 ? 1 : 0,
              y: axis === 1 ? 1 : 0,
              z: axis === 2 ? 1 : 0,
            }),
        );
      }
      const columns: IAutoMovieVector3[] = intoBasis.map(
        (basis: IAutoMovieVector3): IAutoMovieVector3 =>
          Quaternion.rotateVector(into, factor.solve(basis)),
      );
      return {
        inverse: [
          [columns[0]!.x, columns[1]!.x, columns[2]!.x],
          [columns[0]!.y, columns[1]!.y, columns[2]!.y],
          [columns[0]!.z, columns[1]!.z, columns[2]!.z],
        ],
        lag: Quaternion.rotateVector(into, factor.solve(instant.relative)),
      };
    }
    const { inertia, relative }: typeof instant = instant;
    const { x, y, z }: IAutoMovieVector3 = inertia.moments;
    const inverse: number[][] = AutoMoviePhysicalInertiaTensor.compute(
      [
        {
          mass: 0,
          centerOfMass: origin,
          inertia: { x: 1 / x, y: 1 / y, z: 1 / z },
          inertiaRotation: Quaternion.multiply(into, inertia.rotation),
        },
      ],
      origin,
    );
    return {
      inverse,
      lag: AutoMovieEngineKinematics.applyAutoMovieMomentumTensor(
        inverse,
        Quaternion.rotateVector(into, relative),
      ),
    };
  };
  const unpack: (value: readonly number[]) => Relation = (
    value: readonly number[],
  ): Relation => ({
    turning: [value.slice(0, 3), value.slice(3, 6), value.slice(6, 9)],
    lagging: value.slice(9, 12),
  });
  if (props.integration !== undefined && angularTolerance !== undefined) {
    let current: readonly number[] | undefined;
    let momentum: number = 0;
    const bound: (integral: readonly number[]) => number = (
      integral: readonly number[],
    ): number => {
      if (integral === current) return momentum;
      current = integral;
      const { turning, lagging }: Relation = unpack(integral);
      const maximum: number = props.maximum ?? Infinity;
      momentum = Math.max(
        ...[0, 1].map((share: number): number => {
          const local: number[] | null = AirborneTakeoffLinear.solve(turning, [
            2 * Math.PI * props.somersault * share + lagging[0]!,
            2 * Math.PI * props.twist * share + lagging[1]!,
            lagging[2]!,
          ]);
          if (local === null) return Math.abs(maximum);
          const magnitude: number = Math.hypot(...local);
          const scale: number = magnitude > maximum ? maximum / magnitude : 1;
          return Math.hypot(...local.map((v: number): number => scale * v));
        }),
      );
      return momentum;
    };
    const value: number[] = AirborneTakeoffQuadrature({
      t0: props.t0,
      t1: props.t1,
      tolerance: angularTolerance,
      read: (t: number): readonly number[] => {
        const { inverse, lag }: ISample = sample(t);
        return [...inverse.flat(), lag.x, lag.y, lag.z];
      },
      error: (
        integral: readonly number[],
        error: readonly number[],
      ): number => {
        const matrix: number = Math.hypot(...error.slice(0, 9));
        const lag: number = Math.hypot(...error.slice(9, 12));
        return (matrix === 0 ? 0 : matrix * bound(integral)) + lag;
      },
      separable: {
        components: (error: readonly number[]): readonly number[] => [
          Math.hypot(...error.slice(0, 9)),
          Math.hypot(...error.slice(9, 12)),
        ],
        weights: (integral: readonly number[]): readonly number[] => [
          bound(integral),
          1,
        ],
      },
    });
    return unpack(value);
  }

  const step: number = props.h ?? AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep();
  const steps: number = Math.ceil((props.t1 - props.t0) / step);

  // The integration's own grid rule: a step that is not positive and finite,
  // or one so fine that the count passes 2^53 (an index no longer counted
  // exactly, `Infinity` for a zero or subnormal step), makes no grid.
  if (!(step > 0))
    throw new Error(
      `The take-off seed needs a positive finite step with a safe-integer count over the flight, got ${step}`,
    );
  const turning: number[][] = [0, 1, 2].map((): number[] => [0, 0, 0]);
  const lagging: number[] = [0, 0, 0];
  let endpointTime: number | undefined;
  let endpoint: ISample | undefined;
  for (let k: number = 0; k < steps; k++) {
    const a: number = props.t0 + k * step;
    const b: number = k === steps - 1 ? props.t1 : a + step;
    for (const [t, weight] of [
      [a, (b - a) / 6],
      [(a + b) / 2, (4 * (b - a)) / 6],
      [b, (b - a) / 6],
    ] as const) {
      const current: ISample =
        endpoint !== undefined && Object.is(t, endpointTime)
          ? endpoint
          : sample(t);
      const { inverse, lag }: ISample = current;
      [lag.x, lag.y, lag.z].forEach((v: number, i: number): void => {
        lagging[i]! += weight * v;
        for (let j: number = 0; j < 3; j++)
          turning[i]![j]! += weight * inverse[i]![j]!;
      });
      if (Object.is(t, b)) {
        endpointTime = t;
        endpoint = current;
      }
    }
  }
  return { turning, lagging };
}

/** The three-variable linear solve shared by the shooting start and Newton step. */
export namespace AirborneTakeoffLinear {
  /**
   * Adapt matrix rows to the engine's three-column linear solver without
   * mutation.
   *
   * @param a Three matrix rows, read only.
   * @param b Three right-hand-side components, read only.
   * @returns A fresh solution, or null for non-finite inputs or a matrix the
   *   engine's singularity test rejects.
   *
   *   States row orientation, the right-hand side, input ownership and the
   *   nullable result. Admits finite entries, then delegates the unchanged
   *   Cramer solve and determinant-to-column-norm rejection to
   *   AutoMovieSolidVector.solve3; this is not a conditioning or error
   *   certificate. Check finiteness, copy three columns and the right-hand
   *   side, then delegate. Preserves the shooting solver's prior finite and
   *   singular behavior without a clamp, damping term or alternate numeric
   *   policy. Constant work and storage for the fixed three-by-three system.
   *   One adapter serves both the linearized takeoff start and every Newton
   *   correction; the determinant algebra remains engine-owned. Input rows and
   *   right-hand side are never mutated or retained; only fresh triples reach
   *   the engine solver, and only its fresh result escapes.
   */
  export function solve(
    a: readonly number[][],
    b: readonly number[],
  ): number[] | null {
    const column: (c: number) => AutoMovieVector3Tuple = (
      c: number,
    ): AutoMovieVector3Tuple => [a[0]![c]!, a[1]![c]!, a[2]![c]!];
    return AutoMovieSolidVector.solve3(column(0), column(1), column(2), [
      b[0]!,
      b[1]!,
      b[2]!,
    ]);
  }
}
