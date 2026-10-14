import * as THREE from "three";

import type { AutoMovieRenderModeMesh } from "./AutoMovieRenderModeMesh.js";
import type { IAutoMovieRenderModeHandle } from "./IAutoMovieRenderModeHandle.js";
import { collectAutoMovieRenderModeMeshes } from "./collectAutoMovieRenderModeMeshes.js";
import {
  applyDualQuaternionSkinning,
  dualQuaternionSkinningOf,
} from "./dualQuaternionSkinning/index.js";
import {
  type IAutoMovieFormationCycle,
  applyFormationCycleMaterial,
  formationCycleOf,
} from "./formationCycle/index.js";
import { guardAutoMovieRenderModeRetirement } from "./guardAutoMovieRenderModeRetirement.js";
import { maskColor } from "./maskColor.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Per-top-level-node flat colors on a black background.
 *
 * This legacy palette records top-level child position, so inserting a child
 * changes later identities. A semantic-palette host uses applySemanticMaskMode.
 * Returned restore returns original materials/background and retires overrides.
 * Active or failed scene retirement refuses before setup; failed restore keeps
 * its original-material snapshots, owned overrides and cause reachable.
 *
 * @evidence contracts/common.md#principled-implementation Colors each mesh-bearing top-level subtree by its current child index and uses a distinct override per actual deformation cycle and skinning method; black background and unlit material expose positional coverage, not stable entity identity, and palette repetition limits large-child distinction.
 * @evidence contracts/common.md#clear-and-simple-design Owns legacy positional mask assignment and reversible material bookkeeping; semantic identity masks have their own explicit palette owner rather than being inferred from scene positions here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Index palette is the documented legacy convention, not a fixture-key branch; all collected meshes use actual source/cycle identity and no foreign method is replaced or existing material disposed.
 * @evidence contracts/common.md#meaningful-documentation States positional versus semantic identity, black background and restore ownership; cycle- and skinning-method-specific sharing preserves animated and dual-quaternion vertex behavior without changing the child's assigned color.
 * @evidence contracts/performance.md#efficient-algorithms Collects meshes in each top-level subtree and assigns O(M) references with one material per subtree/cycle/skinning-method identity; temporary originals are O(M), materials O(C), and no material is allocated for an empty subtree.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares a material among meshes under the same child, exact cycle identity and skinning method, because child color, cycle uniforms and the skinning patch jointly determine equivalence; different children/pass installs keep independent colors/restoration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows original materials/background and owns temporary override materials until memoized restore, which independently restores references and disposes all overrides; construction failure partway through assignment has no outer rollback here.
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
      > = new Map<IAutoMovieFormationCycle | null, Map<boolean, THREE.Material>>();
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
