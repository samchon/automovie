import type { IAutoMovieMesh } from "@automovie/interface";
import * as THREE from "three";

/**
 * Exact current rigid drawing vertices, shared by targeting and Engine inspection.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reads real native position attributes and current world matrices. Triangle closest-point selection and directional extents use those exact displayed coordinates; no proxy body replaces the original graph.
 * @evidence contracts/common.md#authoring-interface Input mesh remains borrowed and is never repositioned. Returned metre coordinates and indices are detached snapshots of the actual currently displayed geometry.
 */
export namespace displayedSurface {
  /**
   * Copy actual current triangles into the public Engine mesh contract.
   * @evidence contracts/common.md#implementation-and-ownership Copies every source vertex and original index after the actual rigid world transform.
   * @evidence contracts/common.md#authoring-interface The detached snapshot is world metres. It supplies no topology, volume or swept-contact admission.
   */
  export function mesh(source: THREE.Mesh): IAutoMovieMesh {
    source.updateWorldMatrix(true, false);
    const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      source.geometry.getAttribute("position");
    const positions: number[] = [];
    for (let index: number = 0; index < attribute.count; index++)
      positions.push(
        ...new THREE.Vector3()
          .fromBufferAttribute(attribute, index)
          .applyMatrix4(source.matrixWorld)
          .toArray(),
      );
    return {
      positions,
      indices: source.geometry.index
        ? Array.from(source.geometry.index.array)
        : null,
      normals: null,
      uvs: null,
      skin: null,
    };
  }
  /**
   * Closest point on the actual current triangles to a supplied world aim.
   * @evidence contracts/common.md#implementation-and-ownership Visits all original triangles through native Triangle.closestPointToPoint rather than selecting the nearest corner as a surface proxy.
   * @evidence contracts/common.md#authoring-interface Returns an owned world point; an open or concave drawing is not certified as a solid and no penetration depth is implied.
   */
  export function nearest(
    source: THREE.Mesh,
    aim: THREE.Vector3,
  ): THREE.Vector3 {
    const current: IAutoMovieMesh = mesh(source);
    let distance: number = Infinity;
    const best: THREE.Vector3 = new THREE.Vector3();
    const indices: readonly number[] =
      current.indices ??
      Array.from(
        { length: current.positions.length / 3 },
        (_: unknown, index: number): number => index,
      );
    const vertex: (index: number) => THREE.Vector3 = (
      index: number,
    ): THREE.Vector3 =>
      new THREE.Vector3().fromArray(current.positions, index * 3);
    for (let i: number = 0; i < indices.length; i += 3) {
      const triangle: THREE.Triangle = new THREE.Triangle(
        vertex(indices[i]!),
        vertex(indices[i + 1]!),
        vertex(indices[i + 2]!),
      );
      const point: THREE.Vector3 = triangle.closestPointToPoint(
        aim,
        new THREE.Vector3(),
      );
      const candidate: number = point.distanceToSquared(aim);
      if (candidate < distance) {
        distance = candidate;
        best.copy(point);
      }
    }
    return best;
  }

  /**
   * Maximum actual vertex projection from an arbitrary world origin.
   * @evidence contracts/common.md#implementation-and-ownership Uses every emitted transformed vertex; a rigid triangle's linear projection extrema occur at its corners.
   * @evidence contracts/common.md#authoring-interface Direction must be an authored unit vector and the answer is metres. This supports staging a surface gap, not certifying other meshes or motion.
   */
  export function extent(
    source: THREE.Mesh,
    direction: THREE.Vector3,
    origin: THREE.Vector3,
  ): number {
    const current: IAutoMovieMesh = mesh(source);
    let maximum: number = -Infinity;
    for (let index: number = 0; index < current.positions.length; index += 3)
      maximum = Math.max(
        maximum,
        new THREE.Vector3()
          .fromArray(current.positions, index)
          .sub(origin)
          .dot(direction),
      );
    return maximum;
  }
}
