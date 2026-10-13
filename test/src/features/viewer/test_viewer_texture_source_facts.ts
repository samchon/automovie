import type * as ThreeTypes from "three";
import { readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Capture facts follow the actual decoded texture before upload, including its
 * component representation and inherited sampling. Unsupported storage is not
 * silently described as an eight-bit image.
 *
 * Scenarios:
 *
 * 1. RGBA unsigned byte, half and float sources report 4-by-4 dimensions and
 *    their actual component width; explicit internal formats take precedence.
 * 2. Wrap and each supported filter are reported without changing the source;
 *    generated and explicit mip policies remain distinct facts.
 * 3. Unknown format/filter/wrap state stays unreported; absent or invalid image
 *    extents refuse with the source asset's diagnostic.
 */
export const test_viewer_texture_source_facts = async (): Promise<void> => {
  const THREE = await import("three");
  const texture: ThreeTypes.Texture = new THREE.DataTexture(new Uint8Array(64), 4, 4, THREE.RGBAFormat, THREE.UnsignedByteType);
  for (const [type, format] of [[THREE.UnsignedByteType, "rgba8"], [THREE.HalfFloatType, "rgba16f"], [THREE.FloatType, "rgba32f"]] as const) {
    texture.type = type;
    TestValidator.equals("actual component representation", readAutoMovieTextureSource("image", texture).format, format);
    TestValidator.equals("RGBA background factory follows component type", readAutoMovieTextureSource("image", texture).environmentBackgroundFormat, format);
  }
  for (const [internalFormat, format] of [["RGBA8", "rgba8"], ["SRGB8_ALPHA8", "rgba8"], ["RGBA16F", "rgba16f"], ["RGBA32F", "rgba32f"]] as const) {
    texture.internalFormat = internalFormat;
    TestValidator.equals("explicit internal representation", readAutoMovieTextureSource("image", texture).format, format);
  }
  texture.internalFormat = "RGB16F";
  TestValidator.equals("unsupported internal format", readAutoMovieTextureSource("image", texture).format, undefined);
  texture.internalFormat = null;
  texture.format = THREE.RedFormat;
  texture.type = THREE.HalfFloatType;
  TestValidator.equals("native single-channel half representation", readAutoMovieTextureSource("image", texture).format, "r16f");
  texture.internalFormat = "R16F";
  TestValidator.equals("explicit single-channel half representation", readAutoMovieTextureSource("image", texture).format, "r16f");
  TestValidator.equals("half component expands red into native RGBA background", readAutoMovieTextureSource("image", texture).environmentBackgroundFormat, "rgba16f");
  texture.type = THREE.FloatType;
  TestValidator.equals("internal half storage does not replace float cube output", [readAutoMovieTextureSource("image", texture).format,
    readAutoMovieTextureSource("image", texture).environmentBackgroundFormat], ["r16f", "rgba32f"]);
  texture.internalFormat = null;
  texture.type = THREE.FloatType;
  texture.format = THREE.RGFormat;
  TestValidator.equals("unreported RG float representation", readAutoMovieTextureSource("image", texture).format, undefined);
  texture.format = THREE.RedFormat;
  TestValidator.equals("unreported R float representation", readAutoMovieTextureSource("image", texture).format, undefined);
  texture.format = THREE.RedFormat;
  TestValidator.equals("unsupported channel format", readAutoMovieTextureSource("image", texture).format, undefined);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.IntType;
  TestValidator.equals("unsupported component type", readAutoMovieTextureSource("image", texture).format, undefined);
  TestValidator.equals("unsupported inherited cube component stays unknown", readAutoMovieTextureSource("image", texture).environmentBackgroundFormat, undefined);
  texture.type = THREE.UnsignedByteType;
  for (const [colorSpace, expected] of [[THREE.SRGBColorSpace, "srgb"], [THREE.NoColorSpace, "linear"], [THREE.LinearSRGBColorSpace, "linear-environment"]] as const) {
    texture.colorSpace = colorSpace;
    TestValidator.equals("actual upload decoding", readAutoMovieTextureSource("image", texture).colorSpace, expected);
  }
  texture.colorSpace = "unsupported";
  TestValidator.equals("unreported decoding", readAutoMovieTextureSource("image", texture).colorSpace, undefined);
  TestValidator.equals("byte environment decoding", readAutoMovieTextureSource("image", texture).environmentColorSpace, "srgb");
  texture.type = THREE.HalfFloatType;
  TestValidator.equals("float environment decoding", readAutoMovieTextureSource("image", texture).environmentColorSpace, "linear-environment");
  texture.type = THREE.UnsignedByteType;
  for (const minFilter of [THREE.NearestFilter, THREE.LinearFilter, THREE.NearestMipmapLinearFilter, THREE.LinearMipmapLinearFilter]) {
    texture.minFilter = minFilter;
    for (const wrap of [THREE.ClampToEdgeWrapping, THREE.RepeatWrapping, THREE.MirroredRepeatWrapping]) {
      texture.wrapS = wrap;
      texture.wrapT = wrap;
      for (const magFilter of [THREE.NearestFilter, THREE.LinearFilter]) {
        texture.magFilter = magFilter;
        const fact = readAutoMovieTextureSource("image", texture);
        TestValidator.predicate("supported inherited sampler", fact.sampler !== undefined);
        TestValidator.equals("decoded dimensions", [fact.width, fact.height], [4, 4]);
        TestValidator.equals("source remains unchanged", texture.wrapS, wrap);
      }
    }
  }
  for (const generate of [false, true])
    for (const filter of [THREE.NearestFilter, THREE.LinearFilter,
      THREE.NearestMipmapNearestFilter, THREE.NearestMipmapLinearFilter,
      THREE.LinearMipmapNearestFilter, THREE.LinearMipmapLinearFilter]) {
      texture.generateMipmaps = generate;
      texture.minFilter = filter;
      TestValidator.equals("native generation is independent of filtering", readAutoMovieTextureSource("image", texture).mipmapped, generate);
    }
  texture.generateMipmaps = false;
  texture.mipmaps = [{ width: 4, height: 4, data: new Uint8Array(64) }, { width: 2, height: 2, data: new Uint8Array(16) }];
  TestValidator.equals("explicit chain", readAutoMovieTextureSource("image", texture).explicitMipmaps, true);
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  TestValidator.equals("unreported filter", readAutoMovieTextureSource("image", texture).sampler, undefined);
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = 999 as ThreeTypes.Wrapping;
  TestValidator.equals("unreported S wrap", readAutoMovieTextureSource("image", texture).sampler, undefined);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = 999 as ThreeTypes.Wrapping;
  TestValidator.equals("unreported T wrap", readAutoMovieTextureSource("image", texture).sampler, undefined);
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = 999 as ThreeTypes.MagnificationTextureFilter;
  TestValidator.equals("unreported magnification filter", readAutoMovieTextureSource("image", texture).sampler, undefined);
  for (const image of [null, false, 4, "image", {}, { width: 4 }, { width: "4", height: 4 }, { width: 4, height: "4" }, { width: 0, height: 4 }, { width: 4, height: 0 }, { width: 1.5, height: 4 }, { width: 4, height: Infinity }]) {
    texture.image = image;
    TestValidator.predicate("invalid decoded extent", throwsError(() => readAutoMovieTextureSource("image", texture), "image"));
  }
  texture.dispose();
};
