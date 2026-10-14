import {
  type IAutoMovieRenderTextureSource,
  measureAutoMovieRenderTextureClosure,
} from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieRenderTextureCost,
  IAutoMovieTextureReference,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/renderFixtures";

/**
 * Native generation allocates mip storage independently of filtering, while
 * explicit decoded levels remain resident. Invalid extents stay unknown.
 *
 * Scenarios:
 *
 * 1. Each authorable filter retains the exact 16+4+1 texel chain when generation
 *    is enabled and retains only16 base texels when generation is disabled.
 * 2. Existing levels remain counted under a nonmip filter, and legacy host
 *    facts retain their declared chain when generation was not reported.
 * 3. Invalid and overflowing environment derivatives have absent byte bounds.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures texture closure across sampling filters and generation/explicit-level facts, asserting exact chain or base bytes and unknown environment rows, detecting storage chosen solely from filtering, discarded explicit levels or unsafe environment dimensions certified as bytes.
 * @evidence contracts/testing.md#independent-expectations The authored 4-by-4 RGBA8 chain contains 16+4+1 texels at four bytes each, while a base-only upload has sixteen texels. Generation and explicit-level flags determine retained levels independently of minification choice; zero, unsafe extents and absent format have no storage authority.
 * @evidence contracts/testing.md#distinguishing-cases Every authorable filter has enabled and disabled generation twins; explicit levels and legacy unreported generation retain the chain, and inherited filtering is also checked. Environment cases independently remove width, height or format authority; native filter flags and actual object sharing have separate tests.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_texture_mip_policy entry owns synchronous engine closure assertions over explicit facts and material records, without decoding an image, allocating native texture levels, starting a renderer or installing a consumer.
 */
export function test_render_texture_mip_policy(): void {
  const sampler: NonNullable<IAutoMovieTextureReference["sampler"]> = {
    wrapS: "clamp" as const,
    wrapT: "clamp" as const,
    minFilter: "linear" as const,
    magFilter: "linear" as const,
  };
  const m: Omit<IAutoMovieMaterial, "baseColorTexture"> & {
    baseColorTexture: IAutoMovieTextureReference;
  } = {
    ...material("mat"),
    baseColorTexture: {
      asset: "image",
      texCoord: 0,
      colorSpace: "srgb" as const,
      sampler,
    },
  };
  const source: IAutoMovieRenderTextureSource = {
    asset: "image",
    width: 4,
    height: 4,
    format: "rgba8" as const,
    mipmapped: true,
  };
  const filters: readonly [
    "nearest",
    "linear",
    "nearestMipmapLinear",
    "linearMipmapLinear",
  ] = [
    "nearest",
    "linear",
    "nearestMipmapLinear",
    "linearMipmapLinear",
  ] as const;
  const bytes: (
    facts: typeof source & {
      generateMipmaps?: boolean;
      explicitMipmaps?: boolean;
    },
    minFilter?: (typeof filters)[number],
  ) => number | null = (
    facts: typeof source & {
      generateMipmaps?: boolean;
      explicitMipmaps?: boolean;
    },
    minFilter: (typeof filters)[number] = "linear",
  ): number | null =>
    measureAutoMovieRenderTextureClosure({
      materials: [
        {
          ...m,
          baseColorTexture: {
            ...m.baseColorTexture,
            sampler: { ...sampler, minFilter },
          },
        },
      ],
      sources: [facts],
      environment: null,
    }).find(
      (row: IAutoMovieRenderTextureCost): boolean => row.asset === "image",
    )!.bytes;
  TestValidator.equals("legacy chain", bytes(source), 84);
  for (const filter of filters) {
    TestValidator.equals(
      "native generation survives base-only sampling",
      bytes({ ...source, generateMipmaps: true }, filter),
      (16 + 4 + 1) * 4,
    );
    TestValidator.equals(
      "disabled generation retains only the base",
      bytes({ ...source, generateMipmaps: false }, filter),
      16 * 4,
    );
  }
  TestValidator.equals(
    "explicit levels",
    bytes({ ...source, generateMipmaps: false, explicitMipmaps: true }),
    84,
  );
  TestValidator.equals(
    "inherited filtering does not suppress native generation",
    measureAutoMovieRenderTextureClosure({
      materials: [material("legacy", "image")],
      sources: [{ ...source, sampler, generateMipmaps: true }],
      environment: null,
    }).find(
      (row: IAutoMovieRenderTextureCost): boolean => row.asset === "image",
    )!.bytes,
    (16 + 4 + 1) * 4,
  );
  for (const facts of [
    { ...source, width: 0 },
    { ...source, height: 0 },
    { ...source, width: Number.MAX_SAFE_INTEGER },
    { ...source, height: Number.MAX_SAFE_INTEGER },
    { ...source, format: undefined },
  ])
    TestValidator.predicate(
      "unbounded environment",
      measureAutoMovieRenderTextureClosure({
        materials: [m],
        sources: [facts],
        environment: "image",
      }).some(
        (row: IAutoMovieRenderTextureCost): boolean =>
          row.asset === "image" && row.bytes === null,
      ),
    );
}
