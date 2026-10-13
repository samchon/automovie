import type { IAutoMoviePropRelation } from "@automovie/interface";

/** An `in-space` relation naming one logical space. */
export const inSpace = (
  space: string,
  environment = "house",
): IAutoMoviePropRelation => ({
  kind: "in-space",
  target: { kind: "space", environment, space },
});
