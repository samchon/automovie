import * as THREE from "three";

import type { IAutoMovieRenderModeHandle } from "./IAutoMovieRenderModeHandle.js";
import { guardAutoMovieRenderModeRetirement } from "./guardAutoMovieRenderModeRetirement.js";
import { overrideAutoMovieRenderModeMaterials } from "./overrideAutoMovieRenderModeMaterials.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * A depth material normalized on a scene-stable metric range instead of the
 * camera's clip planes. The vertex stage includes three's skinning chunks (a
 * plain rigid mesh compiles them out; a `SkinnedMesh` deforms correctly), so
 * the depth of a posed skinned character is the deformed surface's, not the
 * bind pose's.
 */
const makeNormalizedDepthMaterial: (range: number) => THREE.ShaderMaterial = (
  range: number,
): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    uniforms: { depthRange: { value: range } },
    vertexShader: `
      #include <common>
      #include <skinning_pars_vertex>
      varying float vViewZ;
      void main() {
        #include <skinbase_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        vec4 worldPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          worldPosition = instanceMatrix * worldPosition;
        #endif
        vec4 mvPosition = modelViewMatrix * worldPosition;
        vViewZ = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }`,
    fragmentShader: `
      uniform float depthRange;
      varying float vViewZ;
      void main() {
        float gray = clamp(1.0 - vViewZ / depthRange, 0.0, 1.0);
        gl_FragColor = vec4(vec3(gray), 1.0);
      }`,
  });

/**
 * Depth pass: every mesh renders its normalized metric depth over a black
 * (infinitely far) background.
 *
 * A finite positive range in metres is a caller premise. Restoring the returned
 * handle restores borrowed materials/background and retires pass materials.
 * Active or failed scene retirement refuses before background mutation; failed
 * restoration retains its owned callback and original cause through that scene.
 *
 * @evidence contracts/common.md#principled-implementation Shades clamp(1-viewZ/range,0,1) after native skinning/instancing and shared formation-cycle injection, using camera-space metre depth rather than near/far normalization; range must be finite/positive and morph/custom deformation not represented by these chunks is unsupported.
 * @evidence contracts/common.md#clear-and-simple-design Owns the depth shader/background while the shared override helper owns mesh selection, each mesh's replacement and cycle patch, and restoration bookkeeping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual deformed view-space vertices and one declared scene range without fixture bounds or camera-specific depth rescaling; no foreign method/prototype is replaced.
 * @evidence contracts/common.md#meaningful-documentation States the metric depth mapping, black far background, supported native skinning, range premise and returned restoration ownership.
 * @evidence contracts/performance.md#efficient-algorithms Shared override collects M scene meshes and calls the factory for each, producing M owned shader materials; CPU installation/restore is linear in selected meshes, and shader work is constant per vertex/fragment with no screen-space postprocess.
 * @evidence contracts/performance.md#reuse-equivalent-work Each mesh receives its own override and borrows its actual cycle uniforms through the shared patcher; Three may share equivalent programs, but material objects and separate pass restoration remain independent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporarily borrows original materials/background, owns override shader materials until memoized restore, and restores background even when another restore operation throws; installation failure after background change still lacks an outer rollback here.
 */
export const applyDepthMode: (
  scene: THREE.Scene,
  range: number,
) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
  range: number,
): IAutoMovieRenderModeHandle => {
  guardAutoMovieRenderModeRetirement(scene);
  const background:
    | THREE.Color
    | THREE.Texture<unknown, THREE.TextureEventMap>
    | null = scene.background;
  scene.background = new THREE.Color(0x000000);
  const materials: IAutoMovieRenderModeHandle =
    overrideAutoMovieRenderModeMaterials(
      scene,
      "depth",
      (): THREE.ShaderMaterial => makeNormalizedDepthMaterial(range),
    );
  return {
    mode: "depth",
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce((): void => {
      guardAutoMovieRenderModeRetirement(scene, {
        run: (): void => {
          restoreAutoMovieRenderModeState([
            materials.restore,
            (): void => {
              scene.background = background;
            },
          ]);
        },
      });
    }),
  };
};
