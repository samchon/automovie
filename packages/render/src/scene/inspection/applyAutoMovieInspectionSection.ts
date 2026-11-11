import type { IAutoMovieSectionPlane } from "@automovie/engine";
import type * as THREE from "three";

import type { IAutoMovieSectionRenderer } from "../IAutoMovieSectionRenderer.js";
import { applyAutoMovieSectionPlanes } from "../applyAutoMovieSectionPlanes.js";

/**
 * Cut every material of a scene by one section plane, and return the call that puts each material's clipping state and the renderer's clipping switch back as they were.
 *
 * The plane owner, `applyAutoMovieSectionPlanes`, overwrites each material's planes and intersection flag and switches the renderer's local clipping on, so the prior state of every material under the scene is recorded first. A material whose plane count changes back is marked for recompilation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is cut, who owns the cut, what is recorded and put back and when a material is recompiled.
 * @evidence contracts/development/implementation.md#principled-implementation Restoring recorded state rather than defaults keeps planes a film set on its own materials, and three.js compiles clipping into a program by plane count, so a change of count needs a recompile.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Record, cut, and return the restore.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every material is recorded by identity, so one shared by many meshes is put back once.
 * @evidence contracts/development/implementation.md#efficient-algorithms One traversal to record and one by the plane owner; the restore is linear in the materials.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The cut itself is the section plane owner's.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The record of prior state lives until the returned call runs; nothing is allocated on the GPU.
 */
export function applyAutoMovieInspectionSection(props: {
  /** The scene to cut. */
  scene: THREE.Scene;

  /** The renderer whose local clipping the cut needs. */
  renderer: IAutoMovieSectionRenderer;

  /** The half-space cut away. */
  section: IAutoMovieSectionPlane;
}): () => void {
  const enabled: boolean = props.renderer.localClippingEnabled;
  const clipping: Map<
    THREE.Material,
    { planes: THREE.Plane[] | null; intersection: boolean }
  > = new Map<
    THREE.Material,
    { planes: THREE.Plane[] | null; intersection: boolean }
  >();
  props.scene.traverse((object: THREE.Object3D): void => {
    const material: THREE.Material | THREE.Material[] | undefined = (
      object as Partial<Pick<THREE.Mesh, "material">>
    ).material;
    if (material === undefined) return;
    for (const one of Array.isArray(material) ? material : [material])
      if (!clipping.has(one))
        clipping.set(one, {
          planes: one.clippingPlanes,
          intersection: one.clipIntersection,
        });
  });
  applyAutoMovieSectionPlanes({
    renderer: props.renderer,
    root: props.scene,
    planes: [props.section],
  });
  return (): void => {
    for (const [material, prior] of clipping) {
      if ((material.clippingPlanes?.length ?? 0) !== (prior.planes?.length ?? 0))
        material.needsUpdate = true;
      material.clippingPlanes = prior.planes;
      material.clipIntersection = prior.intersection;
    }
    props.renderer.localClippingEnabled = enabled;
  };
}
