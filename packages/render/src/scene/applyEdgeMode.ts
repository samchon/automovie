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
 * Inverted-hull shell material: extrude by edgeWidth along the normalized model-space normal after native morph targets and then skinning, the beauty pass's order, then apply instance/object and camera transforms. White back faces exposed beyond the black fill form contours; subsequent scaling and perspective determine their world and screen thickness. Both stages include three's clipping chunks, so a clipping plane given to the material cuts the shell as it cuts the fill.
 */
const makeEdgeShellMaterial: (edgeWidth: number) => THREE.ShaderMaterial = (
  edgeWidth: number,
): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    clipping: true,
    uniforms: { edgeWidth: { value: edgeWidth } },
    vertexShader: `
      #include <common>
      #include <morphtarget_pars_vertex>
      #include <skinning_pars_vertex>
      #include <clipping_planes_pars_vertex>
      uniform float edgeWidth;
      void main() {
        #include <morphinstance_vertex>
        #include <beginnormal_vertex>
        #include <morphnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        transformed += normalize(objectNormal) * edgeWidth;
        vec4 worldPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          worldPosition = instanceMatrix * worldPosition;
        #endif
        vec4 mvPosition = modelViewMatrix * worldPosition;
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: `
      #include <clipping_planes_pars_fragment>
      void main() {
        #include <clipping_planes_fragment>
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }`,
  });

/** The culling volumes a skinned or instanced mesh carries on itself, which a plain mesh does not have. */
interface IPosedVolumes {
  /** Sphere the renderer culls the mesh by, or null until it is computed. */
  boundingSphere?: THREE.Sphere | null;

  /** Box of the posed mesh, or null until it is computed. */
  boundingBox?: THREE.Box3 | null;
}

/**
 * Bring a shell to its mesh as the mesh stands now, by rewriting every value the shallow clone took by value: the local transform, the visibility flag, the morph target influences, an instanced mesh's count and instance matrices, and the culling volumes of a skinned or instanced mesh.
 */
const followEdgeShell: (
  mesh: AutoMovieRenderModeMesh,
  shell: AutoMovieRenderModeMesh,
) => void = (
  mesh: AutoMovieRenderModeMesh,
  shell: AutoMovieRenderModeMesh,
): void => {
  shell.position.copy(mesh.position);
  shell.quaternion.copy(mesh.quaternion);
  shell.scale.copy(mesh.scale);
  shell.matrix.copy(mesh.matrix);
  shell.matrixAutoUpdate = mesh.matrixAutoUpdate;
  shell.matrixWorldNeedsUpdate = true;
  shell.visible = mesh.visible;

  const influences: number[] | undefined = mesh.morphTargetInfluences;
  if (influences !== undefined) {
    const copied: number[] = (shell.morphTargetInfluences ??= []);
    copied.length = influences.length;
    for (let i: number = 0; i < influences.length; i++)
      copied[i] = influences[i]!;
  }

  if (
    mesh instanceof THREE.InstancedMesh &&
    shell instanceof THREE.InstancedMesh
  ) {
    shell.count = mesh.count;
    if (shell.instanceMatrix.array.length === mesh.instanceMatrix.array.length)
      shell.instanceMatrix.array.set(mesh.instanceMatrix.array);
    else
      shell.instanceMatrix = new THREE.InstancedBufferAttribute(
        new Float32Array(0),
        16,
      ).copy(mesh.instanceMatrix);
    shell.instanceMatrix.needsUpdate = true;
  }

  const posed: IPosedVolumes = mesh as IPosedVolumes;
  const volumes: IPosedVolumes = shell as IPosedVolumes;
  if (posed.boundingSphere !== undefined)
    volumes.boundingSphere =
      posed.boundingSphere === null ? null : posed.boundingSphere.clone();
  if (posed.boundingBox !== undefined)
    volumes.boundingBox =
      posed.boundingBox === null ? null : posed.boundingBox.clone();
};

/**
 * Inverted-hull outline pass: each mesh gets a white back-face shell extruded along its model-space normals and a black fill, over black background. The exposed shell forms a contour without host post-processing; it is a surface-dependent projection rather than a fixed pixel-width edge detector.
 *
 * Width is a finite nonnegative model-space extrusion; object scaling affects
 * its world-space thickness. Returned restore removes shells, disposes their
 * materials and restores original fill/background state. A clipping plane
 * assigned to the shell and fill materials cuts both, so a section of the
 * scene is a section of its outline.
 *
 * A shell is a shallow copy of its mesh, so it shares the geometry and the
 * skeleton and follows a skinned pose by itself. What the copy took by value
 * is brought up to date by the handle's `update()`: the local transform, the
 * visibility flag, the morph target influences, an instanced mesh's count and
 * instance matrices, and the culling volumes a skinned or instanced mesh
 * carries. A mesh attached, detached or moved to another parent after
 * application is not followed.
 *
 * Active or failed scene retirement refuses before setup. Failed restore keeps
 * its shell/fill population and cause, while nested fill cleanup still runs.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Uses the inverted-hull method: back-face white extrusion plus black front fill, native or dual-quaternion skinning/instancing and optional shared cycle deformation; finite nonnegative width, usable normals and ordinary mesh surface behavior are premises, with model-space extrusion distorted by nonuniform object scale and transparent/open geometry limitations.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns contour shell placement/materials and delegates black fill substitution to the shared reversible override helper; shallow clones borrow geometry/skeleton and preserve local transforms beside each source mesh.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Derives contours from actual geometry/normals rather than fixture outlines or image postprocess; EDGE_SHELL_NAME identifies owned temporary shells only, and no foreign clone/dispose implementation is substituted.
 * @evidence contracts/development/common.md#meaningful-documentation Explains inverted hull, black fill/background, supported skinning, extrusion units/scaling, clipping by a plane given to the materials, what an update refreshes on a shell and what it does not follow, and returned shell/material restoration scope.
 * @evidence contracts/development/implementation.md#efficient-algorithms Collects M meshes and adds M shallow shells while allocating C cycle- and skinning-method-equivalent shell materials; CPU/temporary references are O(M+C), extra raster cost is one hull draw per mesh, and borrowed vertex buffers are not duplicated. An update copies M local transforms plus the morph influences and instance matrices those meshes hold.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares one shell shader material per actual cycle identity and skinning method plus one static material; geometry/skeleton are borrowed from shallow clones, and an update reuses the shells and materials built at application, while independent pass installs cannot share mutable restoration state.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns shells/shell materials and borrowed original fill/background references until memoized restore; restoration attempts independent removals/disposals, preserving original geometry/skeleton. Mid-install clone/material failure has no outer rollback and remains an acquisition-failure gap.
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
  // Shells clone each mesh shallowly (same geometry, and a SkinnedMesh clone
  // shares its skeleton, so the shell follows a skinned pose) under the mesh's
  // own parent, grouped by name for a recognizable scene. The local transform
  // and the other values the clone copied are refreshed by `update` below.
  const shells: {
    mesh: AutoMovieRenderModeMesh;
    shell: AutoMovieRenderModeMesh;
  }[] = [];
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
    shells.push({ mesh, shell });
  }
  return {
    mode: "outline",
    semantic: null,
    update: (): void => {
      for (const { mesh, shell } of shells) followEdgeShell(mesh, shell);
    },
    restore: restoreAutoMovieRenderModeOnce((): void => {
      guardAutoMovieRenderModeRetirement(scene, {
        run: (): void => {
          restoreAutoMovieRenderModeState([
            ...shells.map(
              ({ shell }: { shell: AutoMovieRenderModeMesh }): (() => void) =>
                (): void => {
                  shell.parent!.remove(shell);
                },
            ),
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
