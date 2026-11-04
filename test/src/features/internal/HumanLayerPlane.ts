import { HumanAnatomy } from "./HumanAnatomy";

type V3 = HumanAnatomy.V3;
type V2 = [number, number];

const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * A cutting plane with an orthonormal chart, the frame in which a layer's
 * section is read as a planar polygon.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 */
export namespace HumanLayerPlane {
  /** A cutting plane with an orthonormal chart, `u x v = normal`. */
  export interface IPlane {
    /** A point of the plane, mm. */
    origin: V3;

    /** Unit normal. */
    normal: V3;

    /** First chart axis, unit, in the plane. */
    u: V3;

    /** Second chart axis, `normal x u`. */
    v: V3;
  }

  /**
   * A plane through a point with a normal.
   *
   * The chart's first axis is the given direction made orthogonal to the
   * normal, so a chart follows the layer's own frame and its readings keep the
   * same orientation from person to person.
   *
   * @param origin A point of the plane, mm.
   * @param normal The plane's normal; need not be a unit vector.
   * @param direction The direction the chart's first axis follows.
   */
  export function chart(origin: V3, normal: V3, direction: V3): IPlane {
    const n: V3 = A.unit(normal);
    const u: V3 = A.unit(A.reject(direction, n));

    return { origin, normal: n, u, v: A.cross(n, u) };
  }

  /**
   * Chart coordinates of a world point; its distance from the plane is dropped.
   *
   * @param plane The plane.
   * @param p A world point, mm.
   */
  export function local(plane: IPlane, p: V3): V2 {
    const d: V3 = A.sub(p, plane.origin);

    return [A.dot(d, plane.u), A.dot(d, plane.v)];
  }

  /**
   * World point of chart coordinates.
   *
   * @param plane The plane.
   * @param q Chart coordinates, mm.
   */
  export function world(plane: IPlane, q: V2): V3 {
    return A.add(plane.origin, A.add(A.scale(plane.u, q[0]), A.scale(plane.v, q[1])));
  }
}
