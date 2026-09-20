import { IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * Is the space's stated volume a single convex region?
 *
 * A caller deciding one rectangle against a convex region only has to test its
 * corners; against anything else the middle can fall through a notch, a void,
 * or the gap between two cells. This answers which of the two it is holding, so
 * the cheap test is taken exactly when it is exact.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtSpaceIsConvex` answers "Is the space's stated volume a single convex region?" This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtSpaceIsConvex` performs space-convexity test when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const builtSpaceIsConvex = (space: IAutoMovieBuiltSpace): boolean =>
  space.shell === undefined && space.cells.length === 1;
