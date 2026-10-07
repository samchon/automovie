import {
  AutoMovieTextureBinding,
  IAutoMovieTextureReference,
} from "@automovie/interface";
import * as THREE from "three";

import { IAutoMovieTextureResolver } from "./IAutoMovieTextureResolver";

/**
 * Resolve one material texture binding to a configured `three.js` texture.
 *
 * A missing binding, a missing resolver or an unresolved asset leaves the slot
 * empty. A legacy string binding reads with the slot's legacy colour space and
 * UV set 0. The resolver returns a material-owned texture, onto which this
 * writes the colour space, UV channel, optional offset/scale/rotation and
 * optional wrap modes and filters, then marks it for upload.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves each authored texture binding into the declared render material slot.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Applies the binding's colour space, UV transform and sampler at the render boundary.
 * @author Samchon
 */
export const resolveAutoMovieMaterialTexture = (
  binding: AutoMovieTextureBinding | null | undefined,
  legacyColorSpace: "srgb" | "linear",
  resolver: IAutoMovieTextureResolver | undefined,
): THREE.Texture | null => {
  if (binding === null || binding === undefined || resolver === undefined)
    return null;
  const texture = resolver(binding);
  if (texture === undefined) return null;
  const reference: IAutoMovieTextureReference =
    typeof binding === "string"
      ? { asset: binding, texCoord: 0, colorSpace: legacyColorSpace }
      : binding;
  texture.colorSpace =
    reference.colorSpace === "srgb" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
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
  if (reference.sampler !== undefined) {
    texture.wrapS = wrapMode(reference.sampler.wrapS);
    texture.wrapT = wrapMode(reference.sampler.wrapT);
    texture.minFilter = minFilter(reference.sampler.minFilter);
    texture.magFilter =
      reference.sampler.magFilter === "nearest"
        ? THREE.NearestFilter
        : THREE.LinearFilter;
  }
  texture.needsUpdate = true;
  return texture;
};

const wrapMode = (value: "clamp" | "repeat" | "mirror"): THREE.Wrapping =>
  value === "clamp"
    ? THREE.ClampToEdgeWrapping
    : value === "repeat"
      ? THREE.RepeatWrapping
      : THREE.MirroredRepeatWrapping;

const minFilter = (
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
