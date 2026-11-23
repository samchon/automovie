import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";

/**
 * A joint's sequential chart: the relative rotation as an intrinsic
 * Tait-Bryan composition `q = R_i(a) R_j(b) R_k(c)` about three distinct
 * joint-frame axes in a declared order, each angle the coordinate of its
 * axis. The decomposition is Shoemake's (1994, "Euler Angle Conversion",
 * Graphics Gems IV): with `M` the rotation's matrix and `s` +1 for a cyclic
 * order and -1 otherwise, `sin b = s M[i][k]`, `a = atan2(-s M[j][k],
 * M[k][k])` and `c = atan2(-s M[i][j], M[i][i])`; at `cos b = 0` the first
 * and last axes align and the whole turn is given to the first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the composition, the decomposition, its source and the aligned case.
 * @evidence contracts/development/design.md#principled-representation A namespace over an axis order and a unit quaternion; angles in radians.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by projectPhysicalJointRotation and the articulated solve's axis columns.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The order is the profile's own; nothing is assumed.
 */
export namespace AutoMoviePhysicalJointChart {
  /**
   * The three angles of a rotation in the order's chart.
   *
   * @param order Three distinct joint-frame axes, in composition order.
   * @param rotation A unit quaternion.
   * @returns The angles about `order[0]`, `order[1]` and `order[2]`, radians.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the output's order and units.
   * @evidence contracts/development/implementation.md#principled-implementation Shoemake 1994 Tait-Bryan extraction from the rotation matrix, with the aligned case resolved onto the first axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Matrix, parity, three atan2 readings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A repeated axis throws instead of picking one.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array; retains nothing.
   */
  export function angles(
    order: readonly IAutoMoviePhysicalJointAxis["axis"][],
    rotation: IAutoMovieQuaternion,
  ): number[] {
    const [i, j, k]: number[] = indices(order);
    const m: number[][] = matrix(rotation);
    const s: number = (j! - i! + 3) % 3 === 1 ? 1 : -1;
    const sine: number = Math.max(-1, Math.min(1, s * m[i!]![k!]!));
    const b: number = Math.asin(sine);
    const cosine: number = Math.sqrt(
      m[i!]![i!]! * m[i!]![i!]! + m[i!]![j!]! * m[i!]![j!]!,
    );
    if (cosine > 1e-12)
      return [
        Math.atan2(-s * m[j!]![k!]!, m[k!]![k!]!),
        b,
        Math.atan2(-s * m[i!]![j!]!, m[i!]![i!]!),
      ];
    return [Math.atan2(s * m[k!]![j!]!, m[j!]![j!]!), b, 0];
  }

  /**
   * The rotation of three angles in the order's chart.
   *
   * @param order Three distinct joint-frame axes, in composition order.
   * @param values The angles about them, radians.
   * @returns The unit quaternion `R_order[0] R_order[1] R_order[2]`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the composition.
   * @evidence contracts/development/implementation.md#principled-implementation Three axis-angle quaternions multiplied in order, the rig's own composition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh quaternion; retains nothing.
   */
  export function compose(
    order: readonly IAutoMoviePhysicalJointAxis["axis"][],
    values: readonly number[],
  ): IAutoMovieQuaternion {
    return order.reduce(
      (
        q: IAutoMovieQuaternion,
        axis: IAutoMoviePhysicalJointAxis["axis"],
        at: number,
      ): IAutoMovieQuaternion =>
        Quaternion.multiply(q, turn(axis, values[at]!)),
      { x: 0, y: 0, z: 0, w: 1 },
    );
  }

  /**
   * The unit vectors of the chart's axes at a rotation, in the joint frame:
   * each axis turned by the rotations composed before it, the joint's
   * motion subspace at that configuration.
   *
   * @param order Three distinct joint-frame axes, in composition order.
   * @param values The rotation's angles, as `angles` reads them.
   * @returns Each axis's current direction, in `order`'s order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each vector is and its frame.
   * @evidence contracts/development/implementation.md#principled-implementation For q = R_i(a) R_j(b) R_k(c), dq/dt carries a about e_i, b about R_i(a) e_j and c about R_i(a) R_j(b) e_k.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One running product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh vectors; retains nothing.
   */
  export function directions(
    order: readonly IAutoMoviePhysicalJointAxis["axis"][],
    values: readonly number[],
  ): IAutoMovieVector3[] {
    const result: IAutoMovieVector3[] = [];
    let q: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
    order.forEach(
      (axis: IAutoMoviePhysicalJointAxis["axis"], at: number): void => {
        result.push(Quaternion.rotateVector(q, UNIT[axis]));
        q = Quaternion.multiply(q, turn(axis, values[at]!));
      },
    );
    return result;
  }

  /** The rotation by an angle about a joint-frame axis. */
  function turn(
    axis: IAutoMoviePhysicalJointAxis["axis"],
    angle: number,
  ): IAutoMovieQuaternion {
    const half: number = angle / 2;
    const s: number = Math.sin(half);
    return {
      x: axis === "x" ? s : 0,
      y: axis === "y" ? s : 0,
      z: axis === "z" ? s : 0,
      w: Math.cos(half),
    };
  }

  /** The order's axis indices; a repeated or missing axis throws. */
  function indices(
    order: readonly IAutoMoviePhysicalJointAxis["axis"][],
  ): number[] {
    const result: number[] = order.map(
      (axis: IAutoMoviePhysicalJointAxis["axis"]): number =>
        axis === "x" ? 0 : axis === "y" ? 1 : 2,
    );
    if (result.length !== 3 || new Set(result).size !== 3)
      throw new Error("A joint chart needs three distinct axes");
    return result;
  }

  /** A unit quaternion's rotation matrix, row-major, rotating column vectors. */
  function matrix(q: IAutoMovieQuaternion): number[][] {
    const { x, y, z, w }: IAutoMovieQuaternion = q;
    return [
      [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
      [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
      [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ];
  }

  /** The joint-frame unit axes. */
  const UNIT: Readonly<Record<IAutoMoviePhysicalJointAxis["axis"], IAutoMovieVector3>> = {
    x: { x: 1, y: 0, z: 0 },
    y: { x: 0, y: 1, z: 0 },
    z: { x: 0, y: 0, z: 1 },
  };
}
