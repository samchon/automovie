import { Camera, Material, Mesh, Object3D } from "three";

import { AutoMovieThreeKind } from "../../AutoMovieThreeKind.js";
import { hasMaterialDisplacement } from "./hasMaterialDisplacement.js";
import { readAutoMovieDisplayedBox } from "./readAutoMovieDisplayedBox.js";

/**
 * List the drawables of a required subject whose current geometry the CPU can
 * read.
 *
 * Admits two vertex paths. A rigid `Mesh` keeps the stock pre-render callbacks,
 * has no position morphs and no material that moves vertices on the GPU, so its
 * buffer positions times its world matrix are what the delivery draws. An
 * `AutoMovieSkinnedMesh` with a stock surface whose shader matches its skinning
 * method reads posed positions from the skin's own CPU evaluation, which agrees
 * with the GPU blend within the mesh's stated float32 tolerance.
 *
 * @param target Resolved displayed root of the required subject.
 * @param camera Delivery camera; only objects on its layers are drawn by it.
 * @returns Every visible drawable mesh of the subject, or undefined when one
 *   visible drawable has a vertex path the CPU cannot reproduce. An empty list
 *   means the subject draws no mesh.
 */
export function listAutoMovieCameraSubjectMeshes(
  target: Object3D,
  camera: Camera,
): Mesh[] | undefined {
  const meshes: Mesh[] = [];
  let supported: boolean = true;
  target.traverseVisible((object: Object3D): void => {
    if (!supported || !object.layers.test(camera.layers)) return;
    if (!AutoMovieThreeKind.isMesh(object)) {
      if (
        AutoMovieThreeKind.isLine(object) ||
        AutoMovieThreeKind.isPoints(object) ||
        AutoMovieThreeKind.isSprite(object)
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
    if (AutoMovieThreeKind.isAutoMovieSkinnedMesh(object)) {
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
  const materials: Material[] = [input].flat();
  return materials.every(
    (material: Material): boolean =>
      !AutoMovieThreeKind.isShaderMaterial(material) &&
      material.onBeforeCompile === Material.prototype.onBeforeCompile &&
      material.onBeforeRender === Material.prototype.onBeforeRender &&
      !hasMaterialDisplacement(material),
  );
}
