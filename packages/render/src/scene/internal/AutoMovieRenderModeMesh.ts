import * as THREE from "three";

/*
 * Names the mesh projection carrying one material or a material group during
 * pass overrides.
 */
export type AutoMovieRenderModeMesh = THREE.Mesh & {
  /*
   * Original or temporary material slots, restored by the pass handle.
   */
  material: THREE.Material | THREE.Material[];
};
