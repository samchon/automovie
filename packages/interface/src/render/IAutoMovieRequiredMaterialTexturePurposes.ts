import type { IAutoMovieMaterial } from "../material/IAutoMovieMaterial";

/**
 * Declarations that require implicit material/light lookup textures.
 *
 * @evidence contracts/development/design.md#principled-representation Material features and reachable rectangular lighting select lookup roles, independent of image dimensions or allocation identities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Borrowed materials and two explicit booleans are sufficient for the deduplicated role list.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A declared subsurface radius requires its lookup even at zero; the returned roles do not certify actual allocation or bytes.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish default physically based surfaces, authored records and area-light presence with no implicit boolean defaults.
 */
export namespace IAutoMovieRequiredMaterialTexturePurposes {
  /**
   * Resolve implicit lookup consumers from the material/light declarations used.
   * A radius builds its table even at zero. Overlay normal fallback is needed
   * only without a base/detail normal map. Rectangular lighting requires its two
   * tables only when a physically based surface is reachable in the same scope.
   * This lists roles and computes neither pixels nor byte estimates.
   */
  export type IProps = {
    /** Borrowed physically based materials actually used; scanned synchronously, not retained. */
    materials: readonly IAutoMovieMaterial[];
    /** Whether a drawn default physically based material is reachable; required, no default. */
    defaultPbr: boolean;
    /** Whether rectangular lights exist in the same scope; required, no default. */
    areaLights: boolean;
  };
}
