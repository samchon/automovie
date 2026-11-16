import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieSolidVector } from "../geometry/construction/AutoMovieSolidVector";
import { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { Quaternion } from "../math/Quaternion";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import { integrateMotionTrajectory } from "./integrateMotionTrajectory";
import type { solveAirborneTakeoff } from "./solveAirborneTakeoff";

/**
 * The linearized shooting relation `angle = turning L - lagging` in the
 * take-off frame: `turning = integral I^-1 dt`, `lagging = integral I^-1 h dt`.
 *
 * @param props The shape history, flight and optional integration step.
 * @param into The rotation from the root's axes into the take-off frame.
 * @returns The matrix in seconds per kg m² and the relative-motion angle in radians.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the linear relation, both integrals, frames and units.
 * @evidence contracts/development/implementation.md#principled-implementation Composite Simpson quadrature on the integration grid; rotating the principal inverse tensor uses the same tensor sum as physical inertia. This holds the body's orientation at the take-off frame and is a start for shooting, not the nonlinear flight's answer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One quadrature loop and one tensor application per node.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither a fitted mean inertia nor an assumed planar shape replaces the history.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three history reads per grid interval; the history shares repeated nodes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the momentum tensor product and physical tensor rotation; the caller shares the history with every shooting integration.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the two returned numerical arrays escape; no cache or process is owned here.
 */
export function AirborneTakeoffLinear(
  props: Pick<solveAirborneTakeoff.IProps, "history" | "t0" | "t1" | "h">,
  into: IAutoMovieQuaternion,
): { turning: number[][]; lagging: number[] } {
  const step: number = props.h ?? integrateMotionTrajectory.STEP;
  const steps: number = Math.ceil((props.t1 - props.t0) / step);
  const turning: number[][] = [0, 1, 2].map((): number[] => [0, 0, 0]);
  const lagging: number[] = [0, 0, 0];
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (let k: number = 0; k < steps; k++) {
    const a: number = props.t0 + k * step;
    const b: number = k === steps - 1 ? props.t1 : a + step;
    for (const [t, weight] of [
      [a, (b - a) / 6],
      [(a + b) / 2, (4 * (b - a)) / 6],
      [b, (b - a) / 6],
    ] as const) {
      const { inertia, relative } = props.history(t);
      const { x, y, z } = inertia.moments;
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
      const lag: IAutoMovieVector3 = resolveAutoMovieMomentum.apply(
        inverse,
        Quaternion.rotateVector(into, relative),
      );
      [lag.x, lag.y, lag.z].forEach((v: number, i: number): void => {
        lagging[i]! += weight * v;
        for (let j: number = 0; j < 3; j++)
          turning[i]![j]! += weight * inverse[i]![j]!;
      });
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
   * @evidence contracts/development/common.md#meaningful-documentation States row orientation, the right-hand side, input ownership and the nullable result.
   * @evidence contracts/development/implementation.md#principled-implementation Admits finite entries, then delegates the unchanged Cramer solve and determinant-to-column-norm rejection to AutoMovieSolidVector.solve3; this is not a conditioning or error certificate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Check finiteness, copy three columns and the right-hand side, then delegate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the shooting solver's prior finite and singular behavior without a clamp, damping term or alternate numeric policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and storage for the fixed three-by-three system.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One adapter serves both the linearized takeoff start and every Newton correction; the determinant algebra remains engine-owned.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Input rows and right-hand side are never mutated or retained; only fresh triples reach the engine solver, and only its fresh result escapes.
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
