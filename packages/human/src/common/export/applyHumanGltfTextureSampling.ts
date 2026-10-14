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
 *
 * @evidence contracts/common.md#principled-implementation Maps declared wrap/filter modes to glTF enums and writes nonidentity UV transforms as required KHR_texture_transform, converting degrees to radians.
 * @evidence contracts/common.md#clear-and-simple-design One helper applies sampling consistently to base-colour, normal and occlusion texture infos while image embedding remains in createGltfDocument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The clamp legacy default and identity-transform omission express supported binding semantics; no slot or consumer gets a corrective shader path.
 * @evidence contracts/common.md#meaningful-documentation Documents sampler defaults, required transform extension, radians and identity omission.
 * @evidence contracts/performance.md#efficient-algorithms Fixed mode maps and a single transform check use O(1) work per binding; no image bytes or texels are traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's Document shares its extension registry, while each TextureInfo gets its own sampler/transform intent even when image bytes share a texture.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The Document owns any created transform extension; the helper retains no reference or cache after return and opens no IO task.
 *
 * @author Samchon
 */
export function applyHumanGltfTextureSampling(
  document: Document,
  info: TextureInfo,
  reference: IHumanGltfTextureReference,
): void {
  const sampler: IHumanGltfTextureReference["sampler"] = reference.sampler;
  if (sampler === null || sampler === undefined)
    info
      .setWrapS(TextureInfo.WrapMode.CLAMP_TO_EDGE)
      .setWrapT(TextureInfo.WrapMode.CLAMP_TO_EDGE);
  else {
    const wrap: Readonly<
      Record<
        NonNullable<IHumanGltfTextureReference["sampler"]>["wrapS"],
        ReturnType<TextureInfo["getWrapS"]>
      >
    > = {
      clamp: TextureInfo.WrapMode.CLAMP_TO_EDGE,
      repeat: TextureInfo.WrapMode.REPEAT,
      mirror: TextureInfo.WrapMode.MIRRORED_REPEAT,
    };
    const minFilter: Readonly<
      Record<
        NonNullable<IHumanGltfTextureReference["sampler"]>["minFilter"],
        NonNullable<ReturnType<TextureInfo["getMinFilter"]>>
      >
    > = {
      nearest: TextureInfo.MinFilter.NEAREST,
      linear: TextureInfo.MinFilter.LINEAR,
      nearestMipmapLinear: TextureInfo.MinFilter.NEAREST_MIPMAP_LINEAR,
      linearMipmapLinear: TextureInfo.MinFilter.LINEAR_MIPMAP_LINEAR,
    };
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
  const transform: IHumanGltfTextureReference["transform"] =
    reference.transform;
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
