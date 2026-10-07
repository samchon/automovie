import * as THREE from "three";

import type { IApplyAutoMovieSectionPlanesProps } from "./IApplyAutoMovieSectionPlanesProps";

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
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Realizes the declared cut as a viewing state over an unmodified resolved scene and keeps geometry lying exactly on the plane.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Applies the optional clipping planes at the runtime boundary as the same intersection of kept half-spaces the evaluation measures.
 */
export const applyAutoMovieSectionPlanes = (
  props: IApplyAutoMovieSectionPlanesProps,
): THREE.Plane[] => {
  const built = props.planes.map((plane) =>
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
  const assigned = built.length === 0 ? null : built;
  props.root.traverse((object) => {
    const holder = object as Partial<Pick<THREE.Mesh, "material">>;
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
