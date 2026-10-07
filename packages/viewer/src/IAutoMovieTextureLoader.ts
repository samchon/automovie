import * as THREE from "three";

/**
 * Decode one project texture asset. Host-owned: the viewer has no I/O.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
 */
export type IAutoMovieTextureLoader = (asset: string) => Promise<THREE.Texture>;
