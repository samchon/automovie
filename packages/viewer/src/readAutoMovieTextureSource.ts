import type { IAutoMovieRenderTextureSource } from "@automovie/engine";
import type { IAutoMovieTextureReference } from "@automovie/interface";
import * as THREE from "three";
import { readAutoMovieEnvironmentColorSpace } from "./readAutoMovieEnvironmentColorSpace.js";
import { readAutoMovieTextureUploadFormat } from "./readAutoMovieTextureUploadFormat.js";
import { AutoMovieEnvironmentTextureOwnership } from "./AutoMovieEnvironmentTextureOwnership.js";
import { AutoMovieTextureCacheAllocationAuthority } from "./AutoMovieTextureCacheAllocationAuthority.js";

const objectIdentities = new WeakMap<object, string>();
let nextObjectIdentity = 0;

/**
 * Read decoded texture facts before upload from the actual host-owned object.
 * Format follows its explicit internal format or supported component layout; unknown
 * or compressed representation stays unreported rather than priced as RGBA8.
 * Images must expose positive two-dimensional extents. This reads no file and
 * changes no sampling, pixels or GPU state.
 * Array/volume storage remains unknown here. Render-target color textures and
 * framebuffer copies require their owner profiles, not this decoded-image path.
 * Generated levels remain allocated under nearest and linear filters. Native
 * framebuffer filters can also request levels without enabling generation.
 * Object tokens describe equality in this host only. Deterministic target
 * sealing records their stable sharing relation instead of their UUID spelling.
 * Manual mip uploads can mutate generation flags without changing their cached
 * native key. Their first base is observed, but storage/sharing authority stays
 * false, including incomplete or malformed layouts. Intrinsic extents differing
 * from image factory fields also remain uncertified. This observer never infers
 * native allocation history from current mutable Texture properties.
 * A caller changing properties sets needsUpdate and preserves previous retained
 * facts until the corresponding upload/release completes; reobservation alone
 * cannot prove that the GPU retired an old state.
 * Background format describes the owned native factory tuple. The scene
 * handoff establishes its exclusive lifetime; changed or unowned equirectangular
 * conversions and failed retirement report unknown allocation authority until
 * a successful owning transition or a new decoded identity replaces them.
 * Sharp conversion can temporarily upload a mip-linear image with a linear
 * sampler and restore the property without another version. Report its factory
 * intent alongside the configured sampler, so preflight can bound either first
 * upload order without claiming current properties identify its native handle.
 * Cache originals and issued wrappers also retain their owned creation tuples.
 * Normal binding completion or a successful exclusive environment retirement
 * acknowledges its own writes; restoring an uncontrolled wrapper alone does not.
 * Unregistered objects retain this API's prospective before-upload contract.
 * This metadata observation cannot certify unreported historical native state
 * in a reused context; its host must retain the earlier phase facts there.
 * Both allocation owners are observed before extent/layout checks; one refusal
 * or a malformed image cannot hide another owner's sticky input history.
 */
export function readAutoMovieTextureSource(
  asset: string,
  texture: THREE.Texture,
): IAutoMovieRenderTextureSource {
  const cacheAllocationKnown = AutoMovieTextureCacheAllocationAuthority.current(texture);
  const environmentAllocationKnown = AutoMovieEnvironmentTextureOwnership.current(texture);
  const image: unknown = texture.image;
  const data = "isDataTexture" in texture && texture.isDataTexture === true;
  const original = decodedExtent(image, data);
  if (typeof image !== "object" || image === null || original === undefined)
    throw new Error(`Texture asset "${asset}" has no decoded two-dimensional extent.`);
  const mipmaps: unknown = texture.mipmaps;
  const manual = !Array.isArray(mipmaps) || mipmaps.length !== 0;
  const framebuffer = "isFramebufferTexture" in texture;
  const usesManualBase = manual && !framebuffer &&
    !("isDepthTexture" in texture) && !texture.isRenderTargetTexture;
  const extent = usesManualBase && Array.isArray(mipmaps) ? decodedExtent(mipmaps[0], data) ?? original : original;
  const unsupportedExtent = ("depth" in image && image.depth !== 1) ||
    "isDataArrayTexture" in texture || "isData3DTexture" in texture ||
    "isCompressedArrayTexture" in texture || texture.isRenderTargetTexture;
  const format = unsupportedExtent ? undefined : readAutoMovieTextureUploadFormat(texture);
  const wrap = (value: THREE.Wrapping): "clamp" | "repeat" | "mirror" | undefined =>
    value === THREE.RepeatWrapping ? "repeat" :
      value === THREE.MirroredRepeatWrapping ? "mirror" :
        value === THREE.ClampToEdgeWrapping ? "clamp" : undefined;
  const minFilter = texture.minFilter === THREE.NearestFilter ? "nearest" :
    texture.minFilter === THREE.LinearFilter ? "linear" :
    texture.minFilter === THREE.NearestMipmapLinearFilter ? "nearestMipmapLinear" :
    texture.minFilter === THREE.LinearMipmapLinearFilter ? "linearMipmapLinear" : undefined;
  const wrapS = wrap(texture.wrapS);
  const wrapT = wrap(texture.wrapT);
  const magFilter = texture.magFilter === THREE.NearestFilter ? "nearest" :
    texture.magFilter === THREE.LinearFilter ? "linear" : undefined;
  const sampler: IAutoMovieTextureReference["sampler"] =
    minFilter === undefined || wrapS === undefined || wrapT === undefined ||
    magFilter === undefined ? undefined : {
    wrapS, wrapT, minFilter, magFilter,
  };
  const nativeMinFilter = [THREE.NearestFilter, THREE.LinearFilter,
    THREE.NearestMipmapNearestFilter, THREE.NearestMipmapLinearFilter,
    THREE.LinearMipmapNearestFilter, THREE.LinearMipmapLinearFilter].includes(texture.minFilter);
  const samplerState = wrapS === undefined || wrapT === undefined || magFilter === undefined || !nativeMinFilter ? null :
    JSON.stringify([texture.wrapS, texture.wrapT, texture.minFilter, texture.magFilter]);
  const conversionMinFilter = texture.minFilter === THREE.LinearMipmapLinearFilter ? THREE.LinearFilter : texture.minFilter;
  const environmentSampler = sampler === undefined ? undefined : {
    ...sampler, minFilter: texture.minFilter === THREE.LinearMipmapLinearFilter ? "linear" as const : sampler.minFilter,
  };
  return {
    asset, width: extent.width, height: extent.height, format, sampler, samplerState,
    allocationStateKnown: cacheAllocationKnown && environmentAllocationKnown && !manual && !framebuffer && !unsupportedExtent && !("isCompressedTexture" in texture) && !("isDepthTexture" in texture) &&
      "width" in image && "height" in image && original.width === image.width && original.height === image.height,
    colorSpace: texture.colorSpace === THREE.SRGBColorSpace ? "srgb" :
      texture.colorSpace === THREE.NoColorSpace ? "linear" :
        texture.colorSpace === THREE.LinearSRGBColorSpace ? "linear-environment" : undefined,
    environmentColorSpace: readAutoMovieEnvironmentColorSpace(texture),
    environmentSampler,
    environmentSamplerState: samplerState === null ? null :
      JSON.stringify([texture.wrapS, texture.wrapT, conversionMinFilter, texture.magFilter]),
    environmentBackgroundFormat: texture.type === THREE.UnsignedByteType ? "rgba8" :
      texture.type === THREE.HalfFloatType ? "rgba16f" :
        texture.type === THREE.FloatType ? "rgba32f" : undefined,
    sourceIdentity: objectIdentity(texture.source), textureIdentity: objectIdentity(texture),
    uploadState: JSON.stringify([texture.format, texture.type, texture.internalFormat,
      texture.anisotropy, texture.flipY, texture.premultiplyAlpha,
      texture.unpackAlignment, texture.generateMipmaps,
      "wrapR" in texture ? texture.wrapR || 0 : 0].map((value) => value === null ? "" : String(value))),
    generateMipmaps: texture.generateMipmaps,
    explicitMipmaps: Array.isArray(mipmaps) && mipmaps.length > 1,
    mipmapped: (Array.isArray(mipmaps) && mipmaps.length > 1) ||
      texture.generateMipmaps || (framebuffer && texture.minFilter !== THREE.NearestFilter &&
        texture.minFilter !== THREE.LinearFilter),
  };
}

/** Decode the native base metadata; manual history remains uncertified. */
const decodedExtent = (image: unknown, data: boolean): { width: number; height: number } | undefined => {
  if (typeof image !== "object" || image === null) return undefined;
  const rawWidth = "width" in image ? image.width : undefined;
  const rawHeight = "height" in image ? image.height : undefined;
  const width = !data && "displayWidth" in image ? image.displayWidth :
    !data && "naturalWidth" in image ? image.naturalWidth || rawWidth : rawWidth;
  const height = !data && "displayHeight" in image ? image.displayHeight :
    !data && "naturalHeight" in image ? image.naturalHeight || rawHeight : rawHeight;
  return typeof width === "number" && typeof height === "number" &&
    Number.isSafeInteger(width) && width > 0 && Number.isSafeInteger(height) && height > 0 ? { width, height } : undefined;
};

/**
 * Host-local equality follows the actual object reference, not a mutable label
 * or copied UUID. Weak keys retain no texture after its host releases it.
 */
const objectIdentity = (value: object): string => {
  let identity = objectIdentities.get(value);
  if (identity === undefined) {
    identity = `texture-object:${nextObjectIdentity++}`;
    objectIdentities.set(value, identity);
  }
  return identity;
};
