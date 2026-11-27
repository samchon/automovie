import type { AutoMovieGuidePass } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieRenderModeHandle } from "../IAutoMovieRenderModeHandle.js";
import { collectAutoMovieRenderModeMeshes } from "./collectAutoMovieRenderModeMeshes.js";
import { AutoMovieRenderDualQuaternionSkinning } from "../AutoMovieRenderDualQuaternionSkinning.js";
import { AutoMovieRenderFormationCycle } from "../AutoMovieRenderFormationCycle.js";
import { guardAutoMovieRenderModeRetirement } from "./guardAutoMovieRenderModeRetirement.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/*
 * Swap every mesh material for `make`'s, restoring the originals and disposing
 * the created overrides.
 *
 * `make` is called once per mesh with the material it replaces, so a pass that
 * reads the original, such as `albedo` reading its base colour, can build from
 * it; a pass that draws every mesh alike ignores the argument. It returns one
 * material, or one per slot of a material group. Every material it returns is
 * owned by the pass and disposed on restore.
 *
 * A formation's animated instance meshes carry their cycle on themselves, and
 * the override inherits it: a guide pass that kept the rest pose while the
 * beauty pass marched would describe a film nobody is going to see. A
 * dual-quaternion skin's override takes the same skinning patch for the same
 * reason.
 *
 * `keep`, when given, names meshes the pass draws with their own materials,
 * such as the surface graphics the `graphics` pass shows as beauty draws them;
 * they are neither swapped nor restored.
 */
export const overrideAutoMovieRenderModeMaterials: (
  scene: THREE.Scene,
  mode: AutoMovieGuidePass,
  make: (
    original: THREE.Material | THREE.Material[],
  ) => THREE.Material | THREE.Material[],
  keep?: (mesh: THREE.Mesh) => boolean,
) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
  mode: AutoMovieGuidePass,
  make: (
    original: THREE.Material | THREE.Material[],
  ) => THREE.Material | THREE.Material[],
  keep?: (mesh: THREE.Mesh) => boolean,
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
      if (keep?.(mesh) === true) continue;
      const original: THREE.Material | THREE.Material[] = mesh.material;
      const override: THREE.Material | THREE.Material[] = make(original);
      const made: THREE.Material[] = [override].flat();

      // Every made material is owned before any patch can throw.
      for (const material of made) overrides.add(material);
      swaps.push({ mesh, original });
      const cycle: ReturnType<typeof AutoMovieRenderFormationCycle.formationCycleOf> = AutoMovieRenderFormationCycle.formationCycleOf(mesh);
      const dual: boolean = AutoMovieRenderDualQuaternionSkinning.of(mesh);
      for (const material of made) {
        if (cycle !== null) AutoMovieRenderFormationCycle.applyFormationCycleMaterial(material, cycle);
        if (dual) AutoMovieRenderDualQuaternionSkinning.apply(material);
      }
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
