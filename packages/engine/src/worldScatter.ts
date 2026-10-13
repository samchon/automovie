import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/** Build one deterministic disk-scatter instance placement. */
export const worldScatter = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<IAutoMovieInstanceSetDesign["layout"], { kind: "scatter" }>,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
