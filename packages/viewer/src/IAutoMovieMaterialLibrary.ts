import type * as THREE from "three";

/**
 * A shot-owned table of model-declared materials lent to non-model drawables.
 *
 * @author Samchon
 */
export interface IAutoMovieMaterialLibrary {
  /**
   * Return the one built material selected by an id, or `undefined` for the
   * renderer-owned default selected by `null`.
   *
   * The returned object remains owned by this library. A surface builder may
   * borrow it but must not dispose it.
   */
  resolve: (material: string | null) => THREE.Material | undefined;

  /**
   * Release every material built by this library, exactly once.
   *
   * Texture instances remain owned by the shot texture cache and are released
   * separately, after the materials that refer to them.
   */
  dispose: () => void;
}
