import type {
  IAutoMovieInspectionTrail,
  IAutoMovieMark,
} from "@automovie/interface";

import { AUTO_MOVIE_INSPECTION_KINDS } from "../../AUTO_MOVIE_INSPECTION_KINDS.js";

/** Legend entry of the trail kind. */
const TRAIL: { readonly label: string; readonly color: number } =
  AUTO_MOVIE_INSPECTION_KINDS.trail!;

/** Legend entry of the emphasised tick. */
const NOW: { readonly label: string; readonly color: number } =
  AUTO_MOVIE_INSPECTION_KINDS["trail/now"]!;

/**
 * Draw sampled trails as marks for one drawn second: each moving object's path
 * as a line through its samples with a tick at every sample, and the sample of
 * the drawn second emphasised.
 *
 * Per trail, at path `<object path>/trail`: a polyline of kind `trail` through
 * the samples in time order, a points mark of the same kind with one tick per
 * sample, and a points mark of kind `trail/now` at the sample whose second is
 * nearest `seconds`, the earlier one on a tie. A stationary trail has no line
 * and one tick. Both kinds are in world metres and unanchored.
 *
 * | Kind        | Label                       | Colour               |
 * | ----------- | --------------------------- | -------------------- |
 * | `trail`     | `trail`                     | Chocolate `d2691e`   |
 * | `trail/now` | `trail at the drawn second` | Dodger blue `1e90ff` |
 *
 * @param trails The trails, as `sampleAutoMovieInspectionTrails` returns them.
 * @param seconds The drawn film second.
 * @returns For each trail its line, when it moves, then its ticks, then its
 *   emphasised tick.
 */
export function markAutoMovieInspectionTrails(
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
    marks.push(
      {
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
      },
      {
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
      },
    );
  }
  return marks;
}
