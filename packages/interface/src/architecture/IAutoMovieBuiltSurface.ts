import { IAutoMovieSurface } from "../scene/IAutoMovieSurface";

/**
 * A support surface and the logical space in which it can be used.
 *
 * Lowering hands the surface to the scene space generated for its logical
 * space, and its `surface.id` is the id that
 * {@link IAutoMovieBuiltEnvironment.walkable} lists and a `surface` support
 * locator cites.
 */
export interface IAutoMovieBuiltSurface {
  /** Logical space containing the support patch; it must resolve. */
  space: string;

  /** Existing deterministic support/height representation. */
  surface: IAutoMovieSurface;
}
