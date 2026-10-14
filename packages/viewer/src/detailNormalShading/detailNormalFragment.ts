import { spliceTangentNormal } from "./spliceTangentNormal.js";

/**
 * Blend detail slopes into the base tangent-space normal by whiteout blending.
 * The shared splice owner expands the native chunk once and refuses a shader
 * with no supported tangent-space projection boundary.
 *
 * @evidence contracts/common.md#principled-implementation Decodes detail texels to tangent normals, scales xy slopes and normalizes the whiteout vector (base.xy+detail.xy, base.z*detail.z) before native tangent-frame projection; compatible common/tangent chunk anchors and nonzero blended normal are premises, not independently validated image-content guarantees.
 * @evidence contracts/common.md#clear-and-simple-design Owns the detail fragment formula/declarations and delegates ordered native tangent-branch insertion to spliceTangentNormal, sharing that projection boundary with other normal features.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies one supported formula to the actual texture sample, without metric/asset-name cases, fitted expected normal values or substituted native ShaderChunk contents.
 * @evidence contracts/common.md#meaningful-documentation States whiteout slope blend and shared expansion/refusal; the implementation answer discloses native-anchor and nondegenerate-data premises rather than claiming all arbitrary shader sources compile.
 * @evidence contracts/performance.md#efficient-algorithms Performs a fixed-count shader string replacement/expansion linear in source length and inserts constant GLSL code; resulting fragment work adds one texture read and fixed vector arithmetic per shaded pixel.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the shared normal projection splice and an already-expanded native chunk when prior patches installed it; this pure source transformation retains no compiled program or cross-source cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new shader source string and retains no input/texture/renderer handle; transient string bytes are bounded by input source plus fixed injected/native chunk lengths.
 */
export const detailNormalFragment: (fragmentShader: string) => string = (fragmentShader: string): string =>
  spliceTangentNormal(
    fragmentShader.replace(
      "#include <common>",
      "#include <common>\nuniform sampler2D detailNormalMap;\nuniform float detailNormalScale;\nvarying vec2 vDetailNormalUv;",
    ),
    `vec3 detailN = texture2D( detailNormalMap, vDetailNormalUv ).xyz * 2.0 - 1.0;
	detailN.xy *= detailNormalScale;
	mapN = normalize( vec3( mapN.xy + detailN.xy, mapN.z * detailN.z ) );`,
  );
