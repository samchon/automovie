import * as THREE from "three";

import { addMaterialShaderPatch } from "./materialShaderPatches";

/** The tangent-space normal line of three's normal-map chunk this extends. */
export const DETAIL_NORMAL_TARGET = "normal = normalize( tbn * mapN );";

/**
 * Blend a second tangent-space normal map over a material's normal map: the
 * detail map is sampled over the first UV set through its own texture
 * transform, its slopes scaled by `scale`, and the two combined by whiteout
 * blending, `normalize(vec3(n1.xy + n2.xy, n1.z * n2.z))`, so a fine relief
 * tiled over a coarser one keeps both. The material must already carry a
 * tangent-space `normalMap`.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves a material's detail normal map into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the detail normal blend at the render boundary.
 */
export const applyDetailNormal = (
  material: THREE.MeshPhysicalMaterial,
  texture: THREE.Texture,
  scale: number,
): void => {
  texture.updateMatrix();
  const uniforms = {
    detailNormalMap: { value: texture },
    detailNormalScale: { value: scale },
    detailNormalTransform: { value: texture.matrix.clone() },
  };
  material.userData.detailNormal = { texture, scale };
  addMaterialShaderPatch(material, {
    key: "automovie-detail-normal",
    apply: (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = detailNormalVertex(shader.vertexShader);
      shader.fragmentShader = detailNormalFragment(shader.fragmentShader);
    },
  });
};

/** The vertex shader passing the detail map's transformed UV. */
export const detailNormalVertex = (vertexShader: string): string =>
  vertexShader
    .replace(
      "#include <common>",
      "#include <common>\nuniform mat3 detailNormalTransform;\nvarying vec2 vDetailNormalUv;",
    )
    .replace(
      "#include <uv_vertex>",
      "#include <uv_vertex>\n\tvDetailNormalUv = ( detailNormalTransform * vec3( uv, 1.0 ) ).xy;",
    );

/** The fragment shader blending the detail map into the tangent-space normal. */
export const detailNormalFragment = (fragmentShader: string): string => {
  const chunk = THREE.ShaderChunk.normal_fragment_maps;
  if (!chunk.includes(DETAIL_NORMAL_TARGET))
    throw new Error(
      "The normal-map chunk no longer has the tangent-space line the detail normal blends into.",
    );
  return fragmentShader
    .replace(
      "#include <common>",
      "#include <common>\nuniform sampler2D detailNormalMap;\nuniform float detailNormalScale;\nvarying vec2 vDetailNormalUv;",
    )
    .replace(
      "#include <normal_fragment_maps>",
      chunk.replace(
        DETAIL_NORMAL_TARGET,
        `vec3 detailN = texture2D( detailNormalMap, vDetailNormalUv ).xyz * 2.0 - 1.0;
	detailN.xy *= detailNormalScale;
	mapN = normalize( vec3( mapN.xy + detailN.xy, mapN.z * detailN.z ) );
	${DETAIL_NORMAL_TARGET}`,
      ),
    );
};
