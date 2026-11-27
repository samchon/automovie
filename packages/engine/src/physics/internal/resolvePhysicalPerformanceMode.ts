import type { IAutoMoviePerformanceMode } from "@automovie/interface";

/*
 * Resolve an explicit scene policy and optional body override without
 * content-name defaults.
 */
export function resolvePhysicalPerformanceMode(
  scene: IAutoMoviePerformanceMode,
  body?: IAutoMoviePerformanceMode,
): IAutoMoviePerformanceMode {
  const selected: IAutoMoviePerformanceMode = body ?? scene;
  if (
    selected.kind === "exaggerated" &&
    (selected.impulse <= 0 ||
      selected.compliance <= 0 ||
      selected.gravity < 0 ||
      !selected.reason.trim())
  )
    throw new Error(
      "Exaggerated performance requires positive factors and a reason",
    );
  return structuredClone(selected);
}
