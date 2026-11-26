import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";

import type { IAutoMovieInspectionDiagnosticOverlay } from "../IAutoMovieInspectionDiagnosticOverlay.js";
import type { IRenderAutoMovieInspectionDiagnosticsProps } from "../IRenderAutoMovieInspectionDiagnosticsProps.js";
import { createAutoMovieInspectionDiagnosticOverlay } from "./createAutoMovieInspectionDiagnosticOverlay.js";

/**
 * Render one review picture with translucent red wire cubes for confirmed
 * errors and amber cubes for possible errors.
 *
 * A one-shot use of `createAutoMovieInspectionDiagnosticOverlay`: the cubes are
 * built for this picture and released before returning, including on render
 * failure.
 *
 * @param props The review scene, draw callback, actual draw raster, stroke
 *   width and optional placed diagnostics.
 * @returns Legend entries for the kinds of witnesses drawn.
 */
export function renderWithAutoMovieInspectionDiagnostics(
  props: IRenderAutoMovieInspectionDiagnosticsProps,
): IAutoMovieInspectionLegendEntry[] {
  const overlay: IAutoMovieInspectionDiagnosticOverlay =
    createAutoMovieInspectionDiagnosticOverlay();
  try {
    return overlay.render(props);
  } finally {
    overlay.dispose();
  }
}
