import { IAutoMovieSurface } from "../scene/IAutoMovieSurface";

/**
 * A support surface and the logical space in which it can be used.
 *
 * Lowering hands the surface to the scene space generated for its logical
 * space, and its `surface.id` is the id that
 * {@link IAutoMovieBuiltEnvironment.walkable} lists and a `surface` support
 * locator cites.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the scene's own surface record, footprint and height rule, so a building support patch is evaluated by the same footprint and height functions a staged scene uses; validation runs the scene space validator over every building surface together with `walkable`.
 * @evidence contracts/common.md#clear-and-simple-design A pair of the owning logical space id and the unchanged scene surface, the same space-beside-thing shape `IAutoMovieBuiltPopulation` uses, with no building-specific surface fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lowering filters `walkable` per generated scene space by the surfaces that space owns rather than copying the whole list into each, and an unresolved space id is a validation error instead of a fallback space.
 * @evidence contracts/common.md#meaningful-documentation States where lowering puts the surface, which ids `walkable` and a support locator cite, and that the space id must resolve.
 * @author Samchon
 */
export interface IAutoMovieBuiltSurface {
  /** Logical space containing the support patch; it must resolve. */
  space: string;

  /**
   * The scene support patch itself, footprint and height rule, validated and
   * lowered unchanged; its `id` is unique among the environment's surfaces.
   */
  surface: IAutoMovieSurface;
}
