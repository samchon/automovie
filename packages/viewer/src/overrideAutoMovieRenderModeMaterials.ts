import type { AutoMovieGuidePass } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieRenderModeHandle } from "./IAutoMovieRenderModeHandle.js";
import { collectAutoMovieRenderModeMeshes } from "./collectAutoMovieRenderModeMeshes.js";
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
 * A formation's animated instance meshes carry their cycle on themselves, and the override inherits it: a guide pass that kept the rest pose while the beauty pass marched would describe a film nobody is going to see.
 *
 * @evidence contracts/common.md#principled-implementation Collects actual render-mode meshes, records originals and each returned owned override before cycle patching, then independently restores all swaps and retires distinct overrides on setup/refinalization failure.
 * @evidence contracts/common.md#clear-and-simple-design One setup owner keeps material swaps distinct from formation-cycle shader patching and uses the existing restoration policy plus sticky once guard.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current factories must return caller-transferred owned overrides, not borrowed source materials; partial setup never silently leaves earlier meshes overridden and repeated failed restoration does not retry disposal.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains fresh override ownership, original-material restoration, animated-cycle inheritance and failure-safe teardown without claiming guide appearance.
 * @evidence contracts/performance.md#efficient-algorithms Collection/setup scans N scene nodes and M meshes; restoration visits M swaps plus U distinct overrides with O(M+U) retained references, while actual shader patching remains with the cycle owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Material identity deduplicates retirement within the pass and repeated restore shares its original outcome; another pass creates its own material effects rather than reusing a failed override.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every override registers before later setup can throw and independent restoration attempts all owners. A failed callback retains originals/overrides/cause under the weak scene key even when setup returns no handle; existing pass admission refuses reacquisition without disposal retry.
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
