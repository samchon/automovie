import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";

/**
 * A joint's sequential chart: the relative rotation as an intrinsic Tait-Bryan
 * composition `q = R_i(a) R_j(b) R_k(c)` about three distinct joint-frame axes
 * in a declared order, each angle the coordinate of its axis. The decomposition
 * is Shoemake's (1994, "Euler Angle Conversion", Graphics Gems IV): with `M`
 * the rotation's matrix and `s` +1 for a cyclic order and -1 otherwise, `sin b
 * = s M[i][k]`, `a = atan2(-s M[j][k], M[k][k])` and `c = atan2(-s M[i][j],
 * M[i][i])`; at `cos b = 0` the first and last axes align and the whole turn is
 * given to the first.
 */
export namespace AutoMoviePhysicalJointChart {
  /**
   * The three angles of a rotation in the order's chart.
   *
   * @param order Three distinct joint-frame axes, in composition order.
   * @param rotation A unit quaternion.
   * @returns The angles about `order[0]`, `order[1]` and `order[2]`, radians.
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
   * A joint's angles of a rotation, of the chart's two triples that give it
   * (`(a, b, c)` and `(a + pi, pi - b, c + pi)`, each wrapped into a turn about
   * zero), the one nearest the joint's ranges: the least summed distance of
   * each angle from its free axis's range, or from zero for a locked axis. A
   * middle angle past a quarter turn, which the extraction folds back, is then
   * read as the rig composes it. An angle and the same angle a whole turn
   * either way are one rotation, so each is read at the turn nearest its
   * range: a half turn on a range ending at -pi reads -pi, whichever sign the
   * extraction's rounding gave it.
   *
   * @param joint The joint's chart and free axes.
   * @param rotation A unit quaternion.
   * @returns The angles, in the chart's order, radians.
   * @throws {Error} When the joint declares no chart.
   */
  export function nearest(
    joint: AutoMoviePhysicalJointChart.IJoint,
    rotation: IAutoMovieQuaternion,
  ): number[] {
    if (joint.order === undefined)
      throw new Error("A joint without a chart has no chart angles");
    const order: readonly IAutoMoviePhysicalJointAxis["axis"][] = joint.order;
    const excess = (value: number, at: number): number => {
      const range: IRange | undefined = joint.axes.find(
        (candidate: IRange): boolean => candidate.axis === order[at],
      );
      const low: number = range?.minimum ?? 0;
      const high: number = range?.maximum ?? 0;
      return Math.max(0, low - value, value - high);
    };
    const turn: number = 2 * Math.PI;
    const nearestTurn = (values: readonly number[]): number[] =>
      values.map((value: number, at: number): number =>
        [value - turn, value + turn].reduce(
          (best: number, candidate: number): number =>
            excess(candidate, at) < excess(best, at) ? candidate : best,
          value,
        ),
      );
    const first: number[] = nearestTurn(angles(order, rotation));
    const second: number[] = nearestTurn([
      wrap(first[0]! + Math.PI),
      wrap(Math.PI - first[1]!),
      wrap(first[2]! + Math.PI),
    ]);
    const distance = (values: readonly number[]): number =>
      values.reduce(
        (sum: number, value: number, at: number): number =>
          sum + excess(value, at),
        0,
      );
    return distance(second) < distance(first) ? second : first;
  }

  /**
   * The rotation of three angles in the order's chart.
   *
   * @param order Three distinct joint-frame axes, in composition order.
   * @param values The angles about them, radians.
   * @returns The unit quaternion `R_order[0] R_order[1] R_order[2]`.
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
   * each axis turned by the rotations composed before it, the joint's motion
   * subspace at that configuration.
   *
   * @param order Three distinct joint-frame axes, in composition order.
   * @param values The rotation's angles, as `angles` reads them.
   * @returns Each axis's current direction, in `order`'s order.
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

  /**
   * What a chart reading needs of a joint: its free axes' ranges and its chart,
   * when it declares one (`IAutoMoviePhysicalJoint`).
   */
  export interface IJoint {
    /** The free axes and their ranges, radians. */
    axes: readonly IRange[];

    /** The chart's composition order; none for a joint without a chart. */
    order?: readonly IAutoMoviePhysicalJointAxis["axis"][];
  }

  /** A free axis and its range, radians. */
  export type IRange = Pick<
    IAutoMoviePhysicalJointAxis,
    "axis" | "minimum" | "maximum"
  >;

  /** An angle wrapped into (-pi, pi]. */
  function wrap(angle: number): number {
    const turn: number = 2 * Math.PI;
    const value: number = angle - turn * Math.round(angle / turn);
    return value <= -Math.PI ? value + turn : value;
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
  const UNIT: Readonly<
    Record<IAutoMoviePhysicalJointAxis["axis"], IAutoMovieVector3>
  > = {
    x: { x: 1, y: 0, z: 0 },
    y: { x: 0, y: 1, z: 0 },
    z: { x: 0, y: 0, z: 1 },
  };
}
