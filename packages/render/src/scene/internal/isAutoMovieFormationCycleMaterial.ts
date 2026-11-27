import type * as THREE from "three";

import { AUTOMOVIE_FORMATION_CYCLE_PATCH_KEY } from "../AUTOMOVIE_FORMATION_CYCLE_PATCH_KEY.js";
import type { IMaterialShaderPatch } from "../IMaterialShaderPatch.js";
import { readMaterialShaderPatches } from "./readMaterialShaderPatches.js";

/*
 * Whether a material carries the formation cycle's shader patch, whatever other
 * patches it carries beside it.
 */
export function isAutoMovieFormationCycleMaterial(
  material: THREE.Material,
): boolean {
  return readMaterialShaderPatches(material).some(
    (patch: IMaterialShaderPatch): boolean =>
      patch.key === AUTOMOVIE_FORMATION_CYCLE_PATCH_KEY,
  );
}
