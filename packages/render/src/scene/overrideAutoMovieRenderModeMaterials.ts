import type { AutoMovieGuidePass } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieRenderModeHandle } from "./IAutoMovieRenderModeHandle.js";
import { collectAutoMovieRenderModeMeshes } from "./collectAutoMovieRenderModeMeshes.js";
import {
  applyDualQuaternionSkinning,
  dualQuaternionSkinningOf,
} from "./dualQuaternionSkinning/index.js";
import {
  applyFormationCycleMaterial,
  formationCycleOf,
} from "./formationCycle/index.js";
import { guardAutoMovieRenderModeRetirement } from "./guardAutoMovieRenderModeRetirement.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Swap every mesh material for `make()`'s, restoring the originals and disposing the created overrides.
 *
 * A formation's animated instance meshes carry their cycle on themselves, and the override inherits it: a guide pass that kept the rest pose while the beauty pass marched would describe a film nobody is going to see. A dual-quaternion skin's override takes the same skinning patch for the same reason.
 */
export const overrideAutoMovieRenderModeMaterials: (
  scene: THREE.Scene,
  mode: AutoMovieGuidePass,
  make: () => THREE.Material,
) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
  mode: AutoMovieGuidePass,
  make: () => THREE.Material,
): IAutoMovieRenderModeHandle => {
  guardAutoMovieRenderModeRetirement(scene);
  const swaps: {
    mesh: ReturnType<typeof collectAutoMovieRenderModeMeshes>[number];
    original: THREE.Material | THREE.Material[];
  }[] = [];
  const overrides: Set<THREE.Material> = new Set();
  const restore: () => void = (): void => {
    restoreAutoMovieRenderModeState([
      ...swaps.map(
        ({ mesh, original }: (typeof swaps)[number]): (() => void) =>
          (): void => {
            mesh.material = original;
          },
      ),
      ...[...overrides].map(
        (override: THREE.Material): (() => void) =>
          (): void => {
            override.dispose();
          },
      ),
    ]);
  };
  try {
    for (const mesh of collectAutoMovieRenderModeMeshes(scene)) {
      const original: THREE.Material | THREE.Material[] = mesh.material;
      const override: THREE.Material = make();
      overrides.add(override);
      swaps.push({ mesh, original });
      const cycle: ReturnType<typeof formationCycleOf> = formationCycleOf(mesh);
      if (cycle !== null) applyFormationCycleMaterial(override, cycle);
      if (dualQuaternionSkinningOf(mesh)) applyDualQuaternionSkinning(override);
      mesh.material = override;
    }
  } catch (error) {
    guardAutoMovieRenderModeRetirement(scene, {
      run: restore,
      primary: { error },
    });
    throw error;
  }
  return {
    mode,
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce((): void =>
      guardAutoMovieRenderModeRetirement(scene, { run: restore }),
    ),
  };
};
