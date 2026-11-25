import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/** Copy a compact instance design with an authored rectangular-grid layout. */
export const worldGrid: (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: {
    kind: "grid";
    rows: number;
    columns: number;
    spacing: { x: number; z: number };
  },
) => IAutoMovieInstanceSetDesign = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<IAutoMovieInstanceSetDesign["layout"], { kind: "grid" }>,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
