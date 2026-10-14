import * as THREE from "three";
import type { IAutoMovieSectionPlane } from "@automovie/engine";

import type { IApplyAutoMovieSectionPlanesProps } from "./IApplyAutoMovieSectionPlanesProps.js";

/**
 * Put an inspection-owned section on an already-built scene, and hand back the
 * exact world-space planes the materials were given.
 *
 * The scene is not edited: no mesh is removed, no material is replaced, no
 * geometry is rebuilt. Every material in the subtree receives the same plane
 * set and the renderer's local clipping is switched on, so what changes is
 * which fragments survive. That is what makes a cut a way of LOOKING at a
 * production rather than a second version of it — the difference between
 * reviewing the building that was authored and reviewing one with a wall
 * deleted from its source.
 *
 * One convention is converted here and nowhere else.
 * {@link IAutoMovieSectionPlane.normal} points at the half-space to REMOVE,
 * while `three.js` keeps the side its own plane normal points at and discards
 * only a negative signed distance, so the runtime plane is built from the
 * negated normal through the same coplanar point. A vertex lying exactly on the
 * cut therefore reads as distance zero on both sides of that translation and is
 * drawn, which is the boundary rule
 * {@link autoMovieSectionPlaneDistance} states: the floor a section is taken at
 * survives its own cut.
 *
 * `clipIntersection` is written false rather than left at its default, so a
 * fragment is dropped when ANY plane removes it and the set intersects the way
 * {@link autoMovieSectionPlanesKeepPoint} evaluates it. A material arriving with
 * a union already set would otherwise let a second plane restore what the first
 * cut away.
 *
 * An empty plane list releases the section: every material returns to `null`
 * clipping planes and local clipping is switched off, so a scene that was never
 * cut and a scene whose cut was released render identically.
 *
 * Materials are recompiled (`needsUpdate`) only when their plane COUNT changes.
 * `three.js` bakes that count into the shader program while reading the plane
 * values every frame, so sliding a cut costs nothing and taking or releasing
 * one costs a single compile.
 *
 * @evidence contracts/common.md#principled-implementation Negates each authored removal-halfspace normal and normalizes it into a Three world-space plane through the same point; admitted normals must be finite/nonzero. clipIntersection=false drops any removed halfspace, preserving exact zero-distance boundaries, though GPU floating precision remains renderer-dependent.
 * @evidence contracts/common.md#clear-and-simple-design Assigns one shared plane array to existing materials and toggles renderer local clipping without replacing geometry/materials; this inspection owner replaces previous clipping policy rather than editing production assets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses authored plane geometry uniformly with no object-name exceptions or replacement Three methods; renderer/material fields use supported clipping APIs and no solver geometry is manufactured for the cut.
 * @evidence contracts/common.md#meaningful-documentation Describes world-plane orientation, any-plane removal, boundary convention, empty-list reset and plane-count compilation policy; prior arbitrary clipping is not saved by this operation.
 * @evidence contracts/performance.md#efficient-algorithms Builds P planes and traverses O scene objects plus all encountered material slots, assigning one shared array rather than cloning P planes per material; repeated shared materials may receive repeated inexpensive assignments.
 * @evidence contracts/performance.md#reuse-equivalent-work All materials share the built plane objects for this call, and unchanged plane count reuses the compiled clipping program while values may move; scene mutation and supplied plane values prevent a retained root-only result cache.
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
