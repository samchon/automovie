import {
  type IAutoMovieRenderTextureSource,
  autoMovieRenderTextureDigest,
  measureAutoMovieRenderTextureClosure,
  sumAutoMovieRenderTextureAllocations,
} from "@automovie/engine";
import {
  IAutoMovieCompiledShotSource,
  IAutoMovieMaterial,
  IAutoMovieRenderTextureCost,
  IAutoMovieTextureReference,
} from "@automovie/interface";
import {
  IAutoMovieRenderBudgetAssessment,
  assessAutoMovieRenderBudget,
  autoMovieRenderBudgetEvidence,
  autoMovieRenderBudgetRefusal,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { compiledShotFixture } from "../internal/renderBudgetFixtures";
import { material, sceneFixture } from "../internal/renderFixtures";

/**
 * Configured sampling and the native sharp-conversion sampling are alternative initialization intents, not proof of equal resident handles. Their union bounds either first-upload order and shares equivalent material uploads.
 *
 * Scenarios:
 * 1. Mip-linear material and image lighting require two raw states; a nearest material adds a third conservative state, while equal linear choices merge.
 * 2. Missing or explicitly unsupported factory intent refuses before drawing; a supplied native state and known non-mip-linear legacy sampling recover.
 * 3. Generation, HDR width, independent source scopes and target sealing retain their own quantities, and non-environment materials ignore factory intent.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures real texture closure and render-budget refusal from supplied configured/native sampler facts, asserting raw-state sharing, byte bounds, unknown-state refusal and target identity changes.
 * @evidence contracts/testing.md#independent-expectations RGBA mip sizes sum 16+4+1 texels, cube faces multiply by six, atlas dimensions and DFG element widths supply the declared storage totals independently. Supplied factory facts model prospective uploads and do not observe native handles or GPU retirement.
 * @evidence contracts/testing.md#distinguishing-cases Distinct, equal, nearest, missing and explicitly unsupported sampler states cover order, shared scenes, generation, HDR and non-environment twins; omitted decoded sources and allocation authority remain unknown.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_environment_sampler_intents owns its cases. Portable metadata and budget composition over authored facts, with no native upload, decoder or renderer.
 */
export function test_render_environment_sampler_intents(): void {
  const mip: NonNullable<IAutoMovieTextureReference["sampler"]> = {
    wrapS: "clamp",
    wrapT: "clamp",
    minFilter: "linearMipmapLinear",
    magFilter: "linear",
  };
  const linear: typeof mip = { ...mip, minFilter: "linear" };
  const source: IAutoMovieRenderTextureSource = {
    asset: "sky",
    width: 4,
    height: 4,
    format: "rgba8",
    environmentBackgroundFormat: "rgba8",
    environmentColorSpace: "srgb",
    mipmapped: true,
    generateMipmaps: true,
    sampler: mip,
    samplerState: "configured-mip",
    environmentSampler: linear,
    environmentSamplerState: "factory-linear",
    sourceIdentity: "pixels",
    textureIdentity: "environment",
    uploadState: "rgba8-generated",
  };
  const surface: (
    sampler?: NonNullable<IAutoMovieTextureReference["sampler"]>,
  ) => IAutoMovieMaterial = (
    sampler: NonNullable<IAutoMovieTextureReference["sampler"]> = mip,
  ): IAutoMovieMaterial => ({
    ...material("surface"),
    baseColorTexture: {
      asset: "sky",
      texCoord: 0,
      colorSpace: "srgb" as const,
      sampler,
    },
  });
  const close: (
    facts?: IAutoMovieRenderTextureSource,
    sampler?: NonNullable<IAutoMovieTextureReference["sampler"]>,
  ) => IAutoMovieRenderTextureCost[] = (
    facts: IAutoMovieRenderTextureSource = source,
    sampler: NonNullable<IAutoMovieTextureReference["sampler"]> = mip,
  ): IAutoMovieRenderTextureCost[] =>
    measureAutoMovieRenderTextureClosure({
      materials: [surface(sampler)],
      sources: [facts],
      environment: "sky",
    });
  const raw: (
    rows: IAutoMovieRenderTextureCost[],
  ) => IAutoMovieRenderTextureCost[] = (
    rows: ReturnType<typeof close>,
  ): IAutoMovieRenderTextureCost[] =>
    rows.filter(
      (row: IAutoMovieRenderTextureCost): boolean =>
        row.asset === "sky" && !row.variant!.startsWith("environment-"),
    );
  const bytes: (rows: IAutoMovieRenderTextureCost[]) => number = (
    rows: ReturnType<typeof close>,
  ): number =>
    rows.reduce(
      (sum: number, row: IAutoMovieRenderTextureCost): number =>
        sum + row.bytes!,
      0,
    );
  const image: number = (16 + 4 + 1) * 4;
  const cube: number = 6 * (image + 16 * 4);
  const atlas: number = 3 * 112 * 4 * 8;
  const dfg: number = 16 * 16 * 2 * 2;
  TestValidator.equals(
    "two native raw intents share the mip material",
    raw(close()).map(
      (row: IAutoMovieRenderTextureCost): number | null => row.bytes,
    ),
    [image, image],
  );
  TestValidator.equals(
    "initialization union has an independent byte upper bound",
    bytes(close()),
    2 * image + cube + 2 * atlas + dfg,
  );
  TestValidator.equals(
    "union allocation upper bound",
    sumAutoMovieRenderTextureAllocations(close()),
    6,
  );
  const sharedScopes: IAutoMovieRenderTextureCost[] =
    measureAutoMovieRenderTextureClosure({
      materials: [surface()],
      sources: [source],
      environment: "sky",
      residency: {
        owner: "a",
        environmentTexture: source,
        dfgRetained: false,
        pmremRetained: null,
        residents: [
          {
            owner: "b",
            materials: [surface()],
            sources: [source],
            environment: "sky",
            environmentTexture: {
              ...source,
              textureIdentity: "another-environment",
            },
            shadowCasters: [],
            areaLights: false,
          },
        ],
      },
    });
  TestValidator.equals(
    "two live scenes still share both raw intent states",
    raw(sharedScopes).length,
    2,
  );
  TestValidator.equals(
    "scene-local derivatives and context scratch remain separate",
    bytes(sharedScopes),
    2 * image + 2 * cube + 3 * atlas + dfg,
  );
  const materialFirst: IAutoMovieRenderTextureCost[] =
    measureAutoMovieRenderTextureClosure({
      materials: [],
      defaultPbr: true,
      sources: [source],
      environment: "sky",
      residency: {
        owner: "environment-after-material",
        environmentTexture: source,
        dfgRetained: true,
        pmremRetained: null,
        residents: [
          {
            owner: "material-before-environment",
            materials: [surface()],
            sources: [source],
            environment: null,
            shadowCasters: [],
            areaLights: false,
          },
        ],
      },
    });
  TestValidator.equals(
    "earlier material upload preserves the same finite raw union",
    raw(materialFirst).length,
    2,
  );
  TestValidator.equals(
    "initialization order keeps the same storage upper bound",
    bytes(materialFirst),
    2 * image + cube + 2 * atlas + dfg,
  );
  const nearest: typeof mip = {
    ...mip,
    minFilter: "nearest",
    magFilter: "nearest",
  };
  TestValidator.equals(
    "nearest plus two environment choices remains conservative",
    raw(close(source, nearest)).length,
    3,
  );
  TestValidator.equals(
    "nearest conservative byte upper bound",
    bytes(close(source, nearest)),
    3 * image + cube + 2 * atlas + dfg,
  );
  const equal: IAutoMovieRenderTextureSource = {
    ...source,
    sampler: linear,
    environmentSampler: linear,
    samplerState: "linear",
    environmentSamplerState: "linear",
  };
  TestValidator.equals(
    "equal configured and factory choices collapse",
    raw(close(equal, linear)).length,
    1,
  );
  const legacy: IAutoMovieRenderTextureSource = {
    ...equal,
    environmentSampler: undefined,
    environmentSamplerState: undefined,
  };
  TestValidator.equals(
    "known legacy linear sampling needs no alternate key",
    bytes(close(legacy, linear)),
    image + cube + 2 * atlas + dfg,
  );
  const missing: IAutoMovieRenderTextureSource = {
    ...source,
    environmentSampler: undefined,
    environmentSamplerState: undefined,
  };
  TestValidator.predicate(
    "missing mip factory leaves raw cardinality unknown",
    raw(close(missing)).some(
      (row: IAutoMovieRenderTextureCost): boolean =>
        row.bytes === null && row.allocations === null,
    ),
  );
  const inherited: IAutoMovieRenderTextureSource = {
    ...missing,
    sampler: undefined,
  };
  TestValidator.predicate(
    "unreported inherited sampling cannot skip factory authority",
    raw(close(inherited)).some(
      (row: IAutoMovieRenderTextureCost): boolean => row.bytes === null,
    ),
  );
  const native: IAutoMovieRenderTextureSource = {
    ...source,
    sampler: undefined,
    environmentSampler: undefined,
  };
  TestValidator.equals(
    "reported native opaque choices remain bounded",
    raw(close(native)).length,
    3,
  );
  TestValidator.equals(
    "reported factory descriptor needs no separate opaque token",
    raw(close({ ...source, environmentSamplerState: undefined })).length,
    2,
  );
  const unsupported: IAutoMovieRenderTextureSource = {
    ...source,
    environmentSamplerState: null,
  };
  TestValidator.predicate(
    "explicit null overrides a supplied factory descriptor",
    raw(close(unsupported)).some(
      (row: IAutoMovieRenderTextureCost): boolean =>
        row.bytes === null && row.allocations === null,
    ),
  );
  TestValidator.predicate(
    "uncertified allocation survives both intents",
    raw(close({ ...source, allocationStateKnown: false })).every(
      (row: IAutoMovieRenderTextureCost): boolean => row.bytes === null,
    ),
  );
  TestValidator.predicate(
    "absent decoded source stays unknown",
    measureAutoMovieRenderTextureClosure({
      materials: [],
      sources: [],
      environment: "sky",
    }).some((row: IAutoMovieRenderTextureCost): boolean => row.bytes === null),
  );
  const baseOnly: IAutoMovieRenderTextureSource = {
    ...equal,
    mipmapped: false,
    generateMipmaps: false,
  };
  TestValidator.equals(
    "base-only complete linear allocation",
    bytes(close(baseOnly, linear)),
    16 * 4 + 6 * 16 * (4 + 4) + 2 * atlas + dfg,
  );
  const hdr: IAutoMovieRenderTextureSource = {
    ...legacy,
    format: "rgba16f" as const,
    environmentBackgroundFormat: "rgba16f" as const,
    environmentColorSpace: "linear-environment" as const,
    mipmapped: false,
    generateMipmaps: false,
  };
  TestValidator.equals(
    "HDR no-material legacy linear image keeps one raw state",
    bytes(
      measureAutoMovieRenderTextureClosure({
        materials: [],
        sources: [hdr],
        environment: "sky",
      }),
    ),
    16 * 8 + 6 * 16 * (8 + 4),
  );
  const digest: string = autoMovieRenderTextureDigest([source]);
  TestValidator.predicate(
    "factory choice reseals upload-aware target",
    digest !== autoMovieRenderTextureDigest([equal]),
  );
  TestValidator.predicate(
    "missing factory differs from observed choice",
    digest !== autoMovieRenderTextureDigest([missing]),
  );
  TestValidator.predicate(
    "native factory state changes its digest",
    digest !==
      autoMovieRenderTextureDigest([
        { ...source, environmentSamplerState: "different-factory" },
      ]),
  );
  TestValidator.predicate(
    "explicit unsupported factory differs from missing",
    autoMovieRenderTextureDigest([unsupported]) !==
      autoMovieRenderTextureDigest([missing]),
  );
  const compiled: IAutoMovieCompiledShotSource = compiledShotFixture({
    models: [],
    scene: {
      ...sceneFixture(),
      nodes: [],
      lights: [],
      environment: {
        image: "sky",
        background: null,
        intensity: 1,
        rotationDeg: 0,
        exposure: 1,
        toneMapping: "none",
        shadows: { enabled: false, type: "pcf" },
      },
    },
  });
  const assess: (
    facts: IAutoMovieRenderTextureSource,
  ) => IAutoMovieRenderBudgetAssessment = (
    facts: IAutoMovieRenderTextureSource,
  ): IAutoMovieRenderBudgetAssessment =>
    assessAutoMovieRenderBudget({
      compiled,
      shot: "factory-intent",
      budget: null,
      textures: [facts],
      assets: [],
      renderer: {
        api: "webgl2",
        vendor: "typed-host-facts",
        device: "no-gpu-unit",
      },
      settings: {
        width: 32,
        height: 32,
        pixelRatio: 1,
        shadows: false,
        shadowType: "none",
        toneMapping: "none",
        exposure: 1,
      },
    });
  const refusal: (facts: IAutoMovieRenderTextureSource) => string | null = (
    facts: IAutoMovieRenderTextureSource,
  ): string | null =>
    autoMovieRenderBudgetRefusal(
      autoMovieRenderBudgetEvidence({
        tier: "unit",
        budgets: undefined,
        assessments: [assess(facts)],
      }),
    );
  TestValidator.predicate(
    "normal preflight refuses unreported factory",
    refusal(missing)!.includes("sky"),
  );
  TestValidator.equals(
    "normal preflight admits finite factory union",
    refusal(source),
    null,
  );
  TestValidator.equals(
    "non-environment material ignores unrelated factory choices",
    bytes(
      measureAutoMovieRenderTextureClosure({
        materials: [surface()],
        sources: [unsupported],
        environment: null,
      }),
    ),
    image + dfg,
  );
}
