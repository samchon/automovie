/**
 * Ambient-occlusion sampling for a face basis builder's baked occlusion texture.
 *
 * `rays` is the hemisphere ray count per receiving vertex and `size` the square texture
 * edge in texels; `bakeHumanFaceOcclusion` owns their admission and meaning.
 * Texels interpolate vertex visibility through the material's UV triangles.
 *
 * @evidence contracts/common.md#principled-implementation The bake owner casts cosine-weighted hemisphere rays at receiving vertices and rasterizes their visibility into an explicit square UV texture; these are computational samples, not measured light transport.
 * @evidence contracts/common.md#clear-and-simple-design Ray count and texture resolution are independent settings passed to the existing baker, without a second material-specific shading schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The consumer requires positive integers, excludes mask/blend occluders and materials lacking complete UVs, and treats absent normals as fully visible; a texture resolution guarantees no universal physical texel size or visual accuracy.
 * @evidence contracts/common.md#meaningful-documentation Per-vertex rays versus interpolated texels correct the sampling domain and identify the actual parameter owner.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This setting record implements no ray caster or texture rasterizer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Occlusion equivalence belongs to the compiled builder/cache rather than these two scalars.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record opens no buffers, PNG encoders or GPU textures.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOcclusionOptions {
  /** Hemisphere rays per receiving vertex. */
  rays: number;

  /** Square texture size in texels. */
  size: number;
}
