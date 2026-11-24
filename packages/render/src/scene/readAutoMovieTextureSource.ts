import type {
  IAutoMovieRenderTextureSource,
  IAutoMovieTextureReference,
} from "@automovie/interface";
import * as THREE from "three";

import { readAutoMovieEnvironmentColorSpace } from "./readAutoMovieEnvironmentColorSpace.js";
import { readAutoMovieTextureUploadFormat } from "./readAutoMovieTextureUploadFormat.js";

/**
 * Observe positive two-dimensional decoded texture extents and current
 * supported upload declarations without changing image, sampling or GPU state.
 * Compressed, array/volume, depth, framebuffer and render-target products
 * remain unsupported or allocation-uncertain under this ordinary decoded-image
 * path. Manual mip data and intrinsic/factory extent disagreement cannot
 * certify native history.
 *
 * The Source and Texture uuids, which Three assigns once per object, describe
 * their sharing in this host. Engine retains the sharing relation rather than
 * token spelling; current representation and upload-state metadata still
 * determine allocation equivalence.
 *
 * Environment conversion reports configured and factory sampler intent because
 * sharp conversion can temporarily upload with another sampler without a later
 * version change. Current properties do not prove an old native state was
 * retired. Hosts retain previous upload phases until their owning
 * release/transition is observed; this read reports neither GLuint count nor
 * independent kernel storage.
 */
export function readAutoMovieTextureSource(
  asset: string,
  texture: THREE.Texture,
): IAutoMovieRenderTextureSource {
  const image: unknown = texture.image;
  const data: boolean =
    "isDataTexture" in texture && texture.isDataTexture === true;
  const original: ReturnType<typeof decodedExtent> = decodedExtent(image, data);
  if (typeof image !== "object" || image === null || original === undefined)
    throw new Error(
      `Texture asset "${asset}" has no decoded two-dimensional extent.`,
    );
  const mipmaps: unknown = texture.mipmaps;
  const manual: boolean = !Array.isArray(mipmaps) || mipmaps.length !== 0;
  const framebuffer: boolean = "isFramebufferTexture" in texture;
  const usesManualBase: boolean =
    manual &&
    !framebuffer &&
    !("isDepthTexture" in texture) &&
    !texture.isRenderTargetTexture;
  const extent: { width: number; height: number } =
    usesManualBase && Array.isArray(mipmaps)
      ? (decodedExtent(mipmaps[0], data) ?? original)
      : original;
  const unsupportedExtent: boolean =
    ("depth" in image && image.depth !== 1) ||
    "isDataArrayTexture" in texture ||
    "isData3DTexture" in texture ||
    "isCompressedArrayTexture" in texture ||
    texture.isRenderTargetTexture;
  const format: ReturnType<typeof readAutoMovieTextureUploadFormat> =
    unsupportedExtent ? undefined : readAutoMovieTextureUploadFormat(texture);
  const wrap: (
    value: THREE.Wrapping,
  ) => "clamp" | "repeat" | "mirror" | undefined = (
    value: THREE.Wrapping,
  ): "clamp" | "repeat" | "mirror" | undefined =>
    value === THREE.RepeatWrapping
      ? "repeat"
      : value === THREE.MirroredRepeatWrapping
        ? "mirror"
        : value === THREE.ClampToEdgeWrapping
          ? "clamp"
          : undefined;
  const minFilter:
    | NonNullable<IAutoMovieTextureReference["sampler"]>["minFilter"]
    | undefined =
    texture.minFilter === THREE.NearestFilter
      ? "nearest"
      : texture.minFilter === THREE.LinearFilter
        ? "linear"
        : texture.minFilter === THREE.NearestMipmapLinearFilter
          ? "nearestMipmapLinear"
          : texture.minFilter === THREE.LinearMipmapLinearFilter
            ? "linearMipmapLinear"
            : undefined;
  const wrapS: ReturnType<typeof wrap> = wrap(texture.wrapS);
  const wrapT: ReturnType<typeof wrap> = wrap(texture.wrapT);
  const magFilter:
    | NonNullable<IAutoMovieTextureReference["sampler"]>["magFilter"]
    | undefined =
    texture.magFilter === THREE.NearestFilter
      ? "nearest"
      : texture.magFilter === THREE.LinearFilter
        ? "linear"
        : undefined;
  const sampler: IAutoMovieTextureReference["sampler"] =
    minFilter === undefined ||
    wrapS === undefined ||
    wrapT === undefined ||
    magFilter === undefined
      ? undefined
      : {
          wrapS,
          wrapT,
          minFilter,
          magFilter,
        };
  const nativeMinFilter: boolean = [
    THREE.NearestFilter,
    THREE.LinearFilter,
    THREE.NearestMipmapNearestFilter,
    THREE.NearestMipmapLinearFilter,
    THREE.LinearMipmapNearestFilter,
    THREE.LinearMipmapLinearFilter,
  ].includes(texture.minFilter);
  const samplerState: string | null =
    wrapS === undefined ||
    wrapT === undefined ||
    magFilter === undefined ||
    !nativeMinFilter
      ? null
      : JSON.stringify([
          texture.wrapS,
          texture.wrapT,
          texture.minFilter,
          texture.magFilter,
        ]);
  const conversionMinFilter: THREE.MinificationTextureFilter =
    texture.minFilter === THREE.LinearMipmapLinearFilter
      ? THREE.LinearFilter
      : texture.minFilter;
  const environmentSampler: IAutoMovieTextureReference["sampler"] =
    sampler === undefined
      ? undefined
      : {
          ...sampler,
          minFilter:
            texture.minFilter === THREE.LinearMipmapLinearFilter
              ? ("linear" as const)
              : sampler.minFilter,
        };
  return {
    asset,
    width: extent.width,
    height: extent.height,
    format,
    sampler,
    samplerState,
    allocationStateKnown:
      !manual &&
      !framebuffer &&
      !unsupportedExtent &&
      !("isCompressedTexture" in texture) &&
      !("isDepthTexture" in texture) &&
      "width" in image &&
      "height" in image &&
      original.width === image.width &&
      original.height === image.height,
    colorSpace:
      texture.colorSpace === THREE.SRGBColorSpace
        ? "srgb"
        : texture.colorSpace === THREE.NoColorSpace
          ? "linear"
          : texture.colorSpace === THREE.LinearSRGBColorSpace
            ? "linear-environment"
            : undefined,
    environmentColorSpace: readAutoMovieEnvironmentColorSpace(texture),
    environmentSampler,
    environmentSamplerState:
      samplerState === null
        ? null
        : JSON.stringify([
            texture.wrapS,
            texture.wrapT,
            conversionMinFilter,
            texture.magFilter,
          ]),
    environmentBackgroundFormat:
      texture.type === THREE.UnsignedByteType
        ? "rgba8"
        : texture.type === THREE.HalfFloatType
          ? "rgba16f"
          : texture.type === THREE.FloatType
            ? "rgba32f"
            : undefined,
    sourceIdentity: `texture-source:${texture.source.uuid}`,
    textureIdentity: `texture-object:${texture.uuid}`,
    uploadState: JSON.stringify(
      [
        texture.format,
        texture.type,
        texture.internalFormat,
        texture.anisotropy,
        texture.flipY,
        texture.premultiplyAlpha,
        texture.unpackAlignment,
        texture.generateMipmaps,
        "wrapR" in texture ? texture.wrapR || 0 : 0,
      ].map((value: unknown): string => (value === null ? "" : String(value))),
    ),
    generateMipmaps: texture.generateMipmaps,
    explicitMipmaps: Array.isArray(mipmaps) && mipmaps.length > 1,
    mipmapped:
      (Array.isArray(mipmaps) && mipmaps.length > 1) ||
      texture.generateMipmaps ||
      (framebuffer &&
        texture.minFilter !== THREE.NearestFilter &&
        texture.minFilter !== THREE.LinearFilter),
  };
}

/** Decode the native base metadata; manual history remains uncertified. */
const decodedExtent: (
  image: unknown,
  data: boolean,
) => { width: number; height: number } | undefined = (
  image: unknown,
  data: boolean,
): { width: number; height: number } | undefined => {
  if (typeof image !== "object" || image === null) return undefined;
  const rawWidth: unknown = "width" in image ? image.width : undefined;
  const rawHeight: unknown = "height" in image ? image.height : undefined;
  const width: unknown =
    !data && "displayWidth" in image
      ? image.displayWidth
      : !data && "naturalWidth" in image
        ? image.naturalWidth || rawWidth
        : rawWidth;
  const height: unknown =
    !data && "displayHeight" in image
      ? image.displayHeight
      : !data && "naturalHeight" in image
        ? image.naturalHeight || rawHeight
        : rawHeight;
  return typeof width === "number" &&
    typeof height === "number" &&
    width > 0 &&
    height > 0
    ? { width, height }
    : undefined;
};
