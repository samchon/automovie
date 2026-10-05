import { type Document, TextureInfo } from "@gltf-transform/core";
import { KHRTextureTransform } from "@gltf-transform/extensions";

import type { IHumanGltfTextureReference } from "./IHumanGltfTextureReference";

/**
 * Write a normalized texture reference's sampling onto one glTF texture info.
 *
 * Without a declared sampler the info clamps to edge in both directions, the
 * writer's established default, and carries no filters. A declared sampler
 * maps its wrap modes and filters one to one onto the glTF sampler enums. A
 * declared UV transform other than the identity becomes a required
 * `KHR_texture_transform` (offset and scale in texture turns, rotation in
 * radians counter-clockwise), because tiling cannot be shown without it; an
 * identity transform adds nothing, so untransformed bytes are unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Each declared wrap, filter and transform maps to its exact glTF counterpart; only a non-identity transform adds an extension.
 * @evidence contracts/common.md#clear-and-simple-design One owner encodes sampling for every texture slot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampling is invented: absent declarations keep the established clamp default and an identity transform writes nothing.
 * @evidence contracts/common.md#meaningful-documentation States the default, the one-to-one mapping, the transform units and when the extension appears.
 * @author Samchon
 */
export function applyHumanGltfTextureSampling(
  document: Document,
  info: TextureInfo,
  reference: IHumanGltfTextureReference,
): void {
  const sampler = reference.sampler;
  if (sampler === null || sampler === undefined)
    info
      .setWrapS(TextureInfo.WrapMode.CLAMP_TO_EDGE)
      .setWrapT(TextureInfo.WrapMode.CLAMP_TO_EDGE);
  else {
    const wrap = {
      clamp: TextureInfo.WrapMode.CLAMP_TO_EDGE,
      repeat: TextureInfo.WrapMode.REPEAT,
      mirror: TextureInfo.WrapMode.MIRRORED_REPEAT,
    } as const;
    const minFilter = {
      nearest: TextureInfo.MinFilter.NEAREST,
      linear: TextureInfo.MinFilter.LINEAR,
      nearestMipmapLinear: TextureInfo.MinFilter.NEAREST_MIPMAP_LINEAR,
      linearMipmapLinear: TextureInfo.MinFilter.LINEAR_MIPMAP_LINEAR,
    } as const;
    info
      .setWrapS(wrap[sampler.wrapS])
      .setWrapT(wrap[sampler.wrapT])
      .setMinFilter(minFilter[sampler.minFilter])
      .setMagFilter(
        sampler.magFilter === "nearest"
          ? TextureInfo.MagFilter.NEAREST
          : TextureInfo.MagFilter.LINEAR,
      );
  }
  const transform = reference.transform;
  if (
    transform === null ||
    transform === undefined ||
    (transform.offset.x === 0 &&
      transform.offset.y === 0 &&
      transform.scale.x === 1 &&
      transform.scale.y === 1 &&
      transform.rotationDeg === 0)
  )
    return;
  info.setExtension(
    "KHR_texture_transform",
    document
      .createExtension(KHRTextureTransform)
      .setRequired(true)
      .createTransform()
      .setOffset([transform.offset.x, transform.offset.y])
      .setScale([transform.scale.x, transform.scale.y])
      .setRotation((transform.rotationDeg * Math.PI) / 180),
  );
}
