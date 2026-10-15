import * as THREE from "three";

import type { AutoMovieRenderModeMesh } from "./AutoMovieRenderModeMesh.js";
import { EDGE_SHELL_NAME } from "./EDGE_SHELL_NAME.js";
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
import { overrideAutoMovieRenderModeMaterials } from "./overrideAutoMovieRenderModeMaterials.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Inverted-hull shell material: extrude by edgeWidth along the normalized model-space normal after native skinning, then apply instance/object and camera transforms. White back faces exposed beyond the black fill form contours; subsequent scaling and perspective determine their world and screen thickness.
 */
const makeEdgeShellMaterial: (edgeWidth: number) => THREE.ShaderMaterial = (
  edgeWidth: number,
): THREE.ShaderMaterial =>
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
 * Inverted-hull outline pass: each mesh gets a white back-face shell extruded along its model-space normals and a black fill, over black background. The exposed shell forms a contour without host post-processing; it is a surface-dependent projection rather than a fixed pixel-width edge detector.
 *
 * Width is a finite nonnegative model-space extrusion; object scaling affects
 * its world-space thickness. Returned restore removes shells, disposes their
 * materials and restores original fill/background state.
 * Active or failed scene retirement refuses before setup. Failed restore keeps
 * its shell/fill population and cause, while nested fill cleanup still runs.
 *
 * @evidence contracts/common.md#principled-implementation Uses the inverted-hull method: back-face white extrusion plus black front fill, native or dual-quaternion skinning/instancing and optional shared cycle deformation; finite nonnegative width, usable normals and ordinary mesh surface behavior are premises, with model-space extrusion distorted by nonuniform object scale and transparent/open geometry limitations.
 * @evidence contracts/common.md#clear-and-simple-design Owns contour shell placement/materials and delegates black fill substitution to the shared reversible override helper; shallow clones borrow geometry/skeleton and preserve local transforms beside each source mesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Derives contours from actual geometry/normals rather than fixture outlines or image postprocess; EDGE_SHELL_NAME identifies owned temporary shells only, and no foreign clone/dispose implementation is substituted.
 * @evidence contracts/common.md#meaningful-documentation Explains inverted hull, black fill/background, supported skinning, extrusion units/scaling and returned shell/material restoration scope.
 * @evidence contracts/performance.md#efficient-algorithms Collects M meshes and adds M shallow shells while allocating C cycle- and skinning-method-equivalent shell materials; CPU/temporary references are O(M+C), extra raster cost is one hull draw per mesh, and borrowed vertex buffers are not duplicated.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one shell shader material per actual cycle identity and skinning method plus one static material; geometry/skeleton are borrowed from shallow clones, while independent pass installs cannot share mutable restoration state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns shells/shell materials and borrowed original fill/background references until memoized restore; restoration attempts independent removals/disposals, preserving original geometry/skeleton. Mid-install clone/material failure has no outer rollback and remains an acquisition-failure gap.
 */
export const applyEdgeMode: (
  scene: THREE.Scene,
  edgeWidth: number,
) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
  edgeWidth: number,
): IAutoMovieRenderModeHandle => {
  guardAutoMovieRenderModeRetirement(scene);
  const background:
    | THREE.Color
    | THREE.Texture<unknown, THREE.TextureEventMap>
    | null = scene.background;
  scene.background = new THREE.Color(0x000000);
  // Share one shell material per cycle plus one static material; native program variants still depend on Three's complete compile inputs.
  const shellMaterials: Map<
    IAutoMovieFormationCycle | null,
    THREE.ShaderMaterial
  > = new Map<IAutoMovieFormationCycle | null, THREE.ShaderMaterial>();
  // dual-quaternion skins take their own shells, patched like their surface
  const dualShellMaterials: Map<
    IAutoMovieFormationCycle | null,
    THREE.ShaderMaterial
  > = new Map<IAutoMovieFormationCycle | null, THREE.ShaderMaterial>();
  const fill: IAutoMovieRenderModeHandle = overrideAutoMovieRenderModeMaterials(
    scene,
    "outline",
    (): THREE.MeshBasicMaterial =>
      new THREE.MeshBasicMaterial({ color: 0x000000 }),
  );
  // Shells clone each mesh shallowly (same geometry, same local transform:
  // a SkinnedMesh clone shares its skeleton, so the shell follows the pose)
  // under the mesh's own parent, grouped by name for a recognizable scene.
  const shells: THREE.Object3D[] = [];
  for (const mesh of collectAutoMovieRenderModeMeshes(scene)) {
    const cycle: IAutoMovieFormationCycle | null = formationCycleOf(mesh);
    const dual: boolean = dualQuaternionSkinningOf(mesh);
    const cache: Map<IAutoMovieFormationCycle | null, THREE.ShaderMaterial> =
      dual ? dualShellMaterials : shellMaterials;
    let shellMaterial: THREE.ShaderMaterial | undefined = cache.get(cycle);
    if (shellMaterial === undefined) {
      shellMaterial = makeEdgeShellMaterial(edgeWidth);
      if (cycle !== null) applyFormationCycleMaterial(shellMaterial, cycle);
      if (dual) applyDualQuaternionSkinning(shellMaterial);
      cache.set(cycle, shellMaterial);
    }
    const shell: AutoMovieRenderModeMesh = mesh.clone(
      false,
    ) as AutoMovieRenderModeMesh;
    shell.name = EDGE_SHELL_NAME;
    shell.material = shellMaterial;
    mesh.parent!.add(shell);
    shells.push(shell);
  }
  return {
    mode: "outline",
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce((): void => {
      guardAutoMovieRenderModeRetirement(scene, {
        run: (): void => {
          restoreAutoMovieRenderModeState([
            ...shells.map((shell: THREE.Object3D): (() => void) => (): void => {
              shell.parent!.remove(shell);
            }),
            ...Array.from(
              [...shellMaterials.values(), ...dualShellMaterials.values()],
              (material: THREE.ShaderMaterial): (() => void) =>
                (): void => {
                  material.dispose();
                },
            ),
            fill.restore,
            (): void => {
              scene.background = background;
            },
          ]);
        },
      });
    }),
  };
};
