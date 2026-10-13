import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import * as THREE from "three";
import type {IAutoMovieRenderModeHandle} from "./IAutoMovieRenderModeHandle.js";
import type {AutoMovieRenderModeMesh} from "./AutoMovieRenderModeMesh.js";
import {collectAutoMovieRenderModeMeshes} from "./collectAutoMovieRenderModeMeshes.js";
import {type IAutoMovieFormationCycle, formationCycleOf, applyFormationCycleMaterial} from "./formationCycle/index.js";

import {maskColor} from "./maskColor.js";

import {restoreAutoMovieRenderModeOnce} from "./restoreAutoMovieRenderModeOnce.js";

/** Per-top-level-node flat colors on a black background. */
export const applyMaskMode = (scene: THREE.Scene): IAutoMovieRenderModeHandle => {
  const background = scene.background;
  scene.background = new THREE.Color(0x000000);
  const originals: Array<{
    mesh: AutoMovieRenderModeMesh;
    material: THREE.Material | THREE.Material[];
  }> = [];
  const created: THREE.Material[] = [];
  scene.children.forEach((child, index) => {
    const meshes = collectAutoMovieRenderModeMeshes(child);
    // Create only for mesh-bearing children (a camera/light child would leak
    // an unassigned material); the palette index stays the CHILD index, so the
    // deterministic node→color mapping is unchanged.
    if (meshes.length === 0) return;
    // One child can hold several formation tiers, each deforming by its own
    // baked table, so the flat color is shared by cycle rather than by child.
    // The color is still the child's: a segmentation pass keeps naming nodes,
    // and only the vertex stage differs between the materials under one node.
    const materials = new Map<
      IAutoMovieFormationCycle | null,
      THREE.Material
    >();
    for (const mesh of meshes) {
      const cycle = formationCycleOf(mesh);
      let material = materials.get(cycle);
      if (material === undefined) {
        material = new THREE.MeshBasicMaterial({ color: maskColor(index) });
        if (cycle !== null) applyFormationCycleMaterial(material, cycle);
        materials.set(cycle, material);
        created.push(material);
      }
      originals.push({ mesh, material: mesh.material });
      mesh.material = material;
    }
  });
  return {
    mode: "mask",
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce(() => {
      restoreAutoMovieRenderModeState([
        ...originals.map(({mesh,material})=>()=>{mesh.material=material;}),
        ...created.map(material=>()=>{material.dispose();}),
        ()=>{scene.background=background;},
      ]);
    }),
  };
};
