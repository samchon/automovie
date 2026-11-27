import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";

import type { IAutoMovieRenderInspectionDiagnosticsProps } from "./IAutoMovieRenderInspectionDiagnosticsProps.js";

/** A witness-cube overlay kept across review pictures. */
export interface IAutoMovieRenderInspectionDiagnosticOverlay {
  /**
   * Render one picture with the sample's witness cubes and return the legend
   * entries drawn.
   */
  render(
    props: IAutoMovieRenderInspectionDiagnosticsProps,
  ): IAutoMovieInspectionLegendEntry[];

  /**
   * Release the kept cubes' geometry and materials. Calling it again does
   * nothing.
   */
  dispose(): void;
}
