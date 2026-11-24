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
   * A joint's angles of a rotation in its chart.
   *
   * A joint whose locked axes lead its order (an elbow's adduction before its
   * flexion and twist, a knee's two before its flexion) moves only on `R_j(b)
   * R_k(c)`, or `R_k(c)`: its free angles are read on that family directly, the
   * locked ones zero. The last axis's image `R e_k` is turned about `e_j` by `b
   * = atan2(R e_k . (e_j x e_k), R e_k . e_k)`, since `R_j(b) e_k = cos b e_k +
   * sin b (e_j x e_k)`, and `c` is the twist about `e_k` of what is left,
   * `R_j(-b) R` (the swing-twist decomposition, Dobrowolski 2015, "Swing-twist
   * decomposition in Clifford algebra"). On the family this is the chart's own
   * reading; off it, it drops the locked turn the way the solver's position
   * pass removes it. Unlike the Tait-Bryan extraction, it has no singularity at
   * a quarter turn of the middle axis: an elbow flexed a right angle has its
   * middle axis there, where the extraction trades the locked first angle
   * against the twist and reads a locked turn of 120 degrees in a joint that
   * has none.
   *
   * Any other joint is read by the extraction, of the chart's two triples that
   * give the rotation (`(a, b, c)` and `(a + pi, pi - b, c + pi)`, each wrapped
   * into a turn about zero), the one nearest the joint's ranges: the least
   * summed distance of each angle from its free axis's range, or from zero for
   * a locked axis. A middle angle past a quarter turn, which the extraction
   * folds back, is then read as the rig composes it.
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
    const free: boolean[] = order.map(
      (axis: IAutoMoviePhysicalJointAxis["axis"]): boolean =>
        joint.axes.some((range: IRange): boolean => range.axis === axis),
    );
    const leading: number = free.indexOf(true);
    if (
      (leading === 1 || leading === 2) &&
      free.slice(leading).every((f: boolean): boolean => f)
    )
      return led(order, leading, rotation);
    const first: number[] = angles(order, rotation);
    const second: number[] = [
      wrap(first[0]! + Math.PI),
      wrap(Math.PI - first[1]!),
      wrap(first[2]! + Math.PI),
    ];
    const distance = (values: readonly number[]): number =>
      values.reduce((sum: number, value: number, at: number): number => {
        const range: IRange | undefined = joint.axes.find(
          (candidate: IRange): boolean => candidate.axis === order[at],
        );
        const low: number = range?.minimum ?? 0;
        const high: number = range?.maximum ?? 0;
        return sum + Math.max(0, low - value, value - high);
      }, 0);
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

  /**
   * The angles of a rotation on the family its free trailing axes span, the
   * `locked` leading ones zero (`nearest`).
   */
  function led(
    order: readonly IAutoMoviePhysicalJointAxis["axis"][],
    locked: number,
    rotation: IAutoMovieQuaternion,
  ): number[] {
    const k: IAutoMoviePhysicalJointAxis["axis"] = order[2]!;
    const out: number[] = [0, 0, 0];
    let rest: IAutoMovieQuaternion = rotation;
    if (locked === 1) {
      const j: IAutoMoviePhysicalJointAxis["axis"] = order[1]!;
      const aimed: IAutoMovieVector3 = Quaternion.rotateVector(
        rotation,
        UNIT[k],
      );
      const side: IAutoMovieVector3 = cross(UNIT[j], UNIT[k]);
      out[1] = Math.atan2(dot(aimed, side), dot(aimed, UNIT[k]));
      rest = Quaternion.multiply(turn(j, -out[1]!), rotation);
    }
    out[2] = wrap(2 * Math.atan2(rest[k], rest.w));
    return out;
  }

  /** The dot product of two vectors. */
  function dot(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /** The cross product of two vectors. */
  function cross(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

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
