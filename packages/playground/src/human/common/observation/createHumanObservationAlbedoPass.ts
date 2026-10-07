import * as THREE from "three";

import { createHumanObservationAlbedoMaterial } from "./createHumanObservationAlbedoMaterial";

/**
 * Own temporary per-mesh base-colour materials and restore their borrowed
 * sources before source disposal. Textures and geometry remain caller-owned.
 * All new materials are admitted before any mesh changes; a refusal restores
 * borrowed sources and disposes owned candidates and replacements. Cached
 * replacements survive unchanged frames and
 * are released on departure or `clear`, including material arrays and groups.
 * Unnamed shader hooks, unknown shader patches and mapped displacement refuse
 * rather than invent a colour projection or silently change the observed
 * surface; the material owner states which viewer patches it admits.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Supplies a distinct material-colour observation without altering the source asset.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Restores source materials and names unsupported shader observations.
 */
export function createHumanObservationAlbedoPass() {
  interface Entry {
    source: THREE.Material | THREE.Material[];
    display: THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[];
  }
  const entries = new Map<THREE.Mesh, Entry>();
  const release = (mesh: THREE.Mesh, entry: Entry): void => {
    mesh.material = entry.source;
    for (const material of Array.isArray(entry.display)
      ? entry.display
      : [entry.display])
      material.dispose();
    entries.delete(mesh);
  };
  return {
    /** Restore every borrowed source before the numerical owner disposes it. */
    clear: (): void => {
      for (const [mesh, entry] of entries) release(mesh, entry);
    },
    /** Admit a complete new population transactionally and forget departed meshes. */
    apply: (meshes: readonly THREE.Mesh[]): void => {
      const pending = new Map<THREE.Mesh, Entry>();
      const allocated: THREE.Material[] = [];
      try {
        for (const mesh of meshes) {
          if (entries.has(mesh) || pending.has(mesh)) continue;
          const source = mesh.material;
          const materials = Array.isArray(source) ? source : [source];
          const display = materials.map((one) => {
            const made = createHumanObservationAlbedoMaterial(one);
            allocated.push(made);
            return made;
          });
          pending.set(mesh, {
            source,
            display: Array.isArray(source) ? display : display[0],
          });
        }
      } catch (error) {
        for (const material of allocated) material.dispose();
        for (const [mesh, entry] of entries) release(mesh, entry);
        throw error;
      }
      for (const [mesh, entry] of entries)
        if (!meshes.includes(mesh)) release(mesh, entry);
      for (const [mesh, entry] of pending) {
        mesh.material = entry.display;
        entries.set(mesh, entry);
      }
    },
  };
}
