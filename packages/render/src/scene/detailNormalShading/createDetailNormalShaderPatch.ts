import type * as THREE from "three";

import type { IMaterialShaderSource } from "../IMaterialShaderSource.js";
import { detailNormalFragment } from "./detailNormalFragment.js";
import { detailNormalVertex } from "./detailNormalVertex.js";

/**
 * Capture one detail-normal operation and its texture-transform value. The
 * texture stays caller-owned; its updated matrix is copied so later texture
 * transform edits do not change the already registered shader uniform.
 *
 * The callback only needs source and uniforms and can therefore be registered
 * on the larger native Three program without narrowing other patch contracts.
 */
export const createDetailNormalShaderPatch: (
  texture: THREE.Texture,
  scale: number,
) => {
  key: string;
  apply: (
    shader: Pick<
      IMaterialShaderSource,
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
      IMaterialShaderSource,
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
        IMaterialShaderSource,
        "vertexShader" | "fragmentShader" | "uniforms"
      >,
    ): void => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = detailNormalVertex(shader.vertexShader);
      shader.fragmentShader = detailNormalFragment(shader.fragmentShader);
    },
  };
};
