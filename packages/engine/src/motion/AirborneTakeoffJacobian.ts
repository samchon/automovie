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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Share the unchanged frame and angle factors, then write each tangent's derivatives directly into the solver's three rows.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing arithmetic and singular behavior without a tolerance, finite difference, clamp or fitted derivative.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(k) work with three output rows, no intermediate column arrays or transpose; one inverse and four trigonometric evaluations serve all k present tangents. The current shooting solver supplies three.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All columns use the same axes and endpoint angles, so their inverse and sine/cosine factors are computed once. Lazy initialization preserves empty and sparse inputs; neither the flight nor its derivative is reintegrated here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned numeric rows escape; input angles, axes and tangent arrays are read without mutation and no cache is held.
 */
export function AirborneTakeoffJacobian(
  end: solveAirborneTakeoff.IAngles,
  axes: IAutoMovieQuaternion,
  variations: readonly IAutoMovieVector3[],
): number[][] {
  const width: number = variations.length;
  const rows: number[][] = [[], [], []];
  let back: IAutoMovieQuaternion | undefined;
  let cosTwist: number = 0;
  let sinTwist: number = 0;
  let cosTilt: number = 0;
  let sinTilt: number = 0;
  variations.forEach((eta: IAutoMovieVector3, i: number): void => {
    if (back === undefined) {
      back = Quaternion.inverse(axes);
      cosTwist = Math.cos(end.twist);
      sinTwist = Math.sin(end.twist);
      cosTilt = Math.cos(end.tilt);
      sinTilt = Math.sin(end.tilt);
    }
    const v: IAutoMovieVector3 = Quaternion.rotateVector(back, eta);
    const phi: number = (cosTwist * v.x + sinTwist * v.z) / cosTilt;
    rows[0]![i] = phi;
    rows[1]![i] = -sinTwist * v.x + cosTwist * v.z;
    rows[2]![i] = v.y + sinTilt * phi;
  });

  // Indexed writes keep dense inputs packed. Extending afterward also
  // preserves any trailing holes that the original column maps skipped.
  rows[0]!.length = width;
  rows[1]!.length = width;
  rows[2]!.length = width;
  return rows;
}
