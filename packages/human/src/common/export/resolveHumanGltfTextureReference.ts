import type { AutoMovieTextureBinding } from "@automovie/interface";

import type { IHumanGltfTextureReference } from "./IHumanGltfTextureReference";

/**
 * Normalize one material texture binding for the static glTF writer, refusing
 * what glTF cannot carry faithfully.
 *
 * Both binding forms must name a resident PNG or JPEG data URI; a project
 * asset id that is not such a URI has no bytes to embed and refuses. A
 * structured reference must address UV set zero, the only set the writer
 * exports, and its declared colour space must be the one glTF fixes for the
 * slot: sRGB for base colour, linear for normal and occlusion. Its sampler
 * and UV transform are returned unchanged for the writer to encode. A legacy
 * string returns no sampler and no transform, so its bytes stay as before.
 *
 * @evidence contracts/common.md#principled-implementation Every glTF-representable part of a binding (image, UV set zero, sampler, transform) is carried; what glTF fixes per slot (colour space) must agree rather than being silently reinterpreted.
 * @evidence contracts/common.md#clear-and-simple-design One normalizer owns the binding-form distinction, so the writer encodes a single record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No admission check is relaxed: external assets, other UV sets and mismatched colour spaces refuse by name.
 * @evidence contracts/common.md#meaningful-documentation States each accepted form, each refusal and the legacy behaviour.
 * @author Samchon
 */
export function resolveHumanGltfTextureReference(
  binding: AutoMovieTextureBinding,
  slot: "baseColorTexture" | "normalTexture" | "occlusionTexture",
): IHumanGltfTextureReference {
  const uri = typeof binding === "string" ? binding : binding.asset;
  const mediaType = (["image/png", "image/jpeg"] as const).find(
    (candidate) =>
      typeof uri === "string" && uri.startsWith(`data:${candidate};base64,`),
  );
  if (mediaType === undefined)
    throw new Error(
      "Model textures must be resident PNG or JPEG data URIs with default UV0 sampling.",
    );
  if (typeof binding === "string")
    return { uri, mediaType, sampler: null, transform: null };
  if (binding.texCoord !== 0)
    throw new Error(
      `Model texture ${slot} must address UV set 0; the exporter writes no other set.`,
    );
  const expected = slot === "baseColorTexture" ? "srgb" : "linear";
  if (binding.colorSpace !== expected)
    throw new Error(
      `Model texture ${slot} must declare the ${expected} colour space glTF fixes for it.`,
    );
  return {
    uri,
    mediaType,
    sampler: binding.sampler ?? null,
    transform: binding.transform ?? null,
  };
}
