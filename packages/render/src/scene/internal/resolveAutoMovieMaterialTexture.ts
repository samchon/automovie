import {
  AutoMovieTextureBinding,
  IAutoMovieTextureReference,
} from "@automovie/interface";
import * as THREE from "three";

import { IAutoMovieTextureResolver } from "../IAutoMovieTextureResolver.js";

/*
 * Resolve one material texture binding to a configured `three.js` texture.
 *
 * A missing binding, a missing resolver or an unresolved asset leaves the slot
 * empty. A legacy string binding reads with the slot's legacy colour space and
 * UV set 0. The resolver lends a binding-private texture, onto which this
 * writes the colour space, UV channel, optional offset/scale/rotation and
 * optional wrap modes and filters, then marks it for upload; disposal remains
 * with its resolver/cache owner, and decoding may be shared through separate
 * clones.
 */
export const resolveAutoMovieMaterialTexture: (
  binding: AutoMovieTextureBinding | null | undefined,
  legacyColorSpace: "srgb" | "linear",
  resolver: IAutoMovieTextureResolver | undefined,
) => THREE.Texture | null = (
  binding: AutoMovieTextureBinding | null | undefined,
  legacyColorSpace: "srgb" | "linear",
  resolver: IAutoMovieTextureResolver | undefined,
): THREE.Texture | null => {
  if (binding === null || binding === undefined || resolver === undefined)
    return null;
  const texture: THREE.Texture | undefined = resolver(binding);
  if (texture === undefined) return null;
  const reference: IAutoMovieTextureReference =
    typeof binding === "string"
      ? { asset: binding, texCoord: 0, colorSpace: legacyColorSpace }
      : binding;
  const colorSpace: THREE.ColorSpace =
    reference.colorSpace === "srgb" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.colorSpace = colorSpace;
  texture.channel = reference.texCoord;
  if (reference.transform !== undefined) {
    texture.offset.set(
      reference.transform.offset.x,
      reference.transform.offset.y,
    );
    texture.repeat.set(
      reference.transform.scale.x,
      reference.transform.scale.y,
    );
    texture.rotation = (reference.transform.rotationDeg * Math.PI) / 180;
  }
  const sampler: IAutoMovieTextureReference["sampler"] = reference.sampler;
  const sampling:
    | Pick<THREE.Texture, "wrapS" | "wrapT" | "minFilter" | "magFilter">
    | undefined =
    sampler === undefined
      ? undefined
      : {
          wrapS: wrapMode(sampler.wrapS),
          wrapT: wrapMode(sampler.wrapT),
          minFilter: minFilter(sampler.minFilter),
          magFilter:
            sampler.magFilter === "nearest"
              ? THREE.NearestFilter
              : THREE.LinearFilter,
        };
  if (sampling !== undefined) {
    texture.wrapS = sampling.wrapS;
    texture.wrapT = sampling.wrapT;
    texture.minFilter = sampling.minFilter;
    texture.magFilter = sampling.magFilter;
  }
  texture.needsUpdate = true;
  return texture;
};

const wrapMode: (value: "clamp" | "repeat" | "mirror") => THREE.Wrapping = (
  value: "clamp" | "repeat" | "mirror",
): THREE.Wrapping =>
  value === "clamp"
    ? THREE.ClampToEdgeWrapping
    : value === "repeat"
      ? THREE.RepeatWrapping
      : THREE.MirroredRepeatWrapping;

const minFilter: (
  value: "nearest" | "linear" | "nearestMipmapLinear" | "linearMipmapLinear",
) => THREE.MinificationTextureFilter = (
  value: "nearest" | "linear" | "nearestMipmapLinear" | "linearMipmapLinear",
): THREE.MinificationTextureFilter => {
  switch (value) {
    case "nearest":
      return THREE.NearestFilter;
    case "linear":
      return THREE.LinearFilter;
    case "nearestMipmapLinear":
      return THREE.NearestMipmapLinearFilter;
    case "linearMipmapLinear":
      return THREE.LinearMipmapLinearFilter;
  }
};
