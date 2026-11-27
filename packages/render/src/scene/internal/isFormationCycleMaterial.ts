import type * as THREE from "three";

import { AutoMovieRenderFormationCyclePatchKey } from "../AutoMovieRenderFormationCyclePatchKey";
import type { IAutoMovieRenderMaterialShaderPatch } from "../IAutoMovieRenderMaterialShaderPatch";
import { readMaterialShaderPatches } from "./readMaterialShaderPatches";

/*
 * Whether a material carries the formation cycle's shader patch, whatever other
 * patches it carries beside it.
 */
export function isFormationCycleMaterial(
  material: THREE.Material,
): boolean {
  return readMaterialShaderPatches(material).some(
    (patch: IAutoMovieRenderMaterialShaderPatch): boolean =>
      patch.key === AutoMovieRenderFormationCyclePatchKey,
  );
}
