import type { IAutoMovieSectionPlane } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import type { IApplyAutoMovieSectionPlanesProps } from "../IApplyAutoMovieSectionPlanesProps.js";

/**
 * Put an inspection-owned section on an already-built scene and return the same
 * world-space planes assigned to its materials.
 *
 * Geometry and hierarchy remain unchanged while existing material clipping
 * fields and the renderer switch are overwritten. Every encountered material
 * slot receives the same plane array; prior arbitrary clipping policy is not
 * saved for restoration.
 *
 * {@link IAutoMovieSectionPlane.normal} points toward the removed half-space.
 * Negating and normalizing it through the same coplanar point expresses Three's
 * retained positive-side convention. Ideal zero signed distance remains on the
 * boundary; actual fragments depend on shader arithmetic and the material's
 * alpha-to-coverage policy, so CPU plane agreement does not certify rendered
 * boundary pixels.
 *
 * `clipIntersection` is written false so any clipping plane can remove a
 * fragment, matching the Engine's intersection of retained half-spaces rather
 * than preserving an incoming union policy.
 *
 * An empty list assigns null material planes and disables local clipping. This
 * clears the applied policy rather than restoring an earlier arbitrary one, and
 * no before-and-after pixel equality is established here.
 *
 * This operation sets needsUpdate only when a material's plane count changes;
 * moving plane values still rebuilds the planes and traverses the subtree.
 * Three owns program selection and compilation, including intersection-count
 * changes, so one version update does not measure a compile count or a
 * cost-free render.
 */
export const applyAutoMovieSectionPlanes: (
  props: IApplyAutoMovieSectionPlanesProps,
) => THREE.Plane[] = (
  props: IApplyAutoMovieSectionPlanesProps,
): THREE.Plane[] => {
  const built: THREE.Plane[] = props.planes.map(
    (plane: IAutoMovieSectionPlane): THREE.Plane =>
      new THREE.Plane().setFromNormalAndCoplanarPoint(
        new THREE.Vector3(
          -plane.normal.x,
          -plane.normal.y,
          -plane.normal.z,
        ).normalize(),
        new THREE.Vector3(plane.point.x, plane.point.y, plane.point.z),
      ),
  );
  props.renderer.localClippingEnabled = built.length !== 0;
  const assigned: THREE.Plane[] | null = built.length === 0 ? null : built;
  props.root.traverse(
    (object: THREE.Object3D<THREE.Object3DEventMap>): void => {
      if (!AutoMovieThreeKind.isDrawn(object)) return;
      for (const material of [object.material].flat()) {
        if ((material.clippingPlanes?.length ?? 0) !== built.length)
          material.needsUpdate = true;
        material.clippingPlanes = assigned;
        material.clipIntersection = false;
      }
    },
  );
  return built;
};
