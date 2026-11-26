import type * as THREE from "three";

import type { IAutoMovieFormationCycle } from "../IAutoMovieFormationCycle.js";

/**
 * Read the cycle bound by the Viewer formation owner, or null when absent. The
 * metadata is an internal typed handoff; arbitrary foreign userData values are
 * not structurally admitted by this lookup.
 */
export const formationCycleOf: (
  object: THREE.Object3D,
) => IAutoMovieFormationCycle | null = (
  object: THREE.Object3D,
): IAutoMovieFormationCycle | null => {
  const cycle: IAutoMovieFormationCycle | undefined =
    object.userData.automovieFormationCycle;
  return cycle ?? null;
};
