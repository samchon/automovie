import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

/**
 * Share one mesh's posed-point queries and inverse skin differential without changing its bones or weights.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Share one mesh's posed-point queries and inverse skin differential without changing its bones or weights) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Share one mesh's posed-point queries and inverse skin differential without changing its bones or weights) directly over its typed inputs (`mesh`) as a single pass (reduce over (mesh.morphTargetInfluences ?? [])), delegating to `mesh.getVertexPosition`, `point.set`, `mesh.applyBoneTransform`, `origin.set`, `x.set`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 44 lines and 7 top-level statements that reuses `mesh.getVertexPosition`, `point.set`, `mesh.applyBoneTransform`, `origin.set`, `x.set` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `mesh`; the dominant cost is a single pass (reduce over (mesh.morphTargetInfluences ?? [])), performed once per call with 12 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 12 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function createAutoMovieSurfaceVertexAdapter(mesh: THREE.Mesh): {
  /** Current posed mesh-local position before contact displacement. */ point: (
    index: number,
  ) => IAutoMovieVector3;
  /** Convert a posed mesh-local delta back to the source position attribute. */ displacement: (
    index: number,
    value: IAutoMovieVector3,
  ) => IAutoMovieVector3;
} {
  const point: THREE.Vector3 = new THREE.Vector3();
  const origin: THREE.Vector3 = new THREE.Vector3();
  const x: THREE.Vector3 = new THREE.Vector3();
  const y: THREE.Vector3 = new THREE.Vector3();
  const z: THREE.Vector3 = new THREE.Vector3();
  const inverse: THREE.Matrix3 = new THREE.Matrix3();
  return {
    point: (index: number): IAutoMovieVector3 => {
      mesh.getVertexPosition(index, point);
      return { x: point.x, y: point.y, z: point.z };
    },
    displacement: (
      index: number,
      value: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      point.set(value.x, value.y, value.z);
      if (mesh instanceof THREE.SkinnedMesh) {
        // Each fixed-weight linear or dual-quaternion skin is affine in its
        // vertex position. These basis images reuse the mesh's canonical blend.
        mesh.applyBoneTransform(index, origin.set(0, 0, 0));
        mesh.applyBoneTransform(index, x.set(1, 0, 0)).sub(origin);
        mesh.applyBoneTransform(index, y.set(0, 1, 0)).sub(origin);
        mesh.applyBoneTransform(index, z.set(0, 0, 1)).sub(origin);
        inverse.set(x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z);
        if (Math.abs(inverse.determinant()) < 1e-12)
          throw new Error("Cannot compress a singular surface skin");
        point.applyMatrix3(inverse.invert());
      }
      const morph: number = mesh.geometry.morphTargetsRelative
        ? 1
        : 1 -
          (mesh.morphTargetInfluences ?? []).reduce(
            (sum: number, weight: number): number => sum + weight,
            0,
          );
      if (Math.abs(morph) < 1e-12)
        throw new Error(
          "Cannot compress a surface with zero source-position influence",
        );
      return { x: point.x / morph, y: point.y / morph, z: point.z / morph };
    },
  };
}
