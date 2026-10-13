import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/** Build one deterministic rectangular instance placement. */
export const worldGrid = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<IAutoMovieInstanceSetDesign["layout"], { kind: "grid" }>,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
