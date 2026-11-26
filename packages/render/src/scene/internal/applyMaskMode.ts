import * as THREE from "three";

import type { AutoMovieRenderModeMesh } from "./AutoMovieRenderModeMesh.js";
import type { IAutoMovieRenderModeHandle } from "../IAutoMovieRenderModeHandle.js";
import { collectAutoMovieRenderModeMeshes } from "./collectAutoMovieRenderModeMeshes.js";
import {
  applyDualQuaternionSkinning,
  dualQuaternionSkinningOf,
} from "../dualQuaternionSkinning/index.js";
import {
  type IAutoMovieFormationCycle,
  applyFormationCycleMaterial,
  formationCycleOf,
} from "../formationCycle/index.js";
import { guardAutoMovieRenderModeRetirement } from "../guardAutoMovieRenderModeRetirement.js";
import { maskColor } from "../maskColor.js";
import { restoreAutoMovieRenderModeOnce } from "../restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "../restoreAutoMovieRenderModeState.js";

/**
 * Per-top-level-node flat colors on a black background.
 *
 * This legacy palette records top-level child position, so inserting a child
 * changes later identities. A semantic-palette host uses applySemanticMaskMode.
 * Returned restore returns original materials/background and retires overrides.
 * Active or failed scene retirement refuses before setup; failed restore keeps
 * its original-material snapshots, owned overrides and cause reachable.
 */
export const applyMaskMode: (
  scene: THREE.Scene,
) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
): IAutoMovieRenderModeHandle => {
  guardAutoMovieRenderModeRetirement(scene);
  const background:
    | THREE.Color
    | THREE.Texture<unknown, THREE.TextureEventMap>
    | null = scene.background;
  scene.background = new THREE.Color(0x000000);
  const originals: Array<{
    mesh: AutoMovieRenderModeMesh;
    material: THREE.Material | THREE.Material[];
  }> = [];
  const created: THREE.Material[] = [];
  scene.children.forEach(
    (child: THREE.Object3D<THREE.Object3DEventMap>, index: number): void => {
      const meshes: AutoMovieRenderModeMesh[] =
        collectAutoMovieRenderModeMeshes(child);
      // Create only for mesh-bearing children (a camera/light child would leak
      // an unassigned material); the palette index stays the CHILD index, so the
      // deterministic node→color mapping is unchanged.
      if (meshes.length === 0) return;
      // One child can hold several formation tiers, each deforming by its own
      // baked table, so the flat color is shared by cycle rather than by child.
      // The color is still the child's: a segmentation pass keeps naming nodes,
      // and only the vertex stage differs between the materials under one node.
      // A dual-quaternion skin deforms in its own vertex stage as well, so
      // the skinning method splits the material beside the cycle.
      const materials: Map<
        IAutoMovieFormationCycle | null,
        Map<boolean, THREE.Material<THREE.MaterialEventMap>>
      > = new Map<
        IAutoMovieFormationCycle | null,
        Map<boolean, THREE.Material>
      >();
      for (const mesh of meshes) {
        const cycle: IAutoMovieFormationCycle | null = formationCycleOf(mesh);
        const dual: boolean = dualQuaternionSkinningOf(mesh);
        let byMethod: Map<boolean, THREE.Material> | undefined =
          materials.get(cycle);
        if (byMethod === undefined) {
          byMethod = new Map<boolean, THREE.Material>();
          materials.set(cycle, byMethod);
        }
        let material: THREE.Material<THREE.MaterialEventMap> | undefined =
          byMethod.get(dual);
        if (material === undefined) {
          material = new THREE.MeshBasicMaterial({ color: maskColor(index) });
          if (cycle !== null) applyFormationCycleMaterial(material, cycle);
          if (dual) applyDualQuaternionSkinning(material);
          byMethod.set(dual, material);
          created.push(material);
        }
        originals.push({ mesh, material: mesh.material });
        mesh.material = material;
      }
    },
  );
  return {
    mode: "mask",
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce((): void => {
      guardAutoMovieRenderModeRetirement(scene, {
        run: (): void => {
          restoreAutoMovieRenderModeState([
            ...originals.map(
              ({
                mesh,
                material,
              }: {
                mesh: AutoMovieRenderModeMesh;
                material: THREE.Material | THREE.Material[];
              }): (() => void) =>
                (): void => {
                  mesh.material = material;
                },
            ),
            ...created.map(
              (material: THREE.Material): (() => void) =>
                (): void => {
                  material.dispose();
                },
            ),
            (): void => {
              scene.background = background;
            },
          ]);
        },
      });
    }),
  };
};
