import type {
  IAutoMovieInspectionTrail,
  IAutoMovieMark,
} from "@automovie/interface";

import { AutoMovieRenderInspectionKinds } from "../../AutoMovieRenderInspectionKinds";

/*
 * Draw sampled trails as marks for one drawn second: each moving object's path
 * as a line through its samples with a tick at every sample, and the sample of
 * the drawn second emphasised.
 *
 * Per trail, at path `<object path>/trail`: a polyline of kind `trail` through
 * the samples in time order, a points mark of the same kind with one tick per
 * sample, and a points mark of kind `trail/now` at the sample whose second is
 * nearest `seconds`, the earlier one on a tie. A stationary trail has no line
 * and one tick. When the drawn second belongs to a segment with an authored
 * route, that route is a separate world polyline of kind trail/route. The
 * route comes from the source, while ticks come from placed origins.
 *
 * | Kind        | Label                       | Colour               |
 * | ----------- | --------------------------- | -------------------- |
 * | `trail`     | `trail`                     | Chocolate `d2691e`   |
 * | `trail/now` | `trail at the drawn second` | Dodger blue `1e90ff` |
 * Parameter trails: The trails, as `sampleInspectionTrails` returns them.
 * Parameter seconds: The drawn film second.
 * Returns: For each trail its line, when it moves, then its ticks, then its
 * emphasised tick.
 */
export function markInspectionTrails(
  trails: readonly IAutoMovieInspectionTrail[],
  seconds: number,
): IAutoMovieMark[] {
  const marks: IAutoMovieMark[] = [];
  for (const trail of trails) {
    const path: string = trail.path === "" ? "trail" : `${trail.path}/trail`;
    let nearest: number = 0;
    trail.times.forEach((time: number, i: number): void => {
      if (Math.abs(time - seconds) < Math.abs(trail.times[nearest]! - seconds))
        nearest = i;
    });
    const route = trail.motion?.route;
    if (route !== undefined && trail.times[nearest] === seconds)
      marks.push({
        path: path + "/route",
        kind: "trail/route",
        label: ROUTE.label,
        color: ROUTE.color,
        shape: {
          type: "polyline",
          points: route.points.flatMap(({ x, y, z }) => [x, y, z]),
          closed: false,
        },
        flagged: false,
        anchor: null,
      });
    if (!trail.stationary)
      marks.push({
        path,
        kind: "trail",
        label: TRAIL.label,
        color: TRAIL.color,
        shape: { type: "polyline", points: trail.positions, closed: false },
        flagged: false,
        anchor: null,
      });
    marks.push({
      path,
      kind: "trail",
      label: TRAIL.label,
      color: TRAIL.color,
      shape: {
        type: "points",
        points: trail.stationary
          ? trail.positions.slice(0, 3)
          : trail.positions,
      },
      flagged: false,
      anchor: null,
    });
    if (
      seconds >= trail.times[0]! &&
      seconds <= trail.times[trail.times.length - 1]!
    )
      marks.push({
        path,
        kind: "trail/now",
        label: NOW.label,
        color: NOW.color,
        shape: {
          type: "points",
          points: trail.positions.slice(nearest * 3, nearest * 3 + 3),
        },
        flagged: false,
        anchor: null,
      });
  }
  return marks;
}

/*
 * Legend entry of the trail kind.
 */
const TRAIL: { readonly label: string; readonly color: number } =
  AutoMovieRenderInspectionKinds.trail!;

/*
 * Legend entry of the emphasised tick.
 */
const NOW: { readonly label: string; readonly color: number } =
  AutoMovieRenderInspectionKinds["trail/now"]!;

const ROUTE: { readonly label: string; readonly color: number } =
  AutoMovieRenderInspectionKinds["trail/route"]!;
