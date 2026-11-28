import {
  readEnvironmentColorSpace
} from "../../../../../packages/render/src/scene/internal/readEnvironmentColorSpace";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `readEnvironmentColorSpace` tells byte environments from float ones.
 *
 * Scenarios:
 *
 * 1. An unsigned-byte texture is `srgb`.
 * 2. Half-float and float textures are `linear-environment`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases name the three supported input component types and their expected sampling color space.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that byte environment maps use sRGB and both floating-point environment maps use linear environment space.
 * @evidence contracts/development/testing.md#independent-expectations Compares textures made with the fixture's unsigned-byte, half-float and float constants against explicit color-space strings.
 */
export function test_render_scene_read_environment_color_space(): void {
  const read = (
    type: THREE.TextureDataType,
  ): ReturnType<typeof readEnvironmentColorSpace> => {
    const texture: THREE.Texture = new THREE.Texture();
    texture.type = type;
    return readEnvironmentColorSpace(texture);
  };
  TestValidator.equals("bytes", read(THREE.UnsignedByteType), "srgb");
  TestValidator.equals("half", read(THREE.HalfFloatType), "linear-environment");
  TestValidator.equals("float", read(THREE.FloatType), "linear-environment");
}