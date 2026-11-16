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
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts: three axis rotations, nine shared moment-times-row products and nine entries per part. Scalar displacement coordinates need no vector record, and their norm is computed once; the row/column products and segment accumulation retain their original arithmetic association, including independently evaluating both off-diagonal orders. Spin consumes the same scalar entries without a one-element part array, copied part or tensor rows. Private consumers receive their tensor or velocity explicitly, avoiding one closure per assembly or spin.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Within one part, each moment-times-axis-row product serves all three columns and the squared displacement serves all three diagonal shifts. Assembly and spin share that component kernel, three immutable unit directions and their stateless consumers. Inputs are read anew on every call, so mutable caller records require no retained cache or invalidation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no caller data; the returned rows are fresh and explicit consumer contexts are borrowed only during synchronous component evaluation. Only three fixed unit-direction records and stateless functions live for the module lifetime.
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
  for (const part of parts)
    components(part, about, part.inertiaRotation, addTensor, tensor);
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
   * One operation's exact intrinsic-tensor readers for assembly and spin.
   * Both read actual current parts and return fresh numeric results.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States operation lifetime, current input reads and fresh results; spin documents its ordered array index.
   * @evidence contracts/development/design.md#principled-representation Assembly returns the common-frame SI tensor and spin its product with angular velocity; private intrinsic snapshots contain only moment/quaternion prerequisites.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The mass-model token consumes assembly and its interval reader consumes spin; each has separate exact last-frame slots so the two uses do not invalidate each other's prerequisites.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No body identity, target, time grid or exposed mutable cached tensor enters the surface; every input remains with the physical owner.
   */
  export type IPrepared = ((
    parts: readonly combinePhysicalMassProperties.IPart[],
    about: IAutoMovieVector3,
  ) => number[][]) & {
    /** Intrinsic momentum of the actual part at index, in its velocity's frame. Current array length bounds retained slots; invalid indices throw. */
    spin(
      parts: readonly combinePhysicalMassProperties.IPart[],
      index: number,
      rotation: IAutoMovieQuaternion,
      velocity: IAutoMovieVector3,
    ): IAutoMovieVector3;
  };

  /**
   * Prepare exact rotated intrinsic tensors for one assembly operation.
   *
   * Each reader snapshots only the last inertia and principal quaternion at
   * each part index. Mass, centre and reference point remain current inputs;
   * the parallel-axis term and part-order accumulation run on every call.
   * Release the reader with its physical planning operation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States cached intrinsic inputs, current shift inputs, exact numeric keys and operation ownership.
   * @evidence contracts/development/implementation.md#principled-implementation R diag(I) R transpose is independent of both part centre and reference point; caching its nine scalar entries preserves the original axis-product association before the unchanged parallel-axis addition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One last rotated tensor per ordered part feeds the same nine-entry accumulation; the ordinary tensor and spin paths retain their allocation-free scalar component kernel.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every changed inertia or quaternion coordinate recomputes its actual tensor, and every mass/centre/reference shift remains evaluated. No normalized-input shortcut, symmetric-entry copy, time key or tolerance is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(P) comparisons, shifts and ordered sums for P parts, with three axis rotations and nine row products only at changed intrinsic frames. Each call returns three fresh rows; retained scalar snapshots are O(P).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Object.is compares copied three-moment and four-quaternion coordinates at the same ordered part index, including signed zero and caller mutations. Mass and translation do not invalidate an intrinsic tensor because they do not enter it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one assembly slot and one spin slot per current part index, each holding a seven-scalar key and nine tensor entries; either reader truncates both populations when its parts array shrinks. No part, pose or result array is retained, and the enclosing mass-model owner drops the reader on release.
   */
  export function prepare(): IPrepared {
    const entries: (IRotated | undefined)[] = [];
    const spins: (IRotated | undefined)[] = [];
    const tensorAt: (
      parts: readonly combinePhysicalMassProperties.IPart[],
      about: IAutoMovieVector3,
    ) => number[][] = (
      parts: readonly combinePhysicalMassProperties.IPart[],
      about: IAutoMovieVector3,
    ): number[][] => {
      entries.length = parts.length;
      spins.length = Math.min(spins.length, parts.length);
      const tensor: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let i: number = 0; i < parts.length; i++) {
        const part: combinePhysicalMassProperties.IPart = parts[i]!;
        const value: IRotated = readRotated(entries, i, part.inertia, part.inertiaRotation);
        preparedComponents(part, about, value.tensor, addTensor, tensor);
      }
      return tensor;
    };
    return Object.assign(tensorAt, {
      spin: (
        parts: readonly combinePhysicalMassProperties.IPart[],
        index: number,
        rotation: IAutoMovieQuaternion,
        velocity: IAutoMovieVector3,
      ): IAutoMovieVector3 => {
        spins.length = parts.length;
        entries.length = Math.min(entries.length, parts.length);
        const part: combinePhysicalMassProperties.IPart | undefined = parts[index];
        if (!Number.isInteger(index) || index < 0 || part === undefined)
          throw new Error("A prepared intrinsic tensor needs an existing integer part index");
        const value: IRotated = readRotated(spins, index, part.inertia, rotation);
        return preparedComponents(part, part.centerOfMass, value.tensor, spinVector, velocity);
      },
    });
  }

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
      spinVector,
      velocity,
    );
  }
}

/** Last intrinsic tensor key and entries, with no part or caller record held. */
interface IRotated {
  moments: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  tensor: number[];
}

/** Share only identical moment/quaternion scalar dependencies at this part index. */
function readRotated(
  entries: (IRotated | undefined)[],
  index: number,
  moments: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
): IRotated {
  const known: IRotated | undefined = entries[index];
  if (
    known !== undefined &&
    Object.is(known.moments.x, moments.x) && Object.is(known.moments.y, moments.y) && Object.is(known.moments.z, moments.z) &&
    Object.is(known.rotation.x, rotation.x) && Object.is(known.rotation.y, rotation.y) &&
    Object.is(known.rotation.z, rotation.z) && Object.is(known.rotation.w, rotation.w)
  ) return known;
  const value: IRotated = rotated(moments, rotation);
  entries[index] = value;
  return value;
}

/** Apply all current parallel-axis terms before the same tensor or spin consumer. */
function preparedComponents<T, Context>(
  part: combinePhysicalMassProperties.IPart,
  about: IAutoMovieVector3,
  tensor: readonly number[],
  consume: Consume<T, Context>,
  context: Context,
): T {
  const x: number = part.centerOfMass.x - about.x;
  const y: number = part.centerOfMass.y - about.y;
  const z: number = part.centerOfMass.z - about.z;
  const squared: number = x * x + y * y + z * z;
  return consume(
    context,
    tensor[0]! + part.mass * (squared - x * x),
    tensor[1]! + part.mass * (0 - x * y),
    tensor[2]! + part.mass * (0 - x * z),
    tensor[3]! + part.mass * (0 - y * x),
    tensor[4]! + part.mass * (squared - y * y),
    tensor[5]! + part.mass * (0 - y * z),
    tensor[6]! + part.mass * (0 - z * x),
    tensor[7]! + part.mass * (0 - z * y),
    tensor[8]! + part.mass * (squared - z * z),
  );
}

/**
 * Prepare just the intrinsic portion, before any parallel-axis addition.
 * Its nine expressions retain the scalar kernel's independent row/column
 * products; caching them does not fold unequal off-diagonal rounding.
 */
function rotated(moments: IAutoMovieVector3, rotation: IAutoMovieQuaternion): IRotated {
  const a: IAutoMovieVector3 = Quaternion.rotateVector(rotation, BASIS_X);
  const b: IAutoMovieVector3 = Quaternion.rotateVector(rotation, BASIS_Y);
  const c: IAutoMovieVector3 = Quaternion.rotateVector(rotation, BASIS_Z);
  const ax: number = moments.x * a.x;
  const ay: number = moments.x * a.y;
  const az: number = moments.x * a.z;
  const bx: number = moments.y * b.x;
  const by: number = moments.y * b.y;
  const bz: number = moments.y * b.z;
  const cx: number = moments.z * c.x;
  const cy: number = moments.z * c.y;
  const cz: number = moments.z * c.z;
  return {
    moments: { x: moments.x, y: moments.y, z: moments.z },
    rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
    tensor: [
      0 + ax * a.x + bx * b.x + cx * c.x,
      0 + ax * a.y + bx * b.y + cx * c.y,
      0 + ax * a.z + bx * b.z + cx * c.z,
      0 + ay * a.x + by * b.x + cy * c.x,
      0 + ay * a.y + by * b.y + cy * c.y,
      0 + ay * a.z + by * b.z + cy * c.z,
      0 + az * a.x + bz * b.x + cz * c.x,
      0 + az * a.y + bz * b.y + cz * c.y,
      0 + az * a.z + bz * b.z + cz * c.z,
    ],
  };
}

/** A row-major scalar tensor consumer that needs no intermediate row arrays. */
type Consume<T, Context> = (
  context: Context,
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

/** Add one part in model order to this call's exclusively owned tensor. */
function addTensor(
  tensor: number[][],
  xx: number,
  xy: number,
  xz: number,
  yx: number,
  yy: number,
  yz: number,
  zx: number,
  zy: number,
  zz: number,
): undefined {
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
}

/** Borrow the interval's velocity and return the original three row products. */
function spinVector(
  velocity: IAutoMovieVector3,
  xx: number,
  xy: number,
  xz: number,
  yx: number,
  yy: number,
  yz: number,
  zx: number,
  zy: number,
  zz: number,
): IAutoMovieVector3 {
  return {
    x: (0 + xx) * velocity.x + (0 + xy) * velocity.y + (0 + xz) * velocity.z,
    y: (0 + yx) * velocity.x + (0 + yy) * velocity.y + (0 + yz) * velocity.z,
    z: (0 + zx) * velocity.x + (0 + zy) * velocity.y + (0 + zz) * velocity.z,
  };
}

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
function components<T, Context>(
  part: combinePhysicalMassProperties.IPart,
  about: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  consume: Consume<T, Context>,
  context: Context,
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
    context,
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
