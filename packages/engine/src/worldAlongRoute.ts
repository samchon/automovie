import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/** Build one deterministic route-following instance placement. */
export const worldAlongRoute = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<
    IAutoMovieInstanceSetDesign["layout"],
    { kind: "along-route" }
  >,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
