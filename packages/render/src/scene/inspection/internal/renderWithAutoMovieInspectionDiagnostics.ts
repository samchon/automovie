import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";

import type { IAutoMovieRenderInspectionDiagnosticOverlay } from "../../IAutoMovieRenderInspectionDiagnosticOverlay.js";
import type { IAutoMovieRenderInspectionDiagnosticsProps } from "../../IAutoMovieRenderInspectionDiagnosticsProps.js";
import { createAutoMovieInspectionDiagnosticOverlay } from "./createAutoMovieInspectionDiagnosticOverlay.js";

/*
 * Render one review picture with translucent red wire cubes for confirmed
 * errors and amber cubes for possible errors.
 *
 * A one-shot use of `createAutoMovieInspectionDiagnosticOverlay`: the cubes are
 * built for this picture and released before returning, including on render
 * failure.
 * Parameter props: The review scene, draw callback, actual draw raster, stroke
 * width and optional placed diagnostics.
 * Returns: Legend entries for the kinds of witnesses drawn.
 */
export function renderWithAutoMovieInspectionDiagnostics(
  props: IAutoMovieRenderInspectionDiagnosticsProps,
): IAutoMovieInspectionLegendEntry[] {
  const overlay: IAutoMovieRenderInspectionDiagnosticOverlay =
    createAutoMovieInspectionDiagnosticOverlay();
  try {
    return overlay.render(props);
  } finally {
    overlay.dispose();
  }
}
