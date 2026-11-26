import type {
  IAutoMovieMark,
  IAutoMovieMarkBalance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { convexHull2D } from "../math/internal/convexHull2D";
import { resolveAutoMovieCenterOfMass } from "./resolveAutoMovieCenterOfMass";

/**
 * Turn a body's balance at one instant into inspection marks: the centre of
 * mass, or the extrapolated centre the caller balances on, as a point, and the
 * base of support as the polygon around the support points on the floor plane.
 *
 * The base of support is the convex hull of the support points in the
 * horizontal XZ plane, as `resolveAutoMovieCenterOfMass.margin` measures
 * balance on it, drawn as a closed polyline through the hull's points at their
 * own heights; one support point is drawn as a point and two as a segment. The
 * centre is flagged when its margin of stability on that base is negative, that
 * is when it lies outside the base.
 *
 * | Kind      | Label             | Colour          | Path             |
 * | --------- | ----------------- | --------------- | ---------------- |
 * | `com`     | `centre of mass`  | Olive `6b8e23`  | `<path>/com`     |
 * | `support` | `base of support` | Sienna `a0522d` | `<path>/support` |
 *
 * Both are in world metres and unanchored. It throws when there is no support
 * point.
 *
 * @param props.path The body's path, which the marks extend.
 * @param props.centre The centre the caller balances on, world metres: the
 *   centre of mass of `resolveAutoMovieCenterOfMass.place`, or its
 *   extrapolation by `resolveAutoMovieCenterOfMass.extrapolate` (Hof 2005).
 * @param props.support The support contact points, world metres.
 * @returns The centre's mark, then the base's.
 */
export function markAutoMovieBalance(
  props: IAutoMovieMarkBalance.IProps,
): IAutoMovieMark[] {
  if (props.support.length === 0)
    throw new Error("markAutoMovieBalance: there is no support point");
  const hull: IAutoMovieVector3[] = convexHull2D(props.support);
  const margin: number = resolveAutoMovieCenterOfMass.margin(
    props.centre,
    props.support,
  );
  const points: number[] = hull.flatMap(
    (point: IAutoMovieVector3): number[] => [point.x, point.y, point.z],
  );
  return [
    {
      path: `${props.path}/com`,
      kind: "com",
      label: "centre of mass",
      color: 0x6b8e23,
      shape: {
        type: "points",
        points: [props.centre.x, props.centre.y, props.centre.z],
      },
      flagged: margin < 0,
      anchor: null,
    },
    {
      path: `${props.path}/support`,
      kind: "support",
      label: "base of support",
      color: 0xa0522d,
      shape:
        hull.length === 1
          ? { type: "points", points }
          : hull.length === 2
            ? { type: "segments", points }
            : { type: "polyline", points, closed: true },
      flagged: false,
      anchor: null,
    },
  ];
}
