import * as THREE from "three";

import { AutoMovieRenderDualQuaternionSkinning, AutoMovieRenderDualQuaternionSkinning } from "../../AutoMovieRenderDualQuaternionSkinning.js";
import { AutoMovieRenderFormationCycle, AutoMovieRenderFormationCycle } from "../../AutoMovieRenderFormationCycle.js";
import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";
import type { AutoMovieRenderInspectionMaterial } from "../../AutoMovieRenderInspectionMaterial.js";

/*
 * Shade each mesh a request's colour patterns match in that colour for one
 * picture, and return the call that gives each its own material back.
 *
 * The last matching entry wins. Under the `beauty` shade a matched mesh is
 * drawn in one unlit colour, so its identity reads at a glance; under `clay` it
 * is drawn in its colour lit as the clay is, so its form still reads. Both keep
 * the mesh's skinning, morphing, formation cycle and dual-quaternion skin. Any
 * other shade is a pass that encodes a quantity in colour, so a match under it
 * throws instead of hiding that quantity.
 */
export function colorAutoMovieInspectionObjectsImplementation(props: AutoMovieRenderInspectionMaterial.IColorObjectsProps): () => void {
  const swaps: {
    mesh: THREE.Mesh;
    prior: THREE.Material | THREE.Material[];
  }[] = [];
  const made: THREE.Material[] = [];
  const restore: () => void = (): void => {
    for (const { mesh, prior } of swaps.reverse()) mesh.material = prior;
    for (const material of made) material.dispose();
  };
  try {
    for (const { path, mesh } of props.meshes) {
      let hex: number | null = null;
      for (const entry of props.color)
        if (matchAutoMovieInspectionPath(path, entry.pattern))
          hex = entry.color;
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
      const cycle: ReturnType<typeof AutoMovieRenderFormationCycle.formationCycleOf> = AutoMovieRenderFormationCycle.formationCycleOf(mesh);
      if (cycle !== null) AutoMovieRenderFormationCycle.applyFormationCycleMaterial(material, cycle);
      if (AutoMovieRenderDualQuaternionSkinning.of(mesh)) AutoMovieRenderDualQuaternionSkinning.apply(material);
      swaps.push({ mesh, prior: mesh.material });
      mesh.material = material;
    }
  } catch (error) {
    restore();
    throw error;
  }
  return restore;
}
