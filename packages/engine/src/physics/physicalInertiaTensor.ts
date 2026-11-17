import type {
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * The inertia tensor of rigid parts about one point, in their common frame:
 * each part's principal tensor turned into that frame, `R diag(I) R^T`, plus
 * its mass moved to the point by the parallel-axis theorem, `m (|d|² E - d dᵀ)`
 * with `d` the part's centre less the point.
 *
 * The one owner of that sum in the engine: `combinePhysicalMassProperties`
 * reads it about the parts' combined centre, and the whole-body momentum of a
 * posed body (`resolveAutoMovieMomentum`) about the body's centre of mass. A
 * part may have zero principal moments, a point mass such as a held load; the
 * caller admits its inputs, since what counts as admissible differs between
 * them.
 *
 * @param parts The parts, each with its mass, centre and principal frame in the common frame.
 * @param about The point the tensor is taken about, in the common frame.
 * @returns The symmetric tensor, three rows of three, in the parts' mass and length units (kg m² for SI parts).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two terms of the sum, the frame, the units, the zero-moment part and who admits the inputs.
 * @evidence contracts/development/implementation.md#principled-implementation The rotation of a principal tensor into another frame, `R diag(I) R^T`, written as the sum over the principal axes `a_k` of `I_k a_k a_kᵀ`, and the parallel-axis (Huygens-Steiner) theorem for the shift of each part's mass to the point; both are exact, so the sum is the rigid assembly's tensor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One accumulation over the parts; the principal frame's axes are read once per part.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No input is clamped or skipped: a non-finite input yields a non-finite tensor that the caller's admission refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts: three axis rotations and nine entries per part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments with nothing to share between calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the returned rows are fresh.
 */
export function physicalInertiaTensor(
  parts: readonly IAutoMovieCombinePhysicalMassProperties.IPart[],
  about: IAutoMovieVector3,
): number[][] {
  const basis: IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  const axes: ("x" | "y" | "z")[] = ["x", "y", "z"];
  const tensor: number[][] = Array.from({ length: 3 }, (): number[] => [
    0, 0, 0,
  ]);
  for (const part of parts) {
    const rotated: IAutoMovieVector3[] = basis.map(
      (axis: IAutoMovieVector3): IAutoMovieVector3 =>
        Quaternion.rotateVector(part.inertiaRotation, axis),
    );
    const displacement: IAutoMovieVector3 = Vector3.subtract(
      part.centerOfMass,
      about,
    );
    for (let row: number = 0; row < 3; row++)
      for (let column: number = 0; column < 3; column++) {
        tensor[row]![column]! +=
          rotated.reduce(
            (
              sum: number,
              direction: IAutoMovieVector3,
              index: number,
            ): number =>
              sum +
              part.inertia[axes[index]!] *
                direction[axes[row]!] *
                direction[axes[column]!],
            0,
          ) +
          part.mass *
            ((row === column ? Vector3.dot(displacement, displacement) : 0) -
              displacement[axes[row]!] * displacement[axes[column]!]);
      }
  }
  return tensor;
}
