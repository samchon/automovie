import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieSolidVector } from "../geometry/construction/AutoMovieSolidVector";
import { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { Quaternion } from "../math/Quaternion";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import type { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { AirborneShapeHistory } from "./AirborneShapeHistory";
import { AirborneTakeoffQuadrature } from "./AirborneTakeoffQuadrature";
import { integrateMotionTrajectory } from "./integrateMotionTrajectory";
import type { solveAirborneTakeoff } from "./solveAirborneTakeoff";

/**
 * The linearized shooting relation `angle = turning L - lagging` in the
 * take-off frame: `turning = integral I^-1 dt`, `lagging = integral I^-1 h dt`.
 *
 * Explicit fixed integration keeps the original composite Simpson grid.
 * For adaptive shooting with a resolved angular budget, adaptive Simpson
 * instead estimates both integrals together. Each panel's absolute component
 * errors E_A and E_b contribute ||E_A||_F ||L|| + ||E_b||_2 radians; these
 * panel norms are summed by the triangle inequality,
 * with ||L|| bounded by the larger projected seed norm at request shares
 * zero and one. The unprojected seed is affine in the share, so convexity
 * of its norm and radial projection give this bound throughout continuation.
 * This is the triangle/subordinate-norm estimate for the relation A L-b. It
 * controls seed quadrature, not the nonlinear flight or its sensitivities.
 * The latter still determine the full-request physical residual and admission.
 *
 * @param props The shape history, flight, request, momentum ceiling and integration mode.
 * @param into The rotation from the root's axes into the take-off frame.
 * @param angularTolerance The resolved shooting angular budget, radians; omitted callers retain the fixed-grid seed. Adaptive physical integration uses its own unchanged relative/absolute budgets.
 * @returns The matrix in seconds per kg m² and the relative-motion angle in radians.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the linear relation, both integrals, frames and units.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves fixed-grid Simpson and uses the shared adaptive Simpson/Richardson estimator for an adaptive request. Matrix error times a projected seed-norm bound over request shares zero through one plus lag error has angular units and is compared with the public shooting budget. The affine seed's endpoint norms bound its interior by convexity, retained by radial projection for nonnegative ceilings; the quadrature estimate still assumes smoothness and is not a continuous certificate or Newton-convergence guarantee.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One physical integrand serves fixed weighting or adaptive quadrature; one unpacker and the existing three-variable solve measure the current seed's estimated angle error.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every node uses actual history, sharing only an exactly equal preceding fixed endpoint or an adaptive parent's actual samples. No guessed mean inertia, time quantization, per-component relative floor, fixed-rate adaptive seed or weakened physical integration budget is introduced; unsampled structure can still fool the estimator, and final nonlinear shooting remains authoritative.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed mode retains all 3K original weighted contributions over K intervals; Object.is-equal adjacent endpoints avoid duplicate history/tensor reads, giving 2K+1 reads on a resolved exactly shared grid and retaining actual reads at floating-point mismatches. Adaptive mode starts with five reads and adds four per bisection, independent of the physical integrator's initial h; largest-error aggregation is quadratic in leaf count but history reads are linear. The two endpoint seed norms are computed once per refinement, not per panel score.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Unobserved factory tensors share their SPD factor: three takeoff-basis solves form the inverse columns directly and one relative-momentum solve forms the lag, without eigensolves or inverse-matrix materialization. The into-frame basis is prepared once on first use. Public principals retain the original rotated-tensor path. Fixed mode reuses only an exactly equal preceding endpoint; adaptive children reuse actual parent samples and half rules.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The adaptive call owns numeric samples and estimates plus one current-integral/seed-norm pair; fixed mode holds at most one endpoint time and its inverse tensor/relative rate. All are released on return or throw. Only the two numeric result arrays escape, with no cross-call cache or handle.
 */
export function AirborneTakeoffLinear(
  props: Pick<
    solveAirborneTakeoff.IProps,
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
    const factor: physicalInertiaFactor.IPrepared | undefined = AirborneShapeHistory.factor(instant);
    if (factor !== undefined) {
      if (intoBasis === undefined) {
        const back: IAutoMovieQuaternion = Quaternion.inverse(into);
        intoBasis = [0, 1, 2].map((axis: number): IAutoMovieVector3 =>
          Quaternion.rotateVector(back, { x: axis === 0 ? 1 : 0, y: axis === 1 ? 1 : 0, z: axis === 2 ? 1 : 0 }));
      }
      const columns: IAutoMovieVector3[] = intoBasis.map((basis: IAutoMovieVector3): IAutoMovieVector3 =>
        Quaternion.rotateVector(into, factor.solve(basis)));
      return {
        inverse: [[columns[0]!.x, columns[1]!.x, columns[2]!.x],
          [columns[0]!.y, columns[1]!.y, columns[2]!.y],
          [columns[0]!.z, columns[1]!.z, columns[2]!.z]],
        lag: Quaternion.rotateVector(into, factor.solve(instant.relative)),
      };
    }
    const { inertia, relative }: typeof instant = instant;
    const { x, y, z }: IAutoMovieVector3 = inertia.moments;
    const inverse: number[][] = physicalInertiaTensor(
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
      lag: resolveAutoMovieMomentum.apply(
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
        if (integral !== current) {
          current = integral;
          const { turning, lagging }: Relation = unpack(integral);
          const maximum: number = props.maximum ?? Infinity;
          momentum = Math.max(
            ...[0, 1].map((share: number): number => {
              const local: number[] | null = AirborneTakeoffLinear.solve(
                turning,
                [
                  2 * Math.PI * props.somersault * share + lagging[0]!,
                  2 * Math.PI * props.twist * share + lagging[1]!,
                  lagging[2]!,
                ],
              );
              if (local === null) return Math.abs(maximum);
              const magnitude: number = Math.hypot(...local);
              const scale: number =
                magnitude > maximum ? maximum / magnitude : 1;
              return Math.hypot(...local.map((v: number): number => scale * v));
            }),
          );
        }
        const matrix: number = Math.hypot(...error.slice(0, 9));
        const lag: number = Math.hypot(...error.slice(9, 12));
        return (matrix === 0 ? 0 : matrix * momentum) + lag;
      },
    });
    return unpack(value);
  }

  const step: number = props.h ?? integrateMotionTrajectory.STEP;
  const steps: number = Math.ceil((props.t1 - props.t0) / step);
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

/**
 * The three-variable linear solve shared by the shooting start and Newton step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The member reads matrix rows and a right-hand side and returns a fresh solution or null.
 * @evidence contracts/development/design.md#principled-representation A three-row numeric matrix and three-component right-hand side are adapted to the engine's existing column-vector solver.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the takeoff solver's linearized start and Newton correction read this adapter.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares AutoMovieSolidVector.solve3 rather than introducing another determinant formula or regularization.
 */
export namespace AirborneTakeoffLinear {
  /**
   * Adapt matrix rows to the engine's three-column linear solver without mutation.
   *
   * @param a Three matrix rows, read only.
   * @param b Three right-hand-side components, read only.
   * @returns A fresh solution, or null for non-finite inputs or a matrix the engine's singularity test rejects.
   *
   * States row orientation, the right-hand side, input ownership and the nullable result.
   * Admits finite entries, then delegates the unchanged Cramer solve and determinant-to-column-norm rejection to AutoMovieSolidVector.solve3; this is not a conditioning or error certificate.
   * Check finiteness, copy three columns and the right-hand side, then delegate.
   * Preserves the shooting solver's prior finite and singular behavior without a clamp, damping term or alternate numeric policy.
   * Constant work and storage for the fixed three-by-three system.
   * One adapter serves both the linearized takeoff start and every Newton correction; the determinant algebra remains engine-owned.
   * Input rows and right-hand side are never mutated or retained; only fresh triples reach the engine solver, and only its fresh result escapes.
   */
  export function solve(
    a: readonly number[][],
    b: readonly number[],
  ): number[] | null {
    if (!a.flat().every(Number.isFinite) || !b.every(Number.isFinite))
      return null;
    const column: (c: number) => AutoMovieSolidVector.Vec3 = (
      c: number,
    ): AutoMovieSolidVector.Vec3 => [a[0]![c]!, a[1]![c]!, a[2]![c]!];
    return AutoMovieSolidVector.solve3(column(0), column(1), column(2), [
      b[0]!,
      b[1]!,
      b[2]!,
    ]);
  }
}
