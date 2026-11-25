import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";

import type { IRenderAutoMovieInspectionDiagnosticsProps } from "./IRenderAutoMovieInspectionDiagnosticsProps.js";

/** A witness-cube overlay kept across review pictures. */
export interface IAutoMovieInspectionDiagnosticOverlay {
  /**
   * Render one picture with the sample's witness cubes and return the legend
   * entries drawn.
   */
  render(
    props: IRenderAutoMovieInspectionDiagnosticsProps,
  ): IAutoMovieInspectionLegendEntry[];

  /**
   * Release the kept cubes' geometry and materials. Calling it again does
   * nothing.
   */
  dispose(): void;
}
