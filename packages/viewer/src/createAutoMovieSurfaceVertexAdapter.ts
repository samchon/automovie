import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

/** Share one mesh's posed-point queries and inverse skin differential without changing its bones or weights. */
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
