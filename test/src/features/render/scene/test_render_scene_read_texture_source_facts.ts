import type { IAutoMovieRenderTextureSource } from "@automovie/interface";
import { AutoMovieSceneTexture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";

import { throwsError } from "../../internal/predicates";

/**
 * Exercises ordinary decoded source representation, sampler projection and
 * invalid-extent refusal.
 *
 * Scenarios:
 *
 * 1. Authored component/internal/color-space formats distinguish supported
 *    ordinary source and environment projections from unknown representations.
 * 2. Independent S/T wraps and min/mag filters retain every supplied sampler field
 *    without changing the source; generation and explicit mip metadata remain
 *    distinct.
 * 3. Unsupported sampler values remain unreported and absent/nonpositive
 *    dimensions refuse.
 */
export async function test_render_scene_read_texture_source_facts(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const texture: ThreeTypes.Texture = new THREE.DataTexture(
    new Uint8Array(64),
    4,
    4,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  for (const [type, format] of [
    [THREE.UnsignedByteType, "rgba8"],
    [THREE.HalfFloatType, "rgba16f"],
    [THREE.FloatType, "rgba32f"],
  ] as const) {
    texture.type = type;
    TestValidator.equals(
      "actual component representation",
      AutoMovieSceneTexture.readSource("image", texture).format,
      format,
    );
    TestValidator.equals(
      "RGBA background factory follows component type",
      AutoMovieSceneTexture.readSource("image", texture).environmentBackgroundFormat,
      format,
    );
  }
  for (const [internalFormat, format] of [
    ["RGBA8", "rgba8"],
    ["SRGB8_ALPHA8", "rgba8"],
    ["RGBA16F", "rgba16f"],
    ["RGBA32F", "rgba32f"],
  ] as const) {
    texture.internalFormat = internalFormat;
    TestValidator.equals(
      "explicit internal representation",
      AutoMovieSceneTexture.readSource("image", texture).format,
      format,
    );
  }
  texture.internalFormat = "RGB16F";
  TestValidator.equals(
    "unsupported internal format",
    AutoMovieSceneTexture.readSource("image", texture).format,
    undefined,
  );
  texture.internalFormat = null;
  texture.format = THREE.RedFormat;
  texture.type = THREE.HalfFloatType;
  TestValidator.equals(
    "native single-channel half representation",
    AutoMovieSceneTexture.readSource("image", texture).format,
    "r16f",
  );
  texture.internalFormat = "R16F";
  TestValidator.equals(
    "explicit single-channel half representation",
    AutoMovieSceneTexture.readSource("image", texture).format,
    "r16f",
  );
  TestValidator.equals(
    "half component expands red into native RGBA background",
    AutoMovieSceneTexture.readSource("image", texture).environmentBackgroundFormat,
    "rgba16f",
  );
  texture.type = THREE.FloatType;
  TestValidator.equals(
    "internal half storage does not replace float cube output",
    [
      AutoMovieSceneTexture.readSource("image", texture).format,
      AutoMovieSceneTexture.readSource("image", texture).environmentBackgroundFormat,
    ],
    ["r16f", "rgba32f"],
  );
  texture.internalFormat = null;
  texture.type = THREE.FloatType;
  texture.format = THREE.RGFormat;
  TestValidator.equals(
    "unreported RG float representation",
    AutoMovieSceneTexture.readSource("image", texture).format,
    undefined,
  );
  texture.format = THREE.RedFormat;
  TestValidator.equals(
    "unreported R float representation",
    AutoMovieSceneTexture.readSource("image", texture).format,
    undefined,
  );
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.IntType;
  TestValidator.equals(
    "unsupported component type",
    AutoMovieSceneTexture.readSource("image", texture).format,
    undefined,
  );
  TestValidator.equals(
    "unsupported inherited cube component stays unknown",
    AutoMovieSceneTexture.readSource("image", texture).environmentBackgroundFormat,
    undefined,
  );
  texture.type = THREE.UnsignedByteType;
  for (const [colorSpace, expected] of [
    [THREE.SRGBColorSpace, "srgb"],
    [THREE.NoColorSpace, "linear"],
    [THREE.LinearSRGBColorSpace, "linear-environment"],
  ] as const) {
    texture.colorSpace = colorSpace;
    TestValidator.equals(
      "the supplied color-space field projects its decoding policy",
      AutoMovieSceneTexture.readSource("image", texture).colorSpace,
      expected,
    );
  }
  texture.colorSpace = "unsupported";
  TestValidator.equals(
    "unreported decoding",
    AutoMovieSceneTexture.readSource("image", texture).colorSpace,
    undefined,
  );
  TestValidator.equals(
    "byte environment decoding",
    AutoMovieSceneTexture.readSource("image", texture).environmentColorSpace,
    "srgb",
  );
  texture.type = THREE.HalfFloatType;
  TestValidator.equals(
    "float environment decoding",
    AutoMovieSceneTexture.readSource("image", texture).environmentColorSpace,
    "linear-environment",
  );
  texture.type = THREE.UnsignedByteType;
  for (const [minFilter, expectedMinFilter] of [
    [THREE.NearestFilter, "nearest"],
    [THREE.LinearFilter, "linear"],
    [THREE.NearestMipmapLinearFilter, "nearestMipmapLinear"],
    [THREE.LinearMipmapLinearFilter, "linearMipmapLinear"],
  ] as const) {
    texture.minFilter = minFilter;
    for (const [wrapS, expectedWrapS] of [
      [THREE.ClampToEdgeWrapping, "clamp"],
      [THREE.RepeatWrapping, "repeat"],
      [THREE.MirroredRepeatWrapping, "mirror"],
    ] as const)
      for (const [wrapT, expectedWrapT] of [
        [THREE.ClampToEdgeWrapping, "clamp"],
        [THREE.RepeatWrapping, "repeat"],
        [THREE.MirroredRepeatWrapping, "mirror"],
      ] as const) {
        texture.wrapS = wrapS;
        texture.wrapT = wrapT;
        for (const [magFilter, expectedMagFilter] of [
          [THREE.NearestFilter, "nearest"],
          [THREE.LinearFilter, "linear"],
        ] as const) {
          texture.magFilter = magFilter;
          const fact: IAutoMovieRenderTextureSource =
            AutoMovieSceneTexture.readSource("image", texture);
          TestValidator.equals(
            "every inherited sampler field retains its own authored value",
            fact.sampler,
            {
              wrapS: expectedWrapS,
              wrapT: expectedWrapT,
              minFilter: expectedMinFilter,
              magFilter: expectedMagFilter,
            },
          );
          TestValidator.equals(
            "decoded dimensions",
            [fact.width, fact.height],
            [4, 4],
          );
          TestValidator.equals(
            "sampler observation does not change the source",
            [
              texture.wrapS,
              texture.wrapT,
              texture.minFilter,
              texture.magFilter,
            ],
            [wrapS, wrapT, minFilter, magFilter],
          );
        }
      }
  }
  for (const generate of [false, true])
    for (const filter of [
      THREE.NearestFilter,
      THREE.LinearFilter,
      THREE.NearestMipmapNearestFilter,
      THREE.NearestMipmapLinearFilter,
      THREE.LinearMipmapNearestFilter,
      THREE.LinearMipmapLinearFilter,
    ]) {
      texture.generateMipmaps = generate;
      texture.minFilter = filter;
      TestValidator.equals(
        "requested generation metadata is independent of filtering",
        AutoMovieSceneTexture.readSource("image", texture).mipmapped,
        generate,
      );
    }
  texture.generateMipmaps = false;
  texture.mipmaps = [
    { width: 4, height: 4, data: new Uint8Array(64) },
    { width: 2, height: 2, data: new Uint8Array(16) },
  ];
  TestValidator.equals(
    "explicit chain",
    AutoMovieSceneTexture.readSource("image", texture).explicitMipmaps,
    true,
  );
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  TestValidator.equals(
    "unreported filter",
    AutoMovieSceneTexture.readSource("image", texture).sampler,
    undefined,
  );
  texture.minFilter = THREE.NearestFilter;
  for (const image of [
    null,
    {},
    { width: 4 },
    { width: 0, height: 4 },
    { width: 4, height: 0 },
  ]) {
    texture.image = image;
    TestValidator.predicate(
      "invalid decoded extent",
      throwsError(
        (): IAutoMovieRenderTextureSource =>
          AutoMovieSceneTexture.readSource("image", texture),
        "image",
      ),
    );
  }
  texture.dispose();
}
