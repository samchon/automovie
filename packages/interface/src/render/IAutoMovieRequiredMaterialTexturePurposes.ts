import type { IAutoMovieMaterial } from "../material/IAutoMovieMaterial";

/** Declarations that require implicit material/light lookup textures. */
export namespace IAutoMovieRequiredMaterialTexturePurposes {
  /**
   * Resolve implicit lookup consumers from the material/light declarations
   * used. A radius builds its table even at zero. Overlay normal fallback is
   * needed only without a base/detail normal map. Rectangular lighting requires
   * its two tables only when a physically based surface is reachable in the
   * same scope. This lists roles and computes neither pixels nor byte
   * estimates.
   */
  export type IProps = {
    /**
     * Borrowed physically based materials actually used; scanned synchronously,
     * not retained.
     */
    materials: readonly IAutoMovieMaterial[];
    /**
     * Whether a drawn default physically based material is reachable; required,
     * no default.
     */
    defaultPbr: boolean;
    /** Whether rectangular lights exist in the same scope; required, no default. */
    areaLights: boolean;
  };
}
