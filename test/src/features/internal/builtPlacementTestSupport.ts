import type { AutoMovieBuiltPlacementSupportLocator } from "@automovie/interface";


/** Construct the stated support locator without changing its kind. */
export const builtPlacementTestSupport = (
  kind: AutoMovieBuiltPlacementSupportLocator["kind"],
  id: string,
): AutoMovieBuiltPlacementSupportLocator => {
  switch (kind) {
    case "element":
      return { kind, id };
    case "population":
      return { kind, id };
    case "surface":
      return { kind, id };
  }
};
