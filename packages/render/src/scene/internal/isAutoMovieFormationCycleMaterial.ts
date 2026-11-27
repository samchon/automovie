import type * as THREE from "three";

import { AutoMovieRenderFormationCyclePatchKey } from "../AutoMovieRenderFormationCyclePatchKey.js";
import type { IAutoMovieRenderMaterialShaderPatch } from "../IAutoMovieRenderMaterialShaderPatch.js";
import { readMaterialShaderPatches } from "./readMaterialShaderPatches.js";

/*
 * Whether a material carries the formation cycle's shader patch, whatever other
 * patches it carries beside it.
 */
export function isAutoMovieFormationCycleMaterial(
  material: THREE.Material,
): boolean {
  return readMaterialShaderPatches(material).some(
    (patch: IAutoMovieRenderMaterialShaderPatch): boolean =>
      patch.key === AutoMovieRenderFormationCyclePatchKey,
  );
}
