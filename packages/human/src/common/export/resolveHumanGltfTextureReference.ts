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
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Static glTF transport requires resident PNG/JPEG data URIs, UV0, sRGB base colour and linear normal/occlusion slots. Legacy strings preserve default sampling; structured bindings forward their sampler and transform after representational checks.
 * @evidence contracts/common.md#clear-and-simple-design This normalizer decides transport compatibility; sampling encoding and image-byte embedding stay with applyHumanGltfTextureSampling and createGltfDocument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed media prefixes and colour-space distinctions represent supported glTF slots, without synthesized bytes, model-specific allowances or foreign method substitution.
 * @evidence contracts/common.md#meaningful-documentation The comment gives resident URI requirements, UV0/colour-space refusals, unchanged structured sampling and the legacy form's null sampler/transform.
 * @evidence contracts/performance.md#efficient-algorithms Two bounded prefix checks and fixed slot decisions require constant auxiliary space; this stage borrows URI contents instead of decoding image bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Sampling references are forwarded to their existing encoding owner, without caching results for mutable structured bindings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One small return record transfers to the writer, borrowing URI and sampling objects; no persistent image store, handle or running work is retained.
 */
export function resolveHumanGltfTextureReference(
  binding: AutoMovieTextureBinding,
  slot: "baseColorTexture" | "normalTexture" | "occlusionTexture",
): IHumanGltfTextureReference {
  const uri: string = typeof binding === "string" ? binding : binding.asset;
  const mediaType: "image/png" | "image/jpeg" | undefined = (
    ["image/png", "image/jpeg"] as const
  ).find(
    (candidate: "image/png" | "image/jpeg"): boolean =>
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
  const expected: "srgb" | "linear" =
    slot === "baseColorTexture" ? "srgb" : "linear";
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
