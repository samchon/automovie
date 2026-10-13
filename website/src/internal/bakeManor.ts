import * as THREE from "three";
import { isMesh } from "../isMesh";
import { bakeEntry } from "../bakeEntry";

/** Bake every entry object of the manor and report the mesh count it left. */
export const bakeManor: (objects: ReadonlyMap<string, THREE.Object3D>) => { before: number; after: number; } = (
  objects: ReadonlyMap<string, THREE.Object3D>,
): { before: number; after: number } => {
  const count: () => number = (): number => {
    let meshes: number = 0;
    for (const entry of objects.values())
      entry.traverse((object: THREE.Object3D<THREE.Object3DEventMap>) : void => {
        if (isMesh(object)) meshes += 1;
      });
    return meshes;
  };
  const before: number = count();
  for (const entry of objects.values()) bakeEntry(entry);
  return { before, after: count() };
};
