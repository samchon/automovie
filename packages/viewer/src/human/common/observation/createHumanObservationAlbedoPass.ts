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
 *
 * @evidence contracts/common.md#principled-implementation Admits all new per-mesh replacements before assigning them, tracks borrowed source assignments and owned material identities, then restores departed meshes and retires their replacements. Refusal restores sources and independently retires candidates; it can also clear prior active albedo state after a retirement failure, so it is not preservation of the previous rendered pass under every failure.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds mesh assignments, material attempts and sticky failures; the material factory owns supported color projection and the observation stage owns scene membership/selected meshes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown shader behavior refuses instead of producing a guessed color. Failed disposal retains the actual material/cause and blocks further application, while reentrant retirement refuses allocation; no foreign native method is patched or retried.
 * @evidence contracts/common.md#meaningful-documentation The comment states borrowed source/texture/geometry ownership, all-new admission, synchronous withdrawal and shared close completion. apply owns a complete population and the caller must stop using the pass after close.
 * @evidence contracts/performance.md#efficient-algorithms New mesh/material admission and assignment scale with population and material occurrences. Departed selection currently calls meshes.includes for each retained entry, potentially quadratic in retained/new mesh counts; disposal uses identity sets and no performance speedup is claimed.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing mesh entries reuse replacements until departure/clear; membership, rather than changed material contents, drives reuse, so the observation caller restores before publishing a changed source. Repeated failed retirement reuses its stored cause without native retries, and close shares one completion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources entries retain borrowed source/display pairs and owned retains replacements from acquisition. clear/restoration withdraw assignments before source retirement, successes remove owned materials and failures retain them until owner release. Population follows selected meshes and failed material history without a separate numeric cap; textures stay source-owned.
 */
export function createHumanObservationAlbedoPass(): { clear: () => void; restoreBorrowed: () => void; settleRetirements: () => Promise<void>; close: () => Promise<void>; apply: (meshes: readonly THREE.Mesh[]) => void; } {
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
  const entries: Map<THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, Entry> = new Map<THREE.Mesh, Entry>();
  const owned: Set<THREE.Material<THREE.MaterialEventMap>> = new Set<THREE.Material>();
  const failed: Map<THREE.Material<THREE.MaterialEventMap>, unknown> = new Map<THREE.Material, unknown>();
  let retiring: number = 0;
  let closed: boolean = false;
  const withdrawalFailures: unknown[] = [];
  const requireOpen: () => void = (): void => {
    if (closed) throw new Error("This albedo observation owner has been closed.");
  };
  const retire: (material: THREE.Material) => void = (material: THREE.Material): void => {
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
  const restoreEntries: (selected: readonly (readonly [THREE.Mesh, Entry])[]) => void = (selected: readonly (readonly [THREE.Mesh, Entry])[]): void => {
    reportAutoMovieResourceRetirement(selected.map(([mesh, entry]: readonly [THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, Entry]): () => void => (): void => {
      mesh.material = entry.source;
      entries.delete(mesh);
    }));
  };
  const retireAll: () => void = (): void => reportAutoMovieResourceRetirement(
    [...owned].map((material: THREE.Material<THREE.MaterialEventMap>): () => void => (): void => retire(material)),
  );
  const restoreBorrowed: () => void = (): void => restoreEntries([...entries]);
  const clear: () => void = (): void => reportAutoMovieResourceRetirement([restoreBorrowed, retireAll]);
  const completion: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => reportAutoMovieResourceRetirement(withdrawalFailures.map((error: unknown): () => never => (): never => { throw error; })),
    retireAll,
  ]);
  return {
    /** Restore every borrowed source and attempt every owned disposal synchronously. */
    clear,
    /** Withdraw borrowed assignments before another owner disposes its subtree. */
    restoreBorrowed,
    /** Observe sticky public retirement failures without closing active replacements. */
    settleRetirements: (): Promise<void> => createAutoMovieResourceRetirement([
      (): void => reportAutoMovieResourceRetirement([...failed.values()].map((error: unknown): () => never => (): never => { throw error; })),
    ])(),
    /** End this pass once; failed ownership and original causes remain retained. */
    close: (): Promise<void> => {
      const result: Promise<void> = completion();
      if (!closed) {
        closed = true;
        try { restoreBorrowed(); } catch (error) { withdrawalFailures.push(error); }
      }
      return result;
    },
    /** Admit all new replacements before assignment and forget departed meshes. */
    apply: (meshes: readonly THREE.Mesh[]): void => {
      requireOpen();
      if (retiring !== 0) throw new Error("Albedo material retirement is still running.");
      reportAutoMovieResourceRetirement([...failed.values()].map((error: unknown): () => never => (): never => { throw error; }));
      const pending: Map<THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, Entry> = new Map<THREE.Mesh, Entry>();
      try {
        for (const mesh of meshes) {
          if (entries.has(mesh) || pending.has(mesh)) continue;
          const source: THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[] = mesh.material;
          const materials: THREE.Material<THREE.MaterialEventMap>[] = Array.isArray(source) ? source : [source];
          const display: THREE.MeshBasicMaterial[] = materials.map((one: THREE.Material<THREE.MaterialEventMap>): THREE.MeshBasicMaterial => {
            const made: THREE.MeshBasicMaterial = createHumanObservationAlbedoMaterial(one);
            owned.add(made);
            return made;
          });
          pending.set(mesh, {
            source,
            display: Array.isArray(source) ? display : display[0],
          });
        }
        const departed: [THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, Entry][] = [...entries].filter(([mesh]: [THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, Entry]): boolean => !meshes.includes(mesh));
        const materials: Set<THREE.Material<THREE.MaterialEventMap>> = new Set<THREE.Material>();
        for (const [, entry] of departed)
          for (const material of Array.isArray(entry.display) ? entry.display : [entry.display])
            materials.add(material);
        reportAutoMovieResourceRetirement([
          (): void => restoreEntries(departed),
          ...[...materials].map((material: THREE.Material<THREE.MaterialEventMap>): () => void => (): void => retire(material)),
        ]);
        requireOpen();
        for (const [mesh, entry] of pending) {
          mesh.material = entry.display;
          entries.set(mesh, entry);
        }
      } catch (error) {
        return restoreAutoMovieRenderModeState([
          (): void => restoreEntries([...pending]), clear,
        ], { error });
      }
    },
  };
}
