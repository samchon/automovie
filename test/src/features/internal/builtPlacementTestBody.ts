import type { AutoMovieBuiltPlacementBodyLocator } from "@automovie/interface";

/** Construct an element or population body locator for the placement query. */
export const builtPlacementTestBody = (
  kind: AutoMovieBuiltPlacementBodyLocator["kind"],
  id: string,
): AutoMovieBuiltPlacementBodyLocator =>
  kind === "element" ? { kind, id } : { kind, id };
