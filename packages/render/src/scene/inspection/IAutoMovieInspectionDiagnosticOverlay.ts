import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";

import type { IRenderAutoMovieInspectionDiagnosticsProps } from "./IRenderAutoMovieInspectionDiagnosticsProps.js";

/**
 * A witness-cube overlay kept across review pictures.
 *
 * @evidence contracts/development/design.md#principled-representation A live resource with one draw call per picture and one release.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Viewer draws through it every painted frame; a one-shot capture uses `renderWithAutoMovieInspectionDiagnostics`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The overlay is attached only while the picture renders, so no observation or other pass sees it.
 * @evidence contracts/development/common.md#meaningful-documentation States what it holds and when it is attached.
 */
export interface IAutoMovieInspectionDiagnosticOverlay {
  /** Render one picture with the sample's witness cubes and return the legend entries drawn. */
  render(
    props: IRenderAutoMovieInspectionDiagnosticsProps,
  ): IAutoMovieInspectionLegendEntry[];

  /** Release the kept cubes' geometry and materials. Calling it again does nothing. */
  dispose(): void;
}
