import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";

import type { IAutoMovieInspectionDiagnosticOverlay } from "./IAutoMovieInspectionDiagnosticOverlay.js";
import type { IRenderAutoMovieInspectionDiagnosticsProps } from "./IRenderAutoMovieInspectionDiagnosticsProps.js";
import { createAutoMovieInspectionDiagnosticOverlay } from "./createAutoMovieInspectionDiagnosticOverlay.js";

/**
 * Render one review picture with translucent red wire cubes for confirmed errors and amber cubes for possible errors.
 *
 * A one-shot use of `createAutoMovieInspectionDiagnosticOverlay`: the cubes are
 * built for this picture and released before returning, including on render
 * failure.
 *
 * @param props The review scene, draw callback, actual draw raster, stroke width and optional placed diagnostics.
 * @returns Legend entries for the kinds of witnesses drawn.
 * @evidence contracts/development/common.md#meaningful-documentation States that the picture's cubes are built and released within the call.
 * @evidence contracts/development/implementation.md#principled-implementation Draws through the shared overlay so a capture and the Viewer place the same cubes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Create, render, dispose.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The release runs even when the render throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One build per picture, suited to a still that is drawn once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the overlay and the caller's one render.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing built for the picture outlives the call.
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
