import type { IAutoMovieMaterialWear } from "@automovie/interface";
import * as THREE from "three";

import { applyMaterialWear as applyMaterialWearImplementation } from "./internal/applyMaterialWear.js";

/** Operations that prepare geometry and material for authored surface wear. */
export namespace AutoMovieRenderWearShading {
  /** Worn geometry and its edge-distance data texture; caller owns both. */
  export interface IAppliedMaterialWear {
    /** Non-indexed copy of the input geometry with attributes for edge wear. */
    geometry: THREE.BufferGeometry;
    /** Edge distances sampled by the wear shader. */
    texture: THREE.DataTexture;
  }

  /** Measure feature edges, prepare worn geometry and install its shader patch. */
  export const apply: (
    geometry: THREE.BufferGeometry,
    material: THREE.MeshStandardMaterial,
    wear: IAutoMovieMaterialWear,
  ) => IAppliedMaterialWear = (
    geometry: THREE.BufferGeometry,
    material: THREE.MeshStandardMaterial,
    wear: IAutoMovieMaterialWear,
  ): IAppliedMaterialWear =>
    applyMaterialWearImplementation(geometry, material, wear);
}
