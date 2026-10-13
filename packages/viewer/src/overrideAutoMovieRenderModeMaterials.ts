import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import * as THREE from "three";
import type {AutoMovieGuidePass} from "@automovie/interface";
import type {IAutoMovieRenderModeHandle} from "./IAutoMovieRenderModeHandle.js";
import {collectAutoMovieRenderModeMeshes} from "./collectAutoMovieRenderModeMeshes.js";
import {formationCycleOf, applyFormationCycleMaterial} from "./formationCycle/index.js";

import {restoreAutoMovieRenderModeOnce} from "./restoreAutoMovieRenderModeOnce.js";

/**
 * Swap every mesh material for `make()`'s, restoring the originals and
 * disposing the created overrides.
 *
 * A formation's animated instance meshes carry their cycle on themselves, and
 * the override inherits it: a guide pass that kept the rest pose while the
 * beauty pass marched would describe a film nobody is going to see.
 */
export const overrideAutoMovieRenderModeMaterials = (
  scene: THREE.Scene,
  mode: AutoMovieGuidePass,
  make: () => THREE.Material,
): IAutoMovieRenderModeHandle => {
  const swaps = collectAutoMovieRenderModeMeshes(scene).map((mesh) => {
    const original = mesh.material;
    const override = make();
    const cycle = formationCycleOf(mesh);
    if (cycle !== null) applyFormationCycleMaterial(override, cycle);
    mesh.material = override;
    return { mesh, original, override };
  });
  return {
    mode,
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce(() => {
      restoreAutoMovieRenderModeState(swaps.flatMap(({mesh,original,override})=>[
        ()=>{mesh.material=original;},()=>{override.dispose();},
      ]));
    }),
  };
};
