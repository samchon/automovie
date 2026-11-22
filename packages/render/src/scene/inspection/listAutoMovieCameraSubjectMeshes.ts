import {
  Camera,
  Line,
  Material,
  Mesh,
  Object3D,
  Points,
  ShaderMaterial,
  Sprite,
} from "three";

import { AutoMovieSkinnedMesh } from "../AutoMovieSkinnedMesh.js";
import { readAutoMovieDisplayedBox } from "./readAutoMovieDisplayedBox.js";

/**
 * List the drawables of a required subject whose current geometry the CPU can read.
 *
 * Admits two vertex paths. A rigid `Mesh` keeps the stock pre-render callbacks,
 * has no position morphs and no material that moves vertices on the GPU, so
 * its buffer positions times its world matrix are what the delivery draws. An
 * `AutoMovieSkinnedMesh` with a stock surface whose shader matches its
 * skinning method reads posed positions from the skin's own CPU evaluation,
 * which agrees with the GPU blend within the mesh's stated float32 tolerance.
 *
 * @param target Resolved displayed root of the required subject.
 * @param camera Delivery camera; only objects on its layers are drawn by it.
 * @returns Every visible drawable mesh of the subject, or undefined when one
 * visible drawable has a vertex path the CPU cannot reproduce. An empty list
 * means the subject draws no mesh.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the admitted vertex paths, the layer and visibility scope, and the undefined and empty outcomes.
 * @evidence contracts/development/implementation.md#principled-implementation Visibility, layers and the vertex program decide what the delivery draws; the stock rigid path is buffer positions under the world matrix, and the owned skin reproduces its shader blend on the CPU (AutoMovieSkinnedMesh), admitted only with the matching stock shader through readAutoMovieDisplayedBox.supportsStockMaterial.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One admission shared by subject bounds and the near-plane clip measurement, so framing and clipping judge the same geometry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Lines, points, sprites, instanced, batched and foreign skinned meshes, morphs, shader materials and displacement are refused rather than approximated.
 * @evidence contracts/development/implementation.md#efficient-algorithms One traversal of the target's visible descendants with constant work per object; no vertex is read.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The list reflects the current visibility and material state and is not cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new array of borrowed meshes and retains nothing.
 */
export function listAutoMovieCameraSubjectMeshes(
  target: Object3D,
  camera: Camera,
): Mesh[] | undefined {
  const meshes: Mesh[] = [];
  let supported: boolean = true;
  target.traverseVisible((object: Object3D): void => {
    if (!supported || !object.layers.test(camera.layers)) return;
    if (!(object instanceof Mesh)) {
      if (
        object instanceof Line ||
        object instanceof Points ||
        object instanceof Sprite
      )
        supported = false;
      return;
    }
    if (
      object.geometry.getAttribute("position") === undefined ||
      object.onAfterRender !== Object3D.prototype.onAfterRender
    ) {
      supported = false;
      return;
    }

    // The owned skin's CPU pose matches only its own admitted shader route.
    if (object instanceof AutoMovieSkinnedMesh) {
      if (readAutoMovieDisplayedBox.supportsStockMaterial(object))
        meshes.push(object);
      else supported = false;
      return;
    }
    if (
      object.constructor !== Mesh ||
      object.onBeforeRender !== Object3D.prototype.onBeforeRender ||
      object.geometry.morphAttributes.position?.length ||
      !keepsVertices(object.material)
    ) {
      supported = false;
      return;
    }
    meshes.push(object);
  });
  return supported ? meshes : undefined;
}

/** Shader hooks and vertex displacement can move vertices away from the buffer. */
function keepsVertices(input: Material | Material[]): boolean {
  const materials: Material[] = Array.isArray(input) ? input : [input];
  return materials.every(
    (material: Material): boolean =>
      !(material instanceof ShaderMaterial) &&
      material.onBeforeCompile === Material.prototype.onBeforeCompile &&
      material.onBeforeRender === Material.prototype.onBeforeRender &&
      (!("displacementMap" in material) || material.displacementMap === null),
  );
}
