import {
  autoMovieRenderTextureDigest,
  measureAutoMovieRenderTextureClosure,
  measureAutoMovieRenderTextureTarget,
} from "@automovie/engine";
import type {
  IAutoMovieRenderTextureCost,
  IAutoMovieRenderTextureResidency,
  IAutoMovieRenderTextureResident,
  IAutoMovieRenderTextureTarget,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Shadow consumers require their map and VSM blur attachments. Native cube
 * faces and RG half components count storage independently of Texture objects.
 * Conservative retained/planned phase unions never claim current GPU counters.
 *
 * Scenarios:
 *
 * 1. A 4-by-4 PCF color/depth pair costs128bytes in two textures; point shadows
 *    retain six faces, and VSM adds its RG-half/depth blur target.
 * 2. Missing map, blur, other-scope policy and wrong-scope target facts remain
 *    unknown beside supported complete twins; retained resources survive policy removal.
 * 3. Distinct actual/planned extents remain a conservative union, while target
 *    role, face population and retained scope policy affect report freshness.
 */
export function test_unit_render_scene_shadow_texture_storage(): void {
  const target: IAutoMovieRenderTextureTarget = {
    owner: "map",
    shadow: { scope: "shot", light: "sun", role: "map" },
    width: 4,
    height: 4,
    formats: ["rgba8"],
    mipmapped: false,
    samples: 0,
    depthBytesPerTexel: 4,
    depthTexture: true,
  };
  const residency: IAutoMovieRenderTextureResidency = {
    owner: "shot",
    residents: [],
    dfgRetained: false,
    pmremRetained: null,
    renderTargets: [target],
  };
  const close: (
    targets?: IAutoMovieRenderTextureTarget[],
    filterDraws?: number,
  ) => IAutoMovieRenderTextureCost[] = (
    targets: IAutoMovieRenderTextureTarget[] = [target],
    filterDraws: number = 0,
  ): IAutoMovieRenderTextureCost[] =>
    measureAutoMovieRenderTextureClosure({
      materials: [],
      sources: [],
      environment: null,
      shadowCasters: [{ light: "sun", filterDraws }],
      residency: { ...residency, renderTargets: targets },
    });
  TestValidator.equals(
    "complete PCF map",
    close().map((row: IAutoMovieRenderTextureCost): unknown[] => [
      row.bytes,
      row.allocations,
      row.residents,
    ]),
    [[4 * 4 * (4 + 4), 2, ["shot"]]],
  );
  TestValidator.equals(
    "cube color and depth faces",
    measureAutoMovieRenderTextureTarget({ ...target, faces: 6 }),
    6 * 4 * 4 * (4 + 4),
  );
  const vsm: IAutoMovieRenderTextureTarget = { ...target, formats: ["rg16f"] };
  const blur: IAutoMovieRenderTextureTarget = {
    ...vsm,
    owner: "blur",
    shadow: { ...target.shadow!, role: "blur" },
    depthTexture: false,
  };
  TestValidator.equals(
    "VSM map plus blur bytes",
    close([vsm, blur], 2).reduce(
      (sum: number, row: IAutoMovieRenderTextureCost): number =>
        sum + row.bytes!,
      0,
    ),
    2 * 4 * 4 * (2 * 2 + 4),
  );
  TestValidator.equals(
    "VSM color and custom-depth population",
    close([vsm, blur], 2).reduce(
      (sum: number, row: IAutoMovieRenderTextureCost): number =>
        sum + row.allocations!,
      0,
    ),
    3,
  );
  TestValidator.equals(
    "missing map remains unknown",
    close([]).map(
      (row: IAutoMovieRenderTextureCost): number | null => row.bytes,
    ),
    [null],
  );
  TestValidator.equals(
    "missing VSM blur remains unknown",
    close([vsm], 2).filter(
      (row: IAutoMovieRenderTextureCost): boolean => row.bytes === null,
    ).length,
    1,
  );
  TestValidator.equals(
    "wrong scope cannot satisfy map",
    close([
      { ...target, shadow: { ...target.shadow!, scope: "other" } },
    ]).filter((row: IAutoMovieRenderTextureCost): boolean => row.bytes === null)
      .length,
    1,
  );
  const other: IAutoMovieRenderTextureResident = {
    owner: "other",
    materials: [],
    sources: [],
    environment: null,
  };
  const scoped: (
    shadowCasters?: readonly { light: string; filterDraws: number }[],
  ) => IAutoMovieRenderTextureCost[] = (
    shadowCasters?: readonly { light: string; filterDraws: number }[],
  ): IAutoMovieRenderTextureCost[] =>
    measureAutoMovieRenderTextureClosure({
      materials: [],
      sources: [],
      environment: null,
      residency: {
        ...residency,
        renderTargets: [],
        residents: [{ ...other, shadowCasters }],
      },
    });
  TestValidator.equals(
    "unreported other-scope shadow policy is unknown",
    scoped().map(
      (row: IAutoMovieRenderTextureCost): number | null => row.bytes,
    ),
    [null],
  );
  TestValidator.equals(
    "observed empty other-scope policy is empty",
    scoped([]),
    [],
  );
  TestValidator.equals(
    "other-scope required map is unknown",
    scoped([{ light: "sun", filterDraws: 0 }]).map(
      (row: IAutoMovieRenderTextureCost): number | null => row.bytes,
    ),
    [null],
  );
  TestValidator.equals(
    "policy removal retains actual target",
    measureAutoMovieRenderTextureClosure({
      materials: [],
      sources: [],
      environment: null,
      residency,
    }).map((row: IAutoMovieRenderTextureCost): number | null => row.bytes),
    [128],
  );
  TestValidator.equals(
    "retained and planned phase union",
    close([
      target,
      { ...target, owner: "planned-map", width: 8, height: 8 },
    ]).reduce(
      (sum: number, row: IAutoMovieRenderTextureCost): number =>
        sum + row.bytes!,
      0,
    ),
    128 + 8 * 8 * 8,
  );
  const digest: string = autoMovieRenderTextureDigest([], residency);
  for (const change of [
    { faces: 6 as const },
    { shadow: { ...target.shadow!, light: "other" } },
    { shadow: undefined },
  ])
    TestValidator.predicate(
      "shadow profile affects freshness",
      autoMovieRenderTextureDigest([], {
        ...residency,
        renderTargets: [{ ...target, ...change }],
      }) !== digest,
    );
  TestValidator.predicate(
    "other-scope policy affects freshness",
    autoMovieRenderTextureDigest([], { ...residency, residents: [other] }) !==
      autoMovieRenderTextureDigest([], {
        ...residency,
        residents: [{ ...other, shadowCasters: [] }],
      }),
  );
  TestValidator.equals(
    "face expansion overflow remains unknown",
    measureAutoMovieRenderTextureTarget({
      ...target,
      width: 2 ** 25,
      height: 2 ** 24,
      faces: 6,
    }),
    null,
  );
}
