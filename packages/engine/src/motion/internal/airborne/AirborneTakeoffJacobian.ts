import type {
  IAutoMovieQuaternion,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../../math/Quaternion";

/*
 * The endpoint angle Jacobian of a flight's integrated momentum tangents.
 *
 * For the requested frame's attitude Rx(phi) Rz(theta) Ry(psi), a body rotation
 * tangent v gives phi'=(cos(psi)v.x+sin(psi)v.z)/cos(theta),
 * theta'=-sin(psi)v.x+cos(psi)v.z and psi'=v.y+sin(theta)phi'. The inverse of
 * axes first carries the root-frame tangent into that frame. This is the
 * shooting solver's existing angle differential, factored from its momentum
 * search so it has one numeric owner.
 * Parameter end: Unwrapped endpoint angles in radians, in the requested frame.
 * Parameter axes: The requested frame's unit orientation in the root frame.
 * Parameter variations: Body-frame tangents per momentum direction, in input order.
 * Returns: Three rows of angle derivatives per momentum direction.
 */
export function AirborneTakeoffJacobian(
  end: IAutoMovieSolveAirborneTakeoff.IAngles,
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
