import type {
  IAutoMovieMaterialOverlay,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/*
 * Admit optional overlay lists: their count, strength and optional numeric
 * factors.
 */
export function validateMaterialOverlays(
  overlays: readonly IAutoMovieMaterialOverlay[] | undefined,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  if (overlays === undefined) return;
  if (overlays.length > MAXIMUM_OVERLAYS)
    collector.push(
      "range",
      path,
      `a material carries at most ${MAXIMUM_OVERLAYS} overlays, but has ${overlays.length}`,
      overlays.length,
    );
  overlays.forEach(
    (overlay: IAutoMovieMaterialOverlay, index: number): void => {
      const at: string = `${path}[${index}]`;
      collector.range(
        `${at}.strength`,
        overlay.strength,
        0,
        1,
        "overlay strength",
      );
      if (overlay.roughness !== undefined)
        collector.range(
          `${at}.roughness`,
          overlay.roughness,
          0,
          1,
          "overlay roughness",
        );
      if (overlay.colorFactor !== undefined)
        for (const channel of ["r", "g", "b"] as const)
          collector.range(
            `${at}.colorFactor.${channel}`,
            overlay.colorFactor[channel],
            0,
            Infinity,
            "overlay colour factor",
          );
      if (overlay.normalScale !== undefined)
        collector.range(
          `${at}.normalScale`,
          overlay.normalScale,
          0,
          Infinity,
          "overlay normal scale",
        );
    },
  );
}

/*
 * The most overlays one material may carry: each samples up to two images.
 */
const MAXIMUM_OVERLAYS: number = 4;
