import type * as THREE from "three";

import { detailNormalFragment } from "./detailNormalFragment.js";
import { detailNormalVertex } from "./detailNormalVertex.js";

/**
 * Capture one detail-normal operation and its texture-transform value. The
 * texture stays caller-owned; its updated matrix is copied so later texture
 * transform edits do not change the already registered shader uniform.
 *
 * The callback only needs source and uniforms and can therefore be registered
 * on the larger native Three program without narrowing other patch contracts.
 *
 * @evidence contracts/common.md#principled-implementation Updates the native texture matrix from its current sampler transform, clones that Matrix3 and captures texture/scale uniform cells, then applies canonical vertex/fragment edits; native shader anchors, tangent normal/first-UV support and admitted finite scale are premises, with source compatibility failures owned by the splice/compile boundary.
 * @evidence contracts/common.md#clear-and-simple-design Returns one structural key and source/uniform operation without projecting the whole native program; feature-specific transform capture belongs here while registration order/cache policy belongs to addMaterialShaderPatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed key names identical shader structure regardless of texture/scale uniform values, not a fixture answer; native texture matrix update is supported sampler preparation and no foreign method/prototype is replaced.
 * @evidence contracts/common.md#meaningful-documentation Gives borrowed texture, cloned transform snapshot, full-program compatibility and the narrower fields actually edited by this operation.
 * @evidence contracts/performance.md#efficient-algorithms Captures one Matrix3 and three uniform cells in constant setup storage; compile performs fixed-count linear shader string edits, while renderer fragment sampling remains the feature's dominant per-pixel cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Every invocation of this registered operation reuses its captured texture/matrix/scale cells; Three may share its structural program key across differing uniform bindings, while operation effects run on each actual shader compile.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned callback retains a borrowed texture and owned small matrix/uniform records until its material/list is released; no texture disposal, decoder, renderer or task is acquired here.
 */
export const createDetailNormalShaderPatch: (
  texture: THREE.Texture,
  scale: number,
) => {
  key: string;
  apply: (
    shader: Pick<
      THREE.WebGLProgramParametersWithUniforms,
      "vertexShader" | "fragmentShader" | "uniforms"
    >,
  ) => void;
} = (
  texture: THREE.Texture,
  scale: number,
): {
  /** Stable program-cache contribution for this operation. */
  key: string;

  /** Edits the shader source and attaches the captured detail uniforms. */
  apply: (
    shader: Pick<
      THREE.WebGLProgramParametersWithUniforms,
      "vertexShader" | "fragmentShader" | "uniforms"
    >,
  ) => void;
} => {
  texture.updateMatrix();
  const uniforms: {
    detailNormalMap: { value: THREE.Texture<unknown, THREE.TextureEventMap> };
    detailNormalScale: { value: number };
    detailNormalTransform: { value: THREE.Matrix3 };
  } = {
    detailNormalMap: { value: texture },
    detailNormalScale: { value: scale },
    detailNormalTransform: { value: texture.matrix.clone() },
  };
  return {
    key: "automovie-detail-normal",
    apply: (
      shader: Pick<
        THREE.WebGLProgramParametersWithUniforms,
        "vertexShader" | "fragmentShader" | "uniforms"
      >,
    ): void => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = detailNormalVertex(shader.vertexShader);
      shader.fragmentShader = detailNormalFragment(shader.fragmentShader);
    },
  };
};
