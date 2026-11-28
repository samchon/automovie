import { AutoMovieEngineRenderTexture } from "@automovie/engine";
import {
  IAutoMovieMaterial,
  IAutoMovieRenderTextureCost,
  type IAutoMovieRenderTextureResidency,
  type IAutoMovieRenderTextureSource,
} from "@automovie/interface";
import { AutoMovieRenderSceneTexture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { DataTexture } from "three";

import { throwsError } from "../../internal/predicates";
import { material } from "../../internal/renderFixtures";

/**
 * Runtime data-table facts participate in texture accounting independently of
 * authored asset files. Source and upload-state identity determine sharing
 * under the declared storage policy.
 *
 * Scenarios:
 *
 * 1. A 64-by-6 RGBA32F nonmip cycle table costs 64_6_16 bytes; aliases of the same
 *    Source/state share it, while a different color-space key splits it.
 * 2. The same table serving an authored linear map shares one raw allocation and
 *    keeps both asset and generating runtime attribution.
 * 3. Missing identity/decoding, duplicate owners and conflicting extents refuse a
 *    complete bound; runtime token renaming preserves target identity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe runtime table size and format, upload-key sharing, dual ownership and incomplete storage claims.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that upload-state variants split shared sources, equivalent runtime and authored uses retain both owners, and missing identity or conflicting extent refuses a complete bound.
 * @evidence contracts/development/testing.md#independent-expectations Derives each allocation as `64 × 6 × 16` bytes for RGBA32F and uses separate fixture owners and upload variants to specify one or two allocations.
 */
export async function test_render_scene_read_texture_source_runtime_texture_storage(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const table: DataTexture = new THREE.DataTexture(
    new Float32Array(64 * 6 * 4),
    64,
    6,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  const { asset: _asset, ...texture }: IAutoMovieRenderTextureSource =
    AutoMovieRenderSceneTexture.readSource("table", table);
  const profile: (
    runtimeTextures: NonNullable<
      IAutoMovieRenderTextureResidency["runtimeTextures"]
    >,
  ) => IAutoMovieRenderTextureResidency = (
    runtimeTextures: NonNullable<
      IAutoMovieRenderTextureResidency["runtimeTextures"]
    >,
  ): IAutoMovieRenderTextureResidency => ({
    owner: "shot",
    residents: [],
    dfgRetained: false,
    pmremRetained: null,
    runtimeTextures,
  });
  const first: NonNullable<
    IAutoMovieRenderTextureResidency["runtimeTextures"]
  >[number] = { owner: "formation:a/gait:walk", texture };
  const second: NonNullable<
    IAutoMovieRenderTextureResidency["runtimeTextures"]
  >[number] = { owner: "formation:a/gait:run", texture: { ...texture } };
  const close: (
    runtimeTextures?: NonNullable<
      IAutoMovieRenderTextureResidency["runtimeTextures"]
    >,
  ) => IAutoMovieRenderTextureCost[] = (
    runtimeTextures: NonNullable<
      IAutoMovieRenderTextureResidency["runtimeTextures"]
    > = [first, second],
  ): IAutoMovieRenderTextureCost[] =>
    AutoMovieEngineRenderTexture.measureAutoMovieRenderTextureClosure({
      materials: [],
      sources: [],
      environment: null,
      residency: profile(runtimeTextures),
    });
  TestValidator.equals(
    "shared actual table storage",
    close().map(
      (
        row: IAutoMovieRenderTextureCost,
      ): (number | string[] | null | undefined)[] => [
        row.bytes,
        row.runtimeOwners,
      ],
    ),
    [[64 * 6 * 16, [second.owner, first.owner]]],
  );
  TestValidator.equals(
    "native decoding keys split",
    close([
      first,
      { ...second, texture: { ...texture, colorSpace: "linear-environment" } },
    ]).map((row: IAutoMovieRenderTextureCost): number | null => row.bytes),
    [64 * 6 * 16, 64 * 6 * 16],
  );
  const binding: IAutoMovieMaterial = {
    ...material("m"),
    normalTexture: "table",
  };
  const shared: IAutoMovieRenderTextureCost[] =
    AutoMovieEngineRenderTexture.measureAutoMovieRenderTextureClosure({
      materials: [binding],
      sources: [{ ...texture, asset: "table" }],
      environment: null,
      residency: profile([first]),
    });
  const row: IAutoMovieRenderTextureCost = shared.find(
    (cost: IAutoMovieRenderTextureCost): boolean => cost.asset === "table",
  )!;
  TestValidator.equals(
    "runtime table shares a material upload",
    [row.bytes, row.materials, row.runtimeOwners],
    [64 * 6 * 16, ["m"], [first.owner]],
  );
  for (const missing of [
    { sourceIdentity: undefined },
    { colorSpace: undefined },
    { uploadState: undefined },
    { format: undefined },
  ])
    TestValidator.equals(
      "unknown runtime representation",
      close([{ ...first, texture: { ...texture, ...missing } }])[0].bytes,
      null,
    );
  for (const owner of [first.owner])
    TestValidator.predicate(
      "runtime owner refusal",
      throwsError(
        (): IAutoMovieRenderTextureCost[] =>
          close([first, { ...second, owner }]),
        "Runtime texture owner",
      ),
    );
  TestValidator.predicate(
    "conflicting shared runtime extent",
    throwsError(
      (): IAutoMovieRenderTextureCost[] =>
        close([first, { ...second, texture: { ...texture, width: 32 } }]),
      "contradictory resident",
    ),
  );
  const digest: string = AutoMovieEngineRenderTexture.autoMovieRenderTextureDigest(
    [],
    profile([first, second]),
  );
  TestValidator.equals(
    "runtime object token spelling is irrelevant",
    AutoMovieEngineRenderTexture.autoMovieRenderTextureDigest(
      [],
      profile(
        [first, second].map(
          (
            item: NonNullable<
              IAutoMovieRenderTextureResidency["runtimeTextures"]
            >[number],
          ): NonNullable<
            IAutoMovieRenderTextureResidency["runtimeTextures"]
          >[number] => ({
            ...item,
            texture: {
              ...item.texture,
              sourceIdentity: "renamed",
              textureIdentity: "also-renamed",
            },
          }),
        ),
      ),
    ),
    digest,
  );
  TestValidator.predicate(
    "runtime decode affects target",
    AutoMovieEngineRenderTexture.autoMovieRenderTextureDigest(
      [],
      profile([
        { ...first, texture: { ...texture, colorSpace: "srgb" } },
        second,
      ]),
    ) !== digest,
  );
  TestValidator.predicate(
    "runtime source split affects target",
    AutoMovieEngineRenderTexture.autoMovieRenderTextureDigest(
      [],
      profile([
        first,
        { ...second, texture: { ...texture, sourceIdentity: "new-source" } },
      ]),
    ) !== digest,
  );
  TestValidator.predicate(
    "runtime digest owner refusal",
    throwsError(
      (): string => AutoMovieEngineRenderTexture.autoMovieRenderTextureDigest([], profile([first, first])),
      "Runtime texture owner",
    ),
  );
  table.dispose();
}
