import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/** Copy a compact instance design with an authored disk-scatter layout. */
export const worldScatter: (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: { kind: "scatter"; radius: number },
) => IAutoMovieInstanceSetDesign = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<IAutoMovieInstanceSetDesign["layout"], { kind: "scatter" }>,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
