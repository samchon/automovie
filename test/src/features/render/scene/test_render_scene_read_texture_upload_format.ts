import {
  readTextureUploadFormat
} from "../../../../../packages/render/src/scene/internal/readTextureUploadFormat";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `readTextureUploadFormat` names the storage a texture uploads as.
 *
 * Scenarios:
 *
 * 1. A declared internal format wins: RGBA32F, RGBA16F, R16F, RG16F, RGBA8 and
 *    SRGB8_ALPHA8 map to their names, and any other internal format is
 *    undefined.
 * 2. Without one, red or red-green half floats and RGBA bytes, halves and
 *    floats map to theirs; RGBA unsigned shorts and an RGB format are
 *    undefined.
 */
export function test_render_scene_read_texture_upload_format(): void {
  const declared = (
    internalFormat: THREE.PixelFormatGPU | null,
  ): ReturnType<typeof readTextureUploadFormat> => {
    const texture: THREE.Texture = new THREE.Texture();
    texture.internalFormat = internalFormat;
    return readTextureUploadFormat(texture);
  };
  TestValidator.equals("32f", declared("RGBA32F"), "rgba32f");
  TestValidator.equals("16f", declared("RGBA16F"), "rgba16f");
  TestValidator.equals("r16f", declared("R16F"), "r16f");
  TestValidator.equals("rg16f", declared("RG16F"), "rg16f");
  TestValidator.equals("rgba8", declared("RGBA8"), "rgba8");
  TestValidator.equals("srgb", declared("SRGB8_ALPHA8"), "rgba8");
  TestValidator.equals("other", declared("DEPTH_COMPONENT24"), undefined);

  const inferred = (
    format: THREE.AnyPixelFormat,
    type: THREE.TextureDataType,
  ): ReturnType<typeof readTextureUploadFormat> => {
    const texture: THREE.Texture = new THREE.Texture();
    texture.format = format;
    texture.type = type;
    return readTextureUploadFormat(texture);
  };
  TestValidator.equals("red half", inferred(THREE.RedFormat, THREE.HalfFloatType), "r16f");
  TestValidator.equals("rg half", inferred(THREE.RGFormat, THREE.HalfFloatType), "rg16f");
  TestValidator.equals("bytes", inferred(THREE.RGBAFormat, THREE.UnsignedByteType), "rgba8");
  TestValidator.equals("halves", inferred(THREE.RGBAFormat, THREE.HalfFloatType), "rgba16f");
  TestValidator.equals("floats", inferred(THREE.RGBAFormat, THREE.FloatType), "rgba32f");
  TestValidator.equals("shorts", inferred(THREE.RGBAFormat, THREE.UnsignedShortType), undefined);
  TestValidator.equals("rgb", inferred(THREE.RGBFormat, THREE.UnsignedByteType), undefined);
}