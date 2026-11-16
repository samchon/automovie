import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { solveAirborneTakeoff } from "./solveAirborneTakeoff";

/**
 * The endpoint angle Jacobian of a flight's integrated momentum tangents.
 *
 * For the requested frame's attitude Rx(phi) Rz(theta) Ry(psi), a body
 * rotation tangent v gives phi'=(cos(psi)v.x+sin(psi)v.z)/cos(theta),
 * theta'=-sin(psi)v.x+cos(psi)v.z and psi'=v.y+sin(theta)phi'.
 * The inverse of axes first carries the root-frame tangent into that frame.
 * This is the shooting solver's existing angle differential, factored from
 * its momentum search so it has one numeric owner.
 *
 * @param end Unwrapped endpoint angles in radians, in the requested frame.
 * @param axes The requested frame's unit orientation in the root frame.
 * @param variations Body-frame tangents per momentum direction, in input order.
 * @returns Three rows of angle derivatives per momentum direction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the angle factorization, differential, frames, column order and radians per momentum-unit result.
 * @evidence contracts/development/implementation.md#principled-implementation Analytically inverts the Euler-angle rate map of Rx(phi) Rz(theta) Ry(psi), after carrying tangents through the inverse frame; a near-singular tilt retains its original division and is not regularized.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Transform each tangent, form its three angle derivatives, then transpose columns to rows for the solver.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing arithmetic and singular behavior without a tolerance, finite difference, clamp or fitted derivative.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(k) work and numeric storage for k tangent directions; the current shooting solver supplies three.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the integrator's tangents and the solver's actual endpoint angles; neither the flight nor its derivative is reintegrated here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned numeric rows escape; input angles, axes and tangent arrays are read without mutation and no cache is held.
 */
export function AirborneTakeoffJacobian(
  end: solveAirborneTakeoff.IAngles,
  axes: IAutoMovieQuaternion,
  variations: readonly IAutoMovieVector3[],
): number[][] {
  const columns: number[][] = variations.map(
    (eta: IAutoMovieVector3): number[] => {
      const v: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(axes),
        eta,
      );
      const phi: number =
        (Math.cos(end.twist) * v.x + Math.sin(end.twist) * v.z) /
        Math.cos(end.tilt);
      return [
        phi,
        -Math.sin(end.twist) * v.x + Math.cos(end.twist) * v.z,
        v.y + Math.sin(end.tilt) * phi,
      ];
    },
  );
  return [0, 1, 2].map((i: number): number[] =>
    columns.map((column: number[]): number => column[i]!),
  );
}
