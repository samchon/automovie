import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import * as THREE from "three";
import type {IAutoMovieRenderModeHandle} from "./IAutoMovieRenderModeHandle.js";
import {overrideAutoMovieRenderModeMaterials} from "./overrideAutoMovieRenderModeMaterials.js";
import {restoreAutoMovieRenderModeOnce} from "./restoreAutoMovieRenderModeOnce.js";

/**
 * A depth material normalized on a scene-stable metric range instead of the
 * camera's clip planes. The vertex stage includes three's skinning chunks (a
 * plain rigid mesh compiles them out; a `SkinnedMesh` deforms correctly), so
 * the depth of a posed skinned character is the deformed surface's, not the
 * bind pose's.
 */
const makeNormalizedDepthMaterial = (range: number): THREE.ShaderMaterial =>
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
 */
export const applyDepthMode = (
  scene: THREE.Scene,
  range: number,
): IAutoMovieRenderModeHandle => {
  const background = scene.background;
  scene.background = new THREE.Color(0x000000);
  const materials = overrideAutoMovieRenderModeMaterials(scene, "depth", () =>
    makeNormalizedDepthMaterial(range),
  );
  return {
    mode: "depth",
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce(() => {
      restoreAutoMovieRenderModeState([materials.restore,()=>{scene.background=background;}]);
    }),
  };
};
