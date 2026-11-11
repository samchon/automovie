import * as THREE from "three";

import {
  applyDualQuaternionSkinning,
  dualQuaternionSkinningOf,
} from "../dualQuaternionSkinning/index.js";
import {
  applyFormationCycleMaterial,
  formationCycleOf,
} from "../formationCycle/index.js";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";
import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";

/**
 * Shade each mesh a request's colour patterns match in that colour for one picture, and return the call that gives each its own material back.
 *
 * The last matching entry wins. Under the `beauty` shade a matched mesh is drawn in one unlit colour, so its identity reads at a glance; under `clay` it is drawn in its colour lit as the clay is, so its form still reads. Both keep the mesh's skinning, morphing, formation cycle and dual-quaternion skin. Any other shade is a pass that encodes a quantity in colour, so a match under it throws instead of hiding that quantity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which mesh takes which colour, how each shade draws it and why, what deformation is kept, and the refusal under a guide pass.
 * @evidence contracts/development/implementation.md#principled-implementation An identity colour is a material of that colour, lit under clay so form reads and unlit under beauty so the colour is exact; formation cycles and dual-quaternion skins are carried by the same patches the render-mode overrides use.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass choosing each mesh's colour, one swap per matched mesh, and one restore.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No mesh is matched by anything but its path, and a pass that would lose its meaning is refused.
 * @evidence contracts/development/implementation.md#efficient-algorithms Meshes times colour entries pattern matches, one material per matched mesh.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The deformation patches are the formation-cycle and dual-quaternion owners'.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The created materials are owned by the returned call, which puts the meshes' materials back and disposes them; the meshes are borrowed.
 */
export function colorAutoMovieInspectionObjects(props: {
  /** The drawn meshes with their paths. */
  meshes: readonly { path: string; mesh: THREE.Mesh }[];

  /** The shade the picture is drawn in. */
  shade: IAutoMovieInspectionRequest.Shade;

  /** The request's colours. */
  color: readonly IAutoMovieInspectionRequest.IColor[];
}): () => void {
  const swaps: { mesh: THREE.Mesh; prior: THREE.Material | THREE.Material[] }[] =
    [];
  const made: THREE.Material[] = [];
  const restore: () => void = (): void => {
    for (const { mesh, prior } of swaps.reverse()) mesh.material = prior;
    for (const material of made) material.dispose();
  };
  try {
    for (const { path, mesh } of props.meshes) {
      let hex: number | null = null;
      for (const entry of props.color)
        if (matchAutoMovieInspectionPath(path, entry.pattern)) hex = entry.color;
      if (hex === null) continue;
      if (props.shade !== "beauty" && props.shade !== "clay")
        throw new Error(
          `Inspection colour for "${path}" applies under the beauty and clay shades, not ${props.shade}`,
        );
      const material: THREE.Material =
        props.shade === "clay"
          ? new THREE.MeshLambertMaterial({
              color: hex,
              side: THREE.DoubleSide,
              fog: false,
            })
          : new THREE.MeshBasicMaterial({
              color: hex,
              side: THREE.DoubleSide,
              fog: false,
              toneMapped: false,
            });
      made.push(material);
      const cycle: ReturnType<typeof formationCycleOf> = formationCycleOf(mesh);
      if (cycle !== null) applyFormationCycleMaterial(material, cycle);
      if (dualQuaternionSkinningOf(mesh)) applyDualQuaternionSkinning(material);
      swaps.push({ mesh, prior: mesh.material });
      mesh.material = material;
    }
  } catch (error) {
    restore();
    throw error;
  }
  return restore;
}
