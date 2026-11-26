import { type IAutoMovieEnvironment, type IAutoMovieEnvironmentRecipe, type IAutoMovieEnvironmentModule, type IAutoMovieEnvironmentModel, type IAutoMovieTerrainRecipe } from "@automovie/interface";
import { createEnvironment as createEnvironmentImplementation } from "./internal/createEnvironment";
import { environmentModel as environmentModelImplementation } from "./internal/environmentModel";
import { createTerrain as createTerrainImplementation } from "./terrain/internal/createTerrain";

/** Public operations for Auto Movie Environment. */
export namespace AutoMovieEnvironment {
  /**
   * Place typed modules and prepare the stage and runtime pieces a shot uses.
   *
   * Item keys are stable within the recipe. References address an item's origin
   * or its named anchors. Each module is evaluated once after its inputs resolve.
   * Emitted arrays keep source item order even when a reference is forward.
   *
   * @param recipe Named items, optional seed and optional rigid world frame.
   * @returns The stage set and space, compile runtime records, architectural
   *   records, named world frames and the support of every set piece, judged
   *   against the merged space, the other pieces, the walls furnishing relations
   *   hung pieces on and each building's own sweep at its placement height.
   * @throws For malformed identity or placement, missing or cyclic references,
   *   conflicting emitted identities or invalid support or prop declarations.
   */
  export function create(recipe: IAutoMovieEnvironmentRecipe): IAutoMovieEnvironment {
    return createEnvironmentImplementation(recipe);
  }

  /**
   * Offer a supplied model as a reusable environment module.
   *
   * @param input Model and optional locally authored anchors, support and prop
   *   facts.
   * @returns A definition that places those records in the scope and frame
   *   assigned by the composer.
   */
  export function model(input: IAutoMovieEnvironmentModel): IAutoMovieEnvironmentModule {
    return environmentModelImplementation(input);
  }

  /**
   * Create a world-aligned terrain module with named placement and route frames.
   *
   * The module origin is its southwest plan corner. Resolve building elevations
   * independently before placing pads or paths at those building frames. The
   * returned support surfaces and world pieces use the same heights and area.
   * Material regions replace the parent patch within their footprints. A cut
   * excludes ground in both outputs, and still water uses its own nonwalkable
   * patch. An optional tree disk produces a compact instance recipe, and an
   * optional wood an explicit one whose trees each clear those features.
   *
   * @param recipe Extent, optional relief and features in module-local metres.
   * @returns A definition to place in a composed environment.
   */
  export function terrain(recipe: IAutoMovieTerrainRecipe): IAutoMovieEnvironmentModule {
    return createTerrainImplementation(recipe);
  }
}
