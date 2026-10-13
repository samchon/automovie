import { IAutoMovieSurface } from "../scene/IAutoMovieSurface";

/**
 * A support surface and the logical space in which it can be used.
 *
 * Lowering hands the surface to the scene space generated for its logical
 * space, and its `surface.id` is the id that
 * {@link IAutoMovieBuiltEnvironment.walkable} lists and a `surface` support
 * locator cites.
 *
 * @evidence contracts/common.md#principled-implementation Pairs an existing scene support surface with a logical-space id; lowering groups surfaces by that id into one scene space per logical space, and the scene space validator checks the surface itself.
 * @evidence contracts/common.md#clear-and-simple-design Reusing `IAutoMovieSurface` avoids a second footprint and height-rule format, and the wrapper adds only the one ownership field the building record needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The surface's own rules, such as a height rule stated once, are enforced by the scene validator instead of being restated here, and no surface id is treated specially.
 * @evidence contracts/common.md#meaningful-documentation States the owning space and that it must resolve, which id walkable lists and support locators cite, and where lowering places the surface.
 */
export interface IAutoMovieBuiltSurface {
  /** Logical space containing the support patch; it must resolve. */
  space: string;

  /** Existing deterministic support/height representation. */
  surface: IAutoMovieSurface;
}
