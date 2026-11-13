import * as THREE from "three";

import type { IAutoMovieViewerSubjectBounds } from "../subjectViewpoint/IAutoMovieViewerSubjectBounds.js";

/**
 * Measure the world-space box of what a scene draws now, so a view can be framed on the selection instead of on the whole scene.
 *
 * An object counts when it and its ancestors are visible and it is on some layer, which is how an inspection leaves an object out. Meshes are measured by their posed vertices, morph targets and linear-blend skinning included. An instanced mesh is measured by the corners of its posed box under each instance, which contains the instances and can exceed them. Lines and points are measured by their position buffers, and a screen-space `LineSegments2`, such as an inspection mark, by its segment ends. Sprites and batched meshes are not measured, and neither is a vertex that is not finite. A section does not reduce the box.
 *
 * It returns null when nothing measured is drawn. World matrices are brought up to date first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the purpose, what counts as drawn, how each object kind is measured and which are not, that a cut is ignored, the null result and the matrix update.
 * @evidence contracts/development/implementation.md#principled-implementation The box is taken from the positions the renderer draws: posed vertices in world space, not rest-pose geometry bounds, so a figure that has walked away from its origin is framed where it is.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One traversal that sends each drawn object's world points to one box.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is measured by name, an empty selection is null instead of a box at the origin, and a non-finite vertex is skipped instead of making the box infinite.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in drawn vertices, plus eight corners per instance in place of every instance's vertices.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Posed positions come from three.js's own `getVertexPosition`, the same source the defect marks use.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One scratch vector, one matrix and two boxes local to the call; the scene is read and only its world matrices are refreshed.
 */
export function measureAutoMovieInspectionBounds(
  root: THREE.Object3D,
): IAutoMovieViewerSubjectBounds | null {
  root.updateWorldMatrix(true, true);
  const box: THREE.Box3 = new THREE.Box3();
  const point: THREE.Vector3 = new THREE.Vector3();
  const include: (matrix: THREE.Matrix4) => void = (
    matrix: THREE.Matrix4,
  ): void => {
    point.applyMatrix4(matrix);
    if (
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      Number.isFinite(point.z)
    )
      box.expandByPoint(point);
  };

  root.traverseVisible((object: THREE.Object3D): void => {
    if (object.layers.mask === 0) return;

    // A screen-space line is a mesh of one widened quad per segment; its segments are its two instanced end attributes.
    if ((object as { isLineSegments2?: boolean }).isLineSegments2 === true) {
      const geometry: THREE.BufferGeometry = (object as THREE.Mesh).geometry;
      for (const end of ["instanceStart", "instanceEnd"])
        if (geometry.hasAttribute(end)) {
          const ends: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
            geometry.getAttribute(end);
          for (let i: number = 0; i < ends.count; i++) {
            point.fromBufferAttribute(ends, i);
            include(object.matrixWorld);
          }
        }
      return;
    }
    if (object instanceof THREE.Mesh) {
      if ((object as { isBatchedMesh?: boolean }).isBatchedMesh === true)
        return;
      if (!object.geometry.hasAttribute("position")) return;
      const count: number = object.geometry.getAttribute("position").count;
      if (!(object instanceof THREE.InstancedMesh)) {
        for (let i: number = 0; i < count; i++) {
          object.getVertexPosition(i, point);
          include(object.matrixWorld);
        }
        return;
      }

      // The posed box in the mesh's space, then its eight corners under every instance.
      const local: THREE.Box3 = new THREE.Box3();
      for (let i: number = 0; i < count; i++) {
        object.getVertexPosition(i, point);
        if (
          Number.isFinite(point.x) &&
          Number.isFinite(point.y) &&
          Number.isFinite(point.z)
        )
          local.expandByPoint(point);
      }
      if (local.isEmpty()) return;
      const placement: THREE.Matrix4 = new THREE.Matrix4();
      for (let n: number = 0; n < object.count; n++) {
        object.getMatrixAt(n, placement);
        placement.premultiply(object.matrixWorld);
        for (let corner: number = 0; corner < 8; corner++) {
          point.set(
            (corner & 1) === 0 ? local.min.x : local.max.x,
            (corner & 2) === 0 ? local.min.y : local.max.y,
            (corner & 4) === 0 ? local.min.z : local.max.z,
          );
          include(placement);
        }
      }
    } else if (object instanceof THREE.Line || object instanceof THREE.Points) {
      if (!object.geometry.hasAttribute("position")) return;
      const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
        object.geometry.getAttribute("position");
      for (let i: number = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i);
        include(object.matrixWorld);
      }
    }
  });

  if (box.isEmpty()) return null;
  return {
    min: { x: box.min.x, y: box.min.y, z: box.min.z },
    max: { x: box.max.x, y: box.max.y, z: box.max.z },
  };
}
