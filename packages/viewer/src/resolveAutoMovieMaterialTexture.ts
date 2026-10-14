import {
  AutoMovieTextureBinding,
  IAutoMovieTextureReference,
} from "@automovie/interface";
import * as THREE from "three";

import { IAutoMovieTextureResolver } from "./IAutoMovieTextureResolver.js";
import { AutoMovieEnvironmentTextureOwnership } from "./AutoMovieEnvironmentTextureOwnership.js";
import { AutoMovieTextureCacheAllocationAuthority } from "./AutoMovieTextureCacheAllocationAuthority.js";

/**
 * Resolve one material texture binding to a configured `three.js` texture.
 *
 * A missing binding, a missing resolver or an unresolved asset leaves the slot empty. A legacy string binding reads with the slot's legacy colour space and UV set 0. The resolver returns a material-owned texture, onto which this writes the colour space, UV channel, optional offset/scale/rotation and optional wrap modes and filters, then marks it for upload. The same wrapper cannot be claimed by an environment scene; decoding may be shared through separate clones, while scene/material state ownership remains exclusive before any sampling or color writes. A cache allocation receipt starts before those writes and acknowledges only their supported sampler/decoding changes and single upload-version increment. Prior fixed-input or uncontrolled version drift remains uncertified.
 *
 * @evidence contracts/common.md#principled-implementation Uses the existing resolver-owned wrapper, establishes exclusive material/environment allocation ownership before writes, applies original decoding/UV/sampler configuration and acknowledges only supported binding writes plus one upload-version increment.
 * @evidence contracts/common.md#clear-and-simple-design Binding normalization, native wrap/filter mapping and actual cache/environment history owners remain separate from texture loading and material construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing binding/resolver/asset stays null; uncontrolled history is not repaired by restoring fields and material/scene cannot own one wrapper simultaneously. Resolver output and admitted binding shape are premises, not full image or native allocation proof.
 * @evidence contracts/common.md#meaningful-documentation Documents legacy texCoord0/color fallback, degree-to-radian UV rotation, borrowed decoding through clones, material-owned wrapper and limited allocation receipt semantics.
 * @evidence contracts/performance.md#efficient-algorithms Fixed binding/property work delegates actual resolver loading/cache cost and marks the existing wrapper for upload without decoding or copying image bytes here.
 * @evidence contracts/performance.md#reuse-equivalent-work Decoded Source sharing can be reused through separate wrappers while binding-controlled state stays exclusive; supported receipt equivalence cannot repair prior uncontrolled version/fixed-input drift.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No renderer or new decoded image is acquired here; resolver/cache and material construction own issued wrapper retirement, including configuration failure, and returned material wrapper remains their lifetime responsibility.
 */
export const resolveAutoMovieMaterialTexture: (binding: AutoMovieTextureBinding | null | undefined, legacyColorSpace: "srgb" | "linear", resolver: IAutoMovieTextureResolver | undefined) => THREE.Texture | null = (
  binding: AutoMovieTextureBinding | null | undefined,
  legacyColorSpace: "srgb" | "linear",
  resolver: IAutoMovieTextureResolver | undefined,
): THREE.Texture | null => {
  if (binding === null || binding === undefined || resolver === undefined)
    return null;
  const texture: THREE.Texture | undefined = resolver(binding);
  if (texture === undefined) return null;
  AutoMovieEnvironmentTextureOwnership.material(texture);
  const allocation: ReturnType<typeof AutoMovieTextureCacheAllocationAuthority.beginBinding> = AutoMovieTextureCacheAllocationAuthority.beginBinding(texture);
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
  const sampling: Pick<THREE.Texture, "wrapS" | "wrapT" | "minFilter" | "magFilter"> | undefined = sampler === undefined ? undefined : {
    wrapS: wrapMode(sampler.wrapS), wrapT: wrapMode(sampler.wrapT),
    minFilter: minFilter(sampler.minFilter),
    magFilter: sampler.magFilter === "nearest" ? THREE.NearestFilter : THREE.LinearFilter,
  };
  if (sampling !== undefined) {
    texture.wrapS = sampling.wrapS;
    texture.wrapT = sampling.wrapT;
    texture.minFilter = sampling.minFilter;
    texture.magFilter = sampling.magFilter;
  }
  texture.needsUpdate = true;
  AutoMovieTextureCacheAllocationAuthority.finishBinding(allocation, { colorSpace, sampler: sampling });
  return texture;
};

const wrapMode: (value: "clamp" | "repeat" | "mirror") => THREE.Wrapping = (value: "clamp" | "repeat" | "mirror"): THREE.Wrapping =>
  value === "clamp"
    ? THREE.ClampToEdgeWrapping
    : value === "repeat"
      ? THREE.RepeatWrapping
      : THREE.MirroredRepeatWrapping;

const minFilter: (value: "nearest" | "linear" | "nearestMipmapLinear" | "linearMipmapLinear") => THREE.MinificationTextureFilter = (
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
