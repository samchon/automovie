import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";

import type { IAutoMovieRenderInspectionDiagnosticOverlay } from "../../IAutoMovieRenderInspectionDiagnosticOverlay";
import type { IAutoMovieRenderInspectionDiagnosticsProps } from "../../IAutoMovieRenderInspectionDiagnosticsProps";
import { createInspectionDiagnosticOverlay } from "./createInspectionDiagnosticOverlay";

/*
 * Render one review picture with translucent red wire cubes for confirmed
 * errors and amber cubes for possible errors.
 *
 * A one-shot use of `createInspectionDiagnosticOverlay`: the cubes are
 * built for this picture and released before returning, including on render
 * failure.
 * Parameter props: The review scene, draw callback, actual draw raster, stroke
 * width and optional placed diagnostics.
 * Returns: Legend entries for the kinds of witnesses drawn.
 */
export function renderWithInspectionDiagnostics(
  props: IAutoMovieRenderInspectionDiagnosticsProps,
): IAutoMovieInspectionLegendEntry[] {
  const overlay: IAutoMovieRenderInspectionDiagnosticOverlay =
    createInspectionDiagnosticOverlay();
  try {
    return overlay.render(props);
  } finally {
    overlay.dispose();
  }
}
