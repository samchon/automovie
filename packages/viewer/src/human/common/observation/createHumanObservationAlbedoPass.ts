import * as THREE from "three";

import { createAutoMovieResourceRetirement } from "../../../createAutoMovieResourceRetirement.js";
import { reportAutoMovieResourceRetirement } from "../../../reportAutoMovieResourceRetirement.js";
import { restoreAutoMovieRenderModeState } from "../../../restoreAutoMovieRenderModeState.js";
import { createHumanObservationAlbedoMaterial } from "./createHumanObservationAlbedoMaterial.js";

/**
 * Own temporary per-mesh base-colour materials and restore their borrowed
 * sources before source disposal. Textures and geometry remain caller-owned.
 * All new materials are admitted before any mesh changes; a refusal restores
 * every borrowed source and independently retires candidates and replacements.
 * A failed public disposal remains owned with its original cause and is never
 * retried or declared physically freed. New application refuses while disposal
 * is reentrant or a failed owned retirement remains. Transient clear stays
 * synchronous. Close withdraws source changes synchronously, then supplies one
 * shared retirement outcome. The caller stops using this pass after close.
 * Unnamed shader hooks, unknown shader patches and mapped displacement refuse
 * rather than invent a colour projection or silently change the observed
 * surface; the material owner states which viewer patches it admits.
 */
export function createHumanObservationAlbedoPass() {
  /**
   * One mesh's borrowed source and shape-matching owned albedo replacement.
   *
   * @author Samchon
   */
  interface Entry {
    /** Original material references borrowed from this mesh. */
    source: THREE.Material | THREE.Material[];

    /** Matching scalar/array base-colour replacements owned by this pass. */
    display: THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[];
  }
  const entries = new Map<THREE.Mesh, Entry>();
  const owned = new Set<THREE.Material>();
  const failed = new Map<THREE.Material, unknown>();
  let retiring = 0;
  let closed = false;
  const withdrawalFailures: unknown[] = [];
  const requireOpen = (): void => {
    if (closed) throw new Error("This albedo observation owner has been closed.");
  };
  const retire = (material: THREE.Material): void => {
    if (failed.has(material)) throw failed.get(material);
    if (!owned.delete(material)) return;
    ++retiring;
    try {
      material.dispose();
    } catch (error) {
      owned.add(material);
      failed.set(material, error);
      throw error;
    } finally { --retiring; }
  };
  const restoreEntries = (selected: readonly (readonly [THREE.Mesh, Entry])[]): void => {
    reportAutoMovieResourceRetirement(selected.map(([mesh, entry]) => () => {
      mesh.material = entry.source;
      entries.delete(mesh);
    }));
  };
  const retireAll = (): void => reportAutoMovieResourceRetirement(
    [...owned].map((material) => () => retire(material)),
  );
  const restoreBorrowed = (): void => restoreEntries([...entries]);
  const clear = (): void => reportAutoMovieResourceRetirement([restoreBorrowed, retireAll]);
  const completion = createAutoMovieResourceRetirement([
    () => reportAutoMovieResourceRetirement(withdrawalFailures.map((error) => () => { throw error; })),
    retireAll,
  ]);
  return {
    /** Restore every borrowed source and attempt every owned disposal synchronously. */
    clear,
    /** Withdraw borrowed assignments before another owner disposes its subtree. */
    restoreBorrowed,
    /** Observe sticky public retirement failures without closing active replacements. */
    settleRetirements: (): Promise<void> => createAutoMovieResourceRetirement([
      () => reportAutoMovieResourceRetirement([...failed.values()].map((error) => () => { throw error; })),
    ])(),
    /** End this pass once; failed ownership and original causes remain retained. */
    close: (): Promise<void> => {
      const result = completion();
      if (!closed) {
        closed = true;
        try { restoreBorrowed(); } catch (error) { withdrawalFailures.push(error); }
      }
      return result;
    },
    /** Admit a complete new population transactionally and forget departed meshes. */
    apply: (meshes: readonly THREE.Mesh[]): void => {
      requireOpen();
      if (retiring !== 0) throw new Error("Albedo material retirement is still running.");
      reportAutoMovieResourceRetirement([...failed.values()].map((error) => () => { throw error; }));
      const pending = new Map<THREE.Mesh, Entry>();
      try {
        for (const mesh of meshes) {
          if (entries.has(mesh) || pending.has(mesh)) continue;
          const source = mesh.material;
          const materials = Array.isArray(source) ? source : [source];
          const display = materials.map((one) => {
            const made = createHumanObservationAlbedoMaterial(one);
            owned.add(made);
            return made;
          });
          pending.set(mesh, {
            source,
            display: Array.isArray(source) ? display : display[0],
          });
        }
        const departed = [...entries].filter(([mesh]) => !meshes.includes(mesh));
        const materials = new Set<THREE.Material>();
        for (const [, entry] of departed)
          for (const material of Array.isArray(entry.display) ? entry.display : [entry.display])
            materials.add(material);
        reportAutoMovieResourceRetirement([
          () => restoreEntries(departed),
          ...[...materials].map((material) => () => retire(material)),
        ]);
        requireOpen();
        for (const [mesh, entry] of pending) {
          mesh.material = entry.display;
          entries.set(mesh, entry);
        }
      } catch (error) {
        return restoreAutoMovieRenderModeState([
          () => restoreEntries([...pending]), clear,
        ], { error });
      }
    },
  };
}
