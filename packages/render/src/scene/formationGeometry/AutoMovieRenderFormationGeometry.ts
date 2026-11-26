import type * as THREE from "three";
import { instancedModelParts as instancedModelPartsImplementation } from "../internal/instancedModelParts.js";

/** Public operations for Auto Movie Render Formation Geometry. */
export namespace AutoMovieRenderFormationGeometry {
  /**
   * Rigid parts of a built runtime model, in the one order instancing indexes.
   *
   * The merged instance geometry stamps each vertex with its part index and the
   * cycle bake writes one matrix row per part, so the two have to walk the model
   * the same way or every member wears another member's arm. They walk it here.
   */
  export function instancedModelParts(root: THREE.Object3D): THREE.Mesh[] {
    return instancedModelPartsImplementation(root);
  }
}
