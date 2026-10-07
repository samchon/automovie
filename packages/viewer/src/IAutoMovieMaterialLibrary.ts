import type * as THREE from "three";

/**
 * A shot-owned table of model-declared materials lent to non-model drawables.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves named simulated-surface bindings through the same declared material records as model parts.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Keeps material identity, texture state, and runtime ownership explicit at the render boundary.
 * @author Samchon
 */
export interface IAutoMovieMaterialLibrary {
  /**
   * Return the one built material selected by an id, or `undefined` for the
   * renderer-owned default selected by `null`.
   *
   * The returned object remains owned by this library. A surface builder may
   * borrow it but must not dispose it.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves a named surface to its declared material without hiding an unresolved id behind a fallback.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Supplies one deterministic runtime material for each admitted identity.
   */
  resolve: (material: string | null) => THREE.Material | undefined;

  /**
   * Release every material built by this library, exactly once.
   *
   * Texture instances remain owned by the shot texture cache and are released
   * separately, after the materials that refer to them.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Releases viewer-owned runtime materials at the shot lifetime boundary.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Keeps derived material disposal local to the runtime that built it.
   */
  dispose: () => void;
}
