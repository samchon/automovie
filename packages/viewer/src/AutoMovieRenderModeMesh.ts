import * as THREE from "three";

/**
 * Names the mesh projection carrying one material or a material group during pass overrides.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Names the mesh projection carrying one material or a material group during pass overrides.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Names the mesh projection carrying one material or a material group during pass overrides.
 */
export type AutoMovieRenderModeMesh = THREE.Mesh & {
  material: THREE.Material | THREE.Material[];
};
