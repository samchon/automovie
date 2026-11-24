import type { IAutoMovieSectionPlane } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieSectionRenderer } from "../IAutoMovieSectionRenderer.js";
import { applyAutoMovieSectionPlanes } from "../applyAutoMovieSectionPlanes.js";

/**
 * Cut every material of a scene by one section plane, and return the call that
 * puts each material's clipping state and the renderer's clipping switch back
 * as they were.
 *
 * The plane owner, `applyAutoMovieSectionPlanes`, overwrites each material's
 * planes and intersection flag and switches the renderer's local clipping on,
 * so the prior state of every material under the scene is recorded first. A
 * material whose plane count changes back is marked for recompilation.
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
    for (const one of [material].flat())
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
      if (
        (material.clippingPlanes?.length ?? 0) !== (prior.planes?.length ?? 0)
      )
        material.needsUpdate = true;
      material.clippingPlanes = prior.planes;
      material.clipIntersection = prior.intersection;
    }
    props.renderer.localClippingEnabled = enabled;
  };
}
