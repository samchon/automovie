import type { IAutoMovieModel } from "@automovie/interface";

import type { AutoMovieTextureCache } from "./AutoMovieTextureCache";

/**
 * Model definitions, requested identities and the shot's texture owner used to
 * lower borrowed surface materials. Resolution admits the complete requested
 * identity set before constructing any runtime materials.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Supplies the declared model population and explicit surface material identities resolved by the library.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Separates immutable material definitions from the texture cache supplied by the shot runtime.
 * @author Samchon
 */
export interface IBuildAutoMovieMaterialLibraryProps {
  /**
   * Caller-owned compiled models searched for each requested material. Equal
   * declarations may repeat; conflicting definitions are refused, not ordered.
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Supplies the full definition population used to detect missing or conflicting material identities.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Keeps definition resolution independent of model order.
   */
  models: readonly IAutoMovieModel[];

  /**
   * Material ids requested by borrowing surfaces; null uses their renderer-owned
   * default. Blank ids refuse, and repeated ids are constructed only once.
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Preserves explicit named material requests and the null default alternative.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Defines the identities shared across borrowing surfaces by this library.
   */
  materialIds: Iterable<string | null>;

  /**
   * Shot-owned cache primed before construction; omission is supported only
   * when the requested definitions have no texture bindings. The library
   * borrows its resolver and never disposes this cache.
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Retains texture ownership with the supplying shot rather than the borrowed material library.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Keeps texture lifetime separate from disposal of derived materials.
   */
  textures?: AutoMovieTextureCache;
}
