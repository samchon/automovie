import type { IAutoMoviePerformanceMode } from "@automovie/interface";

/**
 * Resolve an explicit scene policy and optional body override without
 * content-name defaults.
 */
export function resolvePhysicalPerformanceMode(
  scene: IAutoMoviePerformanceMode,
  body?: IAutoMoviePerformanceMode,
): IAutoMoviePerformanceMode {
  const selected: IAutoMoviePerformanceMode = body ?? scene;
  if (
    !selected ||
    !["kinematic", "simulated", "exaggerated"].includes(selected.kind)
  )
    throw new Error("Invalid physical performance policy");
  if (
    selected.kind === "exaggerated" &&
    (![selected.impulse, selected.compliance].every(
      (value: number): boolean => Number.isFinite(value) && value > 0,
    ) ||
      !Number.isFinite(selected.gravity) ||
      selected.gravity < 0 ||
      typeof selected.reason !== "string" ||
      !selected.reason.trim())
  )
    throw new Error(
      "Exaggerated performance requires explicit finite factors and a reason",
    );
  return structuredClone(selected);
}
