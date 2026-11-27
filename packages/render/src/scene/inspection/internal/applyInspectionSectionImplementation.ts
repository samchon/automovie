import type * as THREE from "three";

import type { AutoMovieRenderInspection } from "../../AutoMovieRenderInspection";
import { AutoMovieRenderThreeKind } from "../../AutoMovieRenderThreeKind";
import { applySectionPlanes } from "../../internal/applySectionPlanes";

/*
 * Cut every material of a scene by one section plane, and return the call that
 * puts each material's clipping state and the renderer's clipping switch back
 * as they were.
 *
 * The plane owner, `applySectionPlanes`, overwrites each material's
 * planes and intersection flag and switches the renderer's local clipping on,
 * so the prior state of every material under the scene is recorded first. A
 * material whose plane count changes back is marked for recompilation.
 */
export function applyInspectionSectionImplementation(props: AutoMovieRenderInspection.IApplySectionProps): () => void {
  const enabled: boolean = props.renderer.localClippingEnabled;
  const clipping: Map<
    THREE.Material,
    { planes: THREE.Plane[] | null; intersection: boolean }
  > = new Map<
    THREE.Material,
    { planes: THREE.Plane[] | null; intersection: boolean }
  >();
  props.scene.traverse((object: THREE.Object3D): void => {
    if (!AutoMovieRenderThreeKind.isDrawn(object)) return;
    for (const one of [object.material].flat())
      if (!clipping.has(one))
        clipping.set(one, {
          planes: one.clippingPlanes,
          intersection: one.clipIntersection,
        });
  });
  applySectionPlanes({
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
