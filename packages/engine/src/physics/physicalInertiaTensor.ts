import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { combinePhysicalMassProperties } from "./combinePhysicalMassProperties";

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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar component kernel serves both assembly and a single part's spin. Three principal-axis rotations feed nine explicit entries; one consumer per part accumulates them into the result without nested callbacks or dynamic coordinate keys.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No input is clamped or skipped: a non-finite input yields a non-finite tensor that the caller's admission refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts: three axis rotations, nine shared moment-times-row products and nine entries per part. Scalar displacement coordinates need no vector record, and their norm is computed once; the row/column products and segment accumulation retain their original arithmetic association, including independently evaluating both off-diagonal orders. Spin consumes the same scalar entries without a one-element part array, copied part or tensor rows.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Within one part, each moment-times-axis-row product serves all three columns and the squared displacement serves all three diagonal shifts. Assembly and spin share that component kernel and three immutable unit directions. Inputs are read anew on every call, so mutable caller records require no retained cache or invalidation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no caller data; the returned rows are fresh, and the accumulator closure dies with the call. Only three fixed unit-direction records live for the module lifetime.
 */
export function physicalInertiaTensor(
  parts: readonly combinePhysicalMassProperties.IPart[],
  about: IAutoMovieVector3,
): number[][] {
  const tensor: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const add: Consume<undefined> = (
    xx: number,
    xy: number,
    xz: number,
    yx: number,
    yy: number,
    yz: number,
    zx: number,
    zy: number,
    zz: number,
  ): undefined => {
    tensor[0]![0]! += xx;
    tensor[0]![1]! += xy;
    tensor[0]![2]! += xz;
    tensor[1]![0]! += yx;
    tensor[1]![1]! += yy;
    tensor[1]![2]! += yz;
    tensor[2]![0]! += zx;
    tensor[2]![1]! += zy;
    tensor[2]![2]! += zz;
    return undefined;
  };
  for (const part of parts) components(part, about, part.inertiaRotation, add);
  return tensor;
}

/**
 * Scalar consumers of the same rotated principal tensor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The spin member states the principal rotation, angular velocity, frame, units and preserved non-finite propagation.
 * @evidence contracts/development/design.md#principled-representation Spin returns the intrinsic angular momentum I omega of one rigid part in the same frame as its principal rotation and angular velocity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The momentum reduction consumes spin at each segment's interpolated principal frame without allocating a copied part or tensor merely to multiply it once.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the assembly function's scalar component kernel instead of introducing another tensor rotation, a different dot association or a normalized-input shortcut.
 */
export namespace physicalInertiaTensor {
  /**
   * A rigid part's intrinsic angular momentum at its supplied principal
   * rotation, in the angular velocity's frame, kg m²/s for SI inputs.
   *
   * The caller supplies the unit principal-to-common rotation and angular velocity
   * in radians per second. This reads the same nine entries as assembling
   * that part about its own centre and applying the result, preserving the
   * initial-zero accumulation and each row's left-to-right dot product.
   * The centre subtraction remains present to preserve non-finite input
   * propagation. Admission remains with the caller as in tensor assembly.
   * The result retains neither the part nor the velocity.
   */
  export function spin(
    part: combinePhysicalMassProperties.IPart,
    rotation: IAutoMovieQuaternion,
    velocity: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return components(
      part,
      part.centerOfMass,
      rotation,
      (
        xx: number,
        xy: number,
        xz: number,
        yx: number,
        yy: number,
        yz: number,
        zx: number,
        zy: number,
        zz: number,
      ): IAutoMovieVector3 => ({
        x:
          (0 + xx) * velocity.x + (0 + xy) * velocity.y + (0 + xz) * velocity.z,
        y:
          (0 + yx) * velocity.x + (0 + yy) * velocity.y + (0 + yz) * velocity.z,
        z:
          (0 + zx) * velocity.x + (0 + zy) * velocity.y + (0 + zz) * velocity.z,
      }),
    );
  }
}

/** A row-major scalar tensor consumer that needs no intermediate row arrays. */
type Consume<T> = (
  xx: number,
  xy: number,
  xz: number,
  yx: number,
  yy: number,
  yz: number,
  zx: number,
  zy: number,
  zz: number,
) => T;

/** Immutable canonical columns, read only by pure quaternion rotation. */
const BASIS_X: Readonly<IAutoMovieVector3> = { x: 1, y: 0, z: 0 };

/** The second immutable canonical column. */
const BASIS_Y: Readonly<IAutoMovieVector3> = { x: 0, y: 1, z: 0 };

/** The third immutable canonical column. */
const BASIS_Z: Readonly<IAutoMovieVector3> = { x: 0, y: 0, z: 1 };

/**
 * Read one part's nine entries with the same association as tensor assembly.
 * The consumer runs once and retains no part or scratch owned by this call.
 */
function components<T>(
  part: combinePhysicalMassProperties.IPart,
  about: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  consume: Consume<T>,
): T {
  const a: IAutoMovieVector3 = Quaternion.rotateVector(rotation, BASIS_X);
  const b: IAutoMovieVector3 = Quaternion.rotateVector(rotation, BASIS_Y);
  const c: IAutoMovieVector3 = Quaternion.rotateVector(rotation, BASIS_Z);
  const x: number = part.centerOfMass.x - about.x;
  const y: number = part.centerOfMass.y - about.y;
  const z: number = part.centerOfMass.z - about.z;
  const squared: number = x * x + y * y + z * z;

  // In I_k a_k[row] a_k[column], the first product is identical for every
  // column. Sharing it preserves the original left-associated product.
  const ax: number = part.inertia.x * a.x;
  const ay: number = part.inertia.x * a.y;
  const az: number = part.inertia.x * a.z;
  const bx: number = part.inertia.y * b.x;
  const by: number = part.inertia.y * b.y;
  const bz: number = part.inertia.y * b.z;
  const cx: number = part.inertia.z * c.x;
  const cy: number = part.inertia.z * c.y;
  const cz: number = part.inertia.z * c.z;

  // Keep the initial zero and the x/y/z sum order from the axis reduction.
  // Off-diagonal orders are independent because their rounding can differ.
  return consume(
    0 + ax * a.x + bx * b.x + cx * c.x + part.mass * (squared - x * x),
    0 + ax * a.y + bx * b.y + cx * c.y + part.mass * (0 - x * y),
    0 + ax * a.z + bx * b.z + cx * c.z + part.mass * (0 - x * z),
    0 + ay * a.x + by * b.x + cy * c.x + part.mass * (0 - y * x),
    0 + ay * a.y + by * b.y + cy * c.y + part.mass * (squared - y * y),
    0 + ay * a.z + by * b.z + cy * c.z + part.mass * (0 - y * z),
    0 + az * a.x + bz * b.x + cz * c.x + part.mass * (0 - z * x),
    0 + az * a.y + bz * b.y + cz * c.y + part.mass * (0 - z * y),
    0 + az * a.z + bz * b.z + cz * c.z + part.mass * (squared - z * z),
  );
}
