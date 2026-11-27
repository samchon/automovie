import type { IAutoMovieMeshMorphTarget } from "@automovie/interface";
import type * as THREE from "three";

/*
 * Read the names and drivers of the pose-driven morph targets `buildModel`
 * recorded on a mesh, or null when it has none. The record is an internal typed
 * handoff from the builder to `applyPose`; arbitrary foreign userData values
 * are not admitted by this lookup.
 */
export const morphTargetDriversOf: (
  object: THREE.Object3D,
) => readonly Pick<IAutoMovieMeshMorphTarget, "name" | "driver">[] | null = (
  object: THREE.Object3D,
): readonly Pick<IAutoMovieMeshMorphTarget, "name" | "driver">[] | null => {
  const drivers:
    | readonly Pick<IAutoMovieMeshMorphTarget, "name" | "driver">[]
    | undefined = object.userData.automovieMorphTargetDrivers;
  return drivers ?? null;
};
