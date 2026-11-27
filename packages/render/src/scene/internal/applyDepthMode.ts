import * as THREE from "three";

import type { IAutoMovieRenderModeHandle } from "../IAutoMovieRenderModeHandle";
import { guardRenderModeRetirement } from "./guardRenderModeRetirement";
import { overrideRenderModeMaterials } from "./overrideRenderModeMaterials";
import { restoreRenderModeOnce } from "./restoreRenderModeOnce";
import { restoreRenderModeState } from "./restoreRenderModeState";

/*
 * Depth pass: every mesh renders its normalized metric depth over a black
 * (infinitely far) background.
 *
 * A clipping plane assigned to a pass material cuts the pass, so a section of
 * the scene is a section of its depth.
 *
 * A finite positive range in metres is a caller premise. Restoring the returned
 * handle restores borrowed materials/background and retires pass materials.
 * Active or failed scene retirement refuses before background mutation; failed
 * restoration retains its owned callback and original cause through that
 * scene.
 */
export const applyDepthMode: (
  scene: THREE.Scene,
  range: number,
) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
  range: number,
): IAutoMovieRenderModeHandle => {
  guardRenderModeRetirement(scene);
  const background:
    | THREE.Color
    | THREE.Texture<unknown, THREE.TextureEventMap>
    | null = scene.background;
  scene.background = new THREE.Color(0x000000);
  const materials: IAutoMovieRenderModeHandle =
    overrideRenderModeMaterials(
      scene,
      "depth",
      (): THREE.ShaderMaterial => makeNormalizedDepthMaterial(range),
    );
  return {
    mode: "depth",
    semantic: null,
    restore: restoreRenderModeOnce((): void => {
      guardRenderModeRetirement(scene, {
        run: (): void => {
          restoreRenderModeState([
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

/*
 * A depth material normalized on a scene-stable metric range instead of the
 * camera's clip planes. The vertex stage includes three's morph and skinning
 * chunks in the order of its own depth shader (a plain rigid mesh compiles them
 * out), so the depth of a posed skinned character with correctives is the
 * deformed surface's, morph before skin, not the bind pose's. Both stages
 * include three's clipping chunks, so a clipping plane given to the material
 * cuts the pass as it cuts a built-in material.
 */
const makeNormalizedDepthMaterial: (range: number) => THREE.ShaderMaterial = (
  range: number,
): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    clipping: true,
    uniforms: { depthRange: { value: range } },
    vertexShader: `
      #include <common>
      #include <morphtarget_pars_vertex>
      #include <skinning_pars_vertex>
      #include <clipping_planes_pars_vertex>
      varying float vViewZ;
      void main() {
        #include <skinbase_vertex>
        #include <morphinstance_vertex>
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        vec4 worldPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          worldPosition = instanceMatrix * worldPosition;
        #endif
        vec4 mvPosition = modelViewMatrix * worldPosition;
        vViewZ = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: `
      uniform float depthRange;
      varying float vViewZ;
      #include <clipping_planes_pars_fragment>
      void main() {
        #include <clipping_planes_fragment>
        float gray = clamp(1.0 - vViewZ / depthRange, 0.0, 1.0);
        gl_FragColor = vec4(vec3(gray), 1.0);
      }`,
  });
