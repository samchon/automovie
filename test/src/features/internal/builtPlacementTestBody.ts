import type { IAutoMovieBuiltPlacementBodyLocator } from "@automovie/interface";

/** Construct an element or population body locator for the placement query. */
export const builtPlacementTestBody = (
  kind: IAutoMovieBuiltPlacementBodyLocator["kind"],
  id: string,
): IAutoMovieBuiltPlacementBodyLocator =>
  kind === "element" ? { kind, id } : { kind, id };
