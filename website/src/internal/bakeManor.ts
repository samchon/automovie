import * as THREE from "three";

import { bakeEntry } from "../bakeEntry";
import { isMesh } from "../isMesh";

/**
 * Bake every supplied manor entry and report traversed mesh counts before and after. Counts describe draw-object structure rather than image equivalence or GPU memory release; each entry must satisfy bakeEntry's current-producer premises.
 *
 * @evidence contracts/common.md#principled-implementation Two actual mesh-capability traversals surround entry-local bakeEntry calls, preserving each map entry's independent scene boundary and reporting the resulting structure.
 * @evidence contracts/common.md#clear-and-simple-design The coordinator owns only entry iteration and counts; transformation, material grouping and merge admission stay in bakeEntry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts come from the actual supplied objects rather than expected values; fewer meshes are not represented as proof of visual equivalence or resource cleanup.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies count semantics, entry premises and the separation from visual/GPU acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Two O(N) scene traversals add counting work to bakeEntry's expanded-geometry copy/merge cost; the two scans are needed to report actual before/after structure.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied map and entries are borrowed without cloning or retaining a global mesh inventory; each bake call derives current material groups.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This coordinator retains only call-local counters and borrowed entries; bakeEntry transfers merged resources but leaves original/intermediate disposal unresolved, so this wrapper does not claim a release boundary.
 */
export const bakeManor: (objects: ReadonlyMap<string, THREE.Object3D>) => {
  before: number;
  after: number;
} = (
  objects: ReadonlyMap<string, THREE.Object3D>,
): { before: number; after: number } => {
  const count: () => number = (): number => {
    let meshes: number = 0;
    for (const entry of objects.values())
      entry.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
        if (isMesh(object)) meshes += 1;
      });
    return meshes;
  };
  const before: number = count();
  for (const entry of objects.values()) bakeEntry(entry);
  return { before, after: count() };
};
