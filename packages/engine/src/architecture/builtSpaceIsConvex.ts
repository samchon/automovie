import { IAutoMovieBuiltSpace } from "@automovie/interface";

/**
 * Is the space's stated volume a single convex region?
 *
 * A caller deciding one rectangle against a convex region only has to test its
 * corners; against anything else the middle can fall through a notch, a void,
 * or the gap between two cells. This answers which of the two it is holding, so
 * the cheap test is taken exactly when it is exact.
 *
 * Only a celled space with exactly one cell answers true. A shell answers false
 * even when its triangles happen to bound a convex solid, and so does a space
 * that states no volume.
 *
 * @author Samchon
 */
export const builtSpaceIsConvex = (space: IAutoMovieBuiltSpace): boolean =>
  space.shell === undefined && space.cells.length === 1;
