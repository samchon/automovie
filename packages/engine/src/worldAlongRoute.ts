import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/** Copy a compact instance design with an authored along-route layout. */
export const worldAlongRoute: (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: { kind: "along-route"; route: string; lateralJitter: number },
) => IAutoMovieInstanceSetDesign = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<
    IAutoMovieInstanceSetDesign["layout"],
    { kind: "along-route" }
  >,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
