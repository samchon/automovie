import { encodeAutoMoviePng } from "@automovie/engine";
import {
  IAutoMovieImage,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieHumanSkinDomain } from "../junction/IAutoMovieHumanSkinDomain";
import { AutoMovieHumanSkinFeatureField } from "./AutoMovieHumanSkinFeatureField";
import { AutoMovieHumanSkinMicroHeight } from "./AutoMovieHumanSkinMicroHeight";
import { AutoMovieHumanSkinTextureAtlas } from "./AutoMovieHumanSkinTextureAtlas";
import { writeAutoMovieHumanSkinNormal } from "./writeAutoMovieHumanSkinNormal";

/**
 * Bake the existing cellular height convention over actual rest-mm texel footprints.
 *
 * The shared atlas owner intersects each texel with its actual triangles and transports their source roles. The height owner integrates its piecewise bilinear physical field along each polygon boundary; no fixed 4x4 sample grid is treated as sufficient. The encoded mean latent slope is approximate after smooth shading, quantization, normal composition, mip filtering and posing. It does not preserve unresolved normal variance as a calibrated BRDF.
 *
 * The default 512-square normal atlas bounds raw retained pixels to 0.75 MiB and base64 to about 1 MiB before temporary PNG storage. Its purpose is filtered mean relief, not individual visible submillimetre pits across a whole person. Increasing resolution changes that approximation, never physical cell size. Source glabrous, vermilion, oral and unknown roles are flat here; anatomical palm creases and regional density maps are not supplied by this convention. Omitted role metadata retains legacy uniform eligibility for direct callers. Unsupported/ambiguous UV domains remain flat and their counts are returned.
 *
 * @param props Actual emitted rest parts, matching role metadata, wrinkle depth and optional atlas edge
 * @returns A linear normal image and this actual bake's domain diagnostics
 */
export function paintAutoMovieHumanSkinRelief(props: {
  parts: readonly IAutoMovieModelPart[];
  furrows: number;
  domains?: ReadonlyMap<string, IAutoMovieHumanSkinDomain>;
  /** Integer atlas edge, 16 to 2048; composition uses 512. */
  size?: number;
}): paintAutoMovieHumanSkinRelief.IOutput {
  const size: number = props.size ?? 512;
  if (!Number.isInteger(size) || size < 16 || size > 2048)
    throw new Error(
      "Skin relief atlas edge must be an integer from 16 to 2048",
    );
  const height: AutoMovieHumanSkinMicroHeight =
    new AutoMovieHumanSkinMicroHeight(props.furrows);
  const field: AutoMovieHumanSkinTextureAtlas.IField = {
    sample: (
      point: IAutoMovieVector3,
    ): ReturnType<AutoMovieHumanSkinFeatureField["sample"]> => ({
      freckles: 0,
      acne: 0,
      gradient: height.gradient(point),
    }),
    prepare:
      (
        _triangle: readonly IAutoMovieVector3[],
      ): NonNullable<
        ReturnType<AutoMovieHumanSkinTextureAtlas.IField["prepare"]>
      > =>
      (
        polygon: readonly IAutoMovieVector3[],
      ): ReturnType<AutoMovieHumanSkinFeatureField["sample"]> | null => {
        const gradient: IAutoMovieVector3 | null = height.integrate(polygon);
        return gradient === null ? null : { freckles: 0, acne: 0, gradient };
      },
  };
  const atlas: AutoMovieHumanSkinTextureAtlas =
    new AutoMovieHumanSkinTextureAtlas({ ...props, size, field });
  const pixels: Uint8Array = new Uint8Array(size * size * 3);
  const stats: paintAutoMovieHumanSkinRelief.IOutput["stats"] = {
    edge: size,
    sampledTexels: 0,
    ambiguousTexels: 0,
    degenerateUvTriangles: 0,
    unsupportedTexels: 0,
    excludedTexels: 0,
    paddingTexels: 0,
  };
  for (let pixel: number = 0; pixel < size * size; ++pixel) {
    pixels[3 * pixel] = 128;
    pixels[3 * pixel + 1] = 128;
    pixels[3 * pixel + 2] = 255;
    const footprint: AutoMovieHumanSkinTextureAtlas.IOutput | null =
      atlas.sample(pixel % size, Math.floor(pixel / size));
    if (footprint === null) continue;
    if (footprint.ambiguous) {
      ++stats.ambiguousTexels;
      continue;
    }
    ++stats.sampledTexels;
    writeAutoMovieHumanSkinNormal(
      pixels,
      pixel,
      footprint.triangle.p,
      footprint.triangle.uv,
      footprint.value.gradient,
    );
  }
  Object.assign(stats, atlas.stats);
  let fingerprint: number = 0x811c9dc5;
  for (const value of pixels)
    fingerprint = Math.imul(fingerprint ^ value, 0x01000193);
  return {
    image: {
      id: `human.skin.relief.physical.${size}.${(fingerprint >>> 0).toString(16)}`,
      mimeType: "image/png",
      data: encodeAutoMoviePng({
        width: size,
        height: size,
        channels: 3,
        pixels,
      }),
    },
    stats,
  };
}

/** Actual relief bake output, owned and cached by one immutable person and assembly. */
export namespace paintAutoMovieHumanSkinRelief {
  /**
   * One generated image and counts from its actual inverse domain.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Linear cotangent-frame normal image with a content-derived local id. */
    image: IAutoMovieImage;
    /** Counts qualify coverage; they do not certify the displayed material. */
    stats: AutoMovieHumanSkinTextureAtlas["stats"] & {
      /** Atlas edge in pixels. */
      edge: number;
      /** Supported inverse-domain texels, including explicit padding. */
      sampledTexels: number;
      /** Suppressed nonlocal or role-disagreeing UV overlaps. */
      ambiguousTexels: number;
    };
  }
}
