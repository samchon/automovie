import * as THREE from "three";
import type { IAutoMovieSectionPlane } from "@automovie/engine";

import type { IApplyAutoMovieSectionPlanesProps } from "./IApplyAutoMovieSectionPlanesProps.js";

/**
 * Put an inspection-owned section on an already-built scene and return the same world-space planes assigned to its materials.
 *
 * Geometry and hierarchy remain unchanged while existing material clipping fields and the renderer switch are overwritten. Every encountered material slot receives the same plane array; prior arbitrary clipping policy is not saved for restoration.
 *
 * {@link IAutoMovieSectionPlane.normal} points toward the removed half-space. Negating and normalizing it through the same coplanar point expresses Three's retained positive-side convention. Ideal zero signed distance remains on the boundary; actual fragments depend on shader arithmetic and the material's alpha-to-coverage policy, so CPU plane agreement does not certify rendered boundary pixels.
 *
 * `clipIntersection` is written false so any clipping plane can remove a fragment, matching the Engine's intersection of retained half-spaces rather than preserving an incoming union policy.
 *
 * An empty list assigns null material planes and disables local clipping. This clears the applied policy rather than restoring an earlier arbitrary one, and no before-and-after pixel equality is established here.
 *
 * This operation sets needsUpdate only when a material's plane count changes; moving plane values still rebuilds the planes and traverses the subtree. Three owns program selection and compilation, including intersection-count changes, so one version update does not measure a compile count or a cost-free render.
 *
 * @evidence contracts/common.md#principled-implementation Negates each authored removal-halfspace normal and normalizes it into a Three world-space plane through the same point; admitted normals must be finite/nonzero. clipIntersection=false applies every removal plane, while ideal zero-distance inclusion does not certify shader precision or alpha-to-coverage boundary pixels.
 * @evidence contracts/common.md#clear-and-simple-design Assigns one shared plane array to existing materials and toggles renderer local clipping without replacing geometry/materials; this inspection owner replaces previous clipping policy rather than editing production assets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses authored plane geometry uniformly with no object-name exceptions or replacement Three methods; renderer/material fields use supported clipping APIs and no solver geometry is manufactured for the cut.
 * @evidence contracts/common.md#meaningful-documentation Describes world-plane orientation, any-plane removal, ideal versus rendered boundaries, empty-list clearing and plane-count needsUpdate requests; prior policy restoration, pixel equality and actual compile counts are not claimed.
 * @evidence contracts/performance.md#efficient-algorithms Builds P planes and traverses O scene objects plus all encountered material slots, assigning one shared array rather than cloning P planes per material; repeated shared materials may receive repeated inexpensive assignments.
 * @evidence contracts/performance.md#reuse-equivalent-work All material slots share the built planes for this call. Value-only movement can reuse a program when plane/intersection counts and other program inputs remain unchanged; Three controls that reuse, while current scene and plane values prevent a retained root-only result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows root/renderer/materials and transfers P plane references to materials and the caller; next assignment/empty release removes those references, with no geometry/GPU allocation, observer or task owned here.
 */
export const applyAutoMovieSectionPlanes: (props: IApplyAutoMovieSectionPlanesProps) => THREE.Plane[] = (
  props: IApplyAutoMovieSectionPlanesProps,
): THREE.Plane[] => {
  const built: THREE.Plane[] = props.planes.map((plane: IAutoMovieSectionPlane): THREE.Plane =>
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
  props.root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    const holder: Partial<Pick<THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, "material">> = object as Partial<Pick<THREE.Mesh, "material">>;
    if (holder.material === undefined) return;
    for (const material of Array.isArray(holder.material)
      ? holder.material
      : [holder.material]) {
      if ((material.clippingPlanes?.length ?? 0) !== built.length)
        material.needsUpdate = true;
      material.clippingPlanes = assigned;
      material.clipIntersection = false;
    }
  });
  return built;
};
