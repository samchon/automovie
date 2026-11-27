import type {
  AutoMovieBuiltinTexturePurpose,
  IAutoMovieMaterial,
  IAutoMovieRequiredMaterialTexturePurposes,
  IAutoMovieResolveMaterial,
} from "@automovie/interface";
import { requiredMaterialTexturePurposes as requiredTexturePurposesImplementation } from "./internal/requiredMaterialTexturePurposes";
import { resolveMaterial as resolveMaterialImplementation } from "./internal/resolveMaterial";

/** Public operations for Auto Movie Engine Render Material. */
export namespace AutoMovieEngineRenderMaterial {
  /**
   * Resolve one cross-model material id to one complete material definition.
   *
   * A model part resolves its material inside its own model. Simulated surfaces
   * carry only an id, so their lookup population is every compiled model instead.
   * Repeating an identical record under the same stable id is one definition;
   * repeating that id with any structural difference is an ambiguity and is
   * refused. Candidate and property order cannot affect either the result or the
   * diagnostic.
   */
  export function resolveMaterial(
    props: IAutoMovieResolveMaterial.IProps,
  ): IAutoMovieMaterial {
    return resolveMaterialImplementation(props);
  }

  /**
   * Resolve implicit lookup consumers from the material/light declarations used.
   * A radius builds its table even at zero. Overlay normal fallback is needed
   * only without a base/detail normal map. Rectangular lighting requires its two
   * tables only when a physically based surface is reachable in the same scope.
   * This lists roles and computes neither pixels nor byte estimates.
   */
  export function requiredTexturePurposes(
    props: IAutoMovieRequiredMaterialTexturePurposes.IProps,
  ): AutoMovieBuiltinTexturePurpose[] {
    return requiredTexturePurposesImplementation(props);
  }
}