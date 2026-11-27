import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";

/**
 * Whether applying an inspection changes scene state that a placed observation
 * reads.
 *
 * `applyAutoMovieInspection` takes unselected objects off their layers
 * (`parts`, `hide`, `surface` off), overrides materials (`shade` other than
 * beauty, `color`), adds mark geometry to its overlay group (`marks`, `trail`)
 * and gives materials a clipping plane (`section`). An inspection with none of
 * these leaves only its empty overlay group and its screen-space labels, which
 * no observer reads, so the scene it leaves can be observed as placed.
 *
 * @param inspection The inspection of a request.
 * @returns True when the scene must be restored before an observation.
 */
export function changesAutoMovieObservedScene(
  inspection: IAutoMovieCapturePlanRequest["inspection"],
): boolean {
  return (
    inspection.parts.length !== 0 ||
    inspection.hide.length !== 0 ||
    !inspection.surface ||
    inspection.shade !== "beauty" ||
    inspection.color.length !== 0 ||
    inspection.marks.length !== 0 ||
    inspection.trail.length !== 0 ||
    inspection.section !== null
  );
}
