import type { IAutoMovieTransform } from "@automovie/interface";
import type * as THREE from "three";

/*
 * Copy an admitted local TRS to a borrowed Three object: metre translation,
 * engine x/y/z/w quaternion and dimensionless scale. The host updates world
 * matrices when needed; this adapter does not normalize or repair source data.
 */
export const applyTransform: (
  obj: THREE.Object3D,
  t: IAutoMovieTransform,
) => void = (obj: THREE.Object3D, t: IAutoMovieTransform): void => {
  obj.position.set(t.translation.x, t.translation.y, t.translation.z);
  obj.quaternion.set(t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w);
  obj.scale.set(t.scale.x, t.scale.y, t.scale.z);
};
