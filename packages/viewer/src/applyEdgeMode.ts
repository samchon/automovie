import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import * as THREE from "three";
import type {IAutoMovieRenderModeHandle} from "./IAutoMovieRenderModeHandle.js";
import {type IAutoMovieFormationCycle, formationCycleOf, applyFormationCycleMaterial} from "./formationCycle/index.js";
import {overrideAutoMovieRenderModeMaterials} from "./overrideAutoMovieRenderModeMaterials.js";
import {collectAutoMovieRenderModeMeshes} from "./collectAutoMovieRenderModeMeshes.js";


import type {AutoMovieRenderModeMesh} from "./AutoMovieRenderModeMesh.js";
import {EDGE_SHELL_NAME} from "./EDGE_SHELL_NAME.js";
import {restoreAutoMovieRenderModeOnce} from "./restoreAutoMovieRenderModeOnce.js";

/**
 * The inverted-hull shell material: geometry pushed outward along its normals
 * by `edgeWidth` meters and drawn back-face-only in white, so wherever the
 * front-facing black fill does not cover it, a contour line remains. The vertex
 * stage includes three's skinning chunks, so a posed `SkinnedMesh` outlines its
 * deformed surface.
 */
const makeEdgeShellMaterial = (edgeWidth: number): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { edgeWidth: { value: edgeWidth } },
    vertexShader: `
      #include <common>
      #include <skinning_pars_vertex>
      uniform float edgeWidth;
      void main() {
        #include <beginnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        transformed += normalize(objectNormal) * edgeWidth;
        vec4 worldPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          worldPosition = instanceMatrix * worldPosition;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
      }`,
    fragmentShader: `
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }`,
  });

/**
 * Outline pass (#1166): REAL silhouette edges, white on black, no host
 * post-processing. Classic inverted hull: every mesh gets a back-face shell
 * expanded `edgeWidth` meters along its normals, the mesh itself fills black,
 * and the black background swallows everything else, leaving white contour
 * lines where the shell peeks past the fill.
 */
export const applyEdgeMode = (
  scene: THREE.Scene,
  edgeWidth: number,
): IAutoMovieRenderModeHandle => {
  const background = scene.background;
  scene.background = new THREE.Color(0x000000);
  // One shell material per cycle (and one for everything static), because the
  // cycle is injected into the material and a formation tier's members deform
  // by a table of their own. Keyed rather than per mesh so a hundred chunks of
  // one tier still compile one shell program.
  const shellMaterials = new Map<
    IAutoMovieFormationCycle | null,
    THREE.ShaderMaterial
  >();
  const fill = overrideAutoMovieRenderModeMaterials(
    scene,
    "outline",
    () => new THREE.MeshBasicMaterial({ color: 0x000000 }),
  );
  // Shells clone each mesh shallowly (same geometry, same local transform:
  // a SkinnedMesh clone shares its skeleton, so the shell follows the pose)
  // under the mesh's own parent, grouped by name for a recognizable scene.
  const shells: THREE.Object3D[] = [];
  for (const mesh of collectAutoMovieRenderModeMeshes(scene)) {
    const cycle = formationCycleOf(mesh);
    let shellMaterial = shellMaterials.get(cycle);
    if (shellMaterial === undefined) {
      shellMaterial = makeEdgeShellMaterial(edgeWidth);
      if (cycle !== null) applyFormationCycleMaterial(shellMaterial, cycle);
      shellMaterials.set(cycle, shellMaterial);
    }
    const shell = mesh.clone(false) as AutoMovieRenderModeMesh;
    shell.name = EDGE_SHELL_NAME;
    shell.material = shellMaterial;
    mesh.parent!.add(shell);
    shells.push(shell);
  }
  return {
    mode: "outline",
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce(() => {
      restoreAutoMovieRenderModeState([
        ...shells.map(shell=>()=>{shell.parent!.remove(shell);}),
        ...Array.from(shellMaterials.values(),material=>()=>{material.dispose();}),
        fill.restore,()=>{scene.background=background;},
      ]);
    }),
  };
};
