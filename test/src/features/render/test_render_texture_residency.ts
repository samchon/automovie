import { autoMovieRenderTextureDigest, autoMovieTextureBindingStateKey, measureAutoMovieRenderTextureClosure } from "@automovie/engine";
import type { IAutoMovieMaterial, IAutoMovieTextureReference } from "@automovie/interface";
import type { IAutoMovieRenderTextureSource } from "@automovie/engine";
import { assessAutoMovieRenderBudget, autoMovieRenderBudgetEvidence, autoMovieRenderBudgetRefusal } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { compiledShotFixture } from "../internal/renderBudgetFixtures";
import { material, sceneFixture } from "../internal/renderFixtures";

/**
 * A decoded image and its GPU allocations are separate quantities. Equivalent
 * binding state shares storage; sampling and color decoding split it, while
 * shader UV placement does not. Image lighting includes its derived atlas.
 *
 * Scenarios:
 *
 * 1. Two 4-by-4 RGBA8 bindings share 64 bytes with matching state, split to
 *    128 bytes under different wrap or decoding, and keep sharing under UV edits.
 * 2. An explicit sampler equal to the host source sampler shares with the
 *    inherited binding; material contributor identities remain attached.
 * 3. Environment-only storage includes source, two half-float atlas targets
 *    and a six-face sharp-background cube with its depth attachments;
 *    a matching material/source binding shares its raw image allocation.
 * 4. Missing or invalid source facts and unreported upload formats retain null
 *    byte bounds. Half/float facts use their actual eight/sixteen-byte texels.
 * 5. Red/RG source storage does not set the RGBA background factory's width;
 *    missing output facts refuse normal admission and recovery reseals the target.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks actual texture closure, binding-state identity and explicit compiled-shot assessment for shared uploads, sampler/decoding variants, environment derivatives and unknown output formats.
 * @evidence contracts/testing.md#independent-expectations Raw RGBA8 storage, 16-by-16 two-channel half-float lookup, cube color plus depth and PMREM atlas sizes are hand arithmetic; format-width and mip cases preserve their authored texel counts independently of returned rows.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts sampler and color splits with UV-only sharing, empty/default PBR contexts, missing/invalid facts, half/float widths and five raw/background format pairs under both mip policies, then unknown and recovered background format.
 * @evidence contracts/testing.md#execution-ownership Owns portable synchronous supplied upload metadata and a deliberately partial compiled-shot fixture; refusal text and target resealing are computed without native uploads, renderer execution or automatic production admission.
 */
export function test_render_texture_residency(): void {
  const sampler: NonNullable<IAutoMovieTextureReference["sampler"]> = {
    wrapS: "clamp", wrapT: "clamp", minFilter: "nearest", magFilter: "nearest",
  };
  const binding: IAutoMovieTextureReference = { asset: "shared", texCoord: 0, colorSpace: "srgb", sampler };
  const first: IAutoMovieMaterial = { ...material("first"), baseColorTexture: binding };
  const second: IAutoMovieMaterial = { ...material("second"), baseColorTexture: { ...binding } };
  const source: IAutoMovieRenderTextureSource = { asset: "shared", width: 4, height: 4, mipmapped: false, format: "rgba8" as const,
    environmentBackgroundFormat: "rgba8" as const, sampler };
  const closure: (materials?: IAutoMovieMaterial[]) => ReturnType<typeof measureAutoMovieRenderTextureClosure> = (materials: IAutoMovieMaterial[] = [first, second]): ReturnType<typeof measureAutoMovieRenderTextureClosure> => measureAutoMovieRenderTextureClosure({ materials, sources: [source], environment: null });
  const imageRows: (rows: ReturnType<typeof closure>) => ReturnType<typeof closure> = (rows: ReturnType<typeof closure>): ReturnType<typeof closure> => rows.filter((row: ReturnType<typeof closure>[number]): boolean => row.asset !== null);
  TestValidator.equals("shared allocation", imageRows(closure()).map((row: ReturnType<typeof closure>[number]): number | null => row.bytes), [64]);
  TestValidator.equals("shared contributors", imageRows(closure())[0].materials, ["first", "second"]);
  TestValidator.equals("one shared PBR lookup", closure().filter((row: ReturnType<typeof closure>[number]): boolean => row.asset === null).map((row: ReturnType<typeof closure>[number]): number | null => row.bytes), [16 * 16 * 2 * 2]);
  const wrapped: IAutoMovieMaterial = { ...second, baseColorTexture: { ...binding, sampler: { ...sampler, wrapS: "repeat" as const } } };
  TestValidator.equals("wrap split", imageRows(closure([first, wrapped])).map((row: ReturnType<typeof closure>[number]): number | null => row.bytes), [64, 64]);
  const decoded: IAutoMovieMaterial = { ...second, baseColorTexture: { ...binding, colorSpace: "linear" as const } };
  TestValidator.equals("decode split", imageRows(closure([first, decoded])).map((row: ReturnType<typeof closure>[number]): number | null => row.bytes), [64, 64]);
  const positioned: IAutoMovieMaterial = { ...second, baseColorTexture: { ...binding, texCoord: 1,
    transform: { offset: { x: 1, y: 2 }, scale: { x: 4, y: 2 }, rotationDeg: 45 },
  } };
  TestValidator.equals("shader placement sharing", imageRows(closure([first, positioned])).map((row: ReturnType<typeof closure>[number]): number | null => row.bytes), [64]);
  TestValidator.equals("inherited sampler sharing", autoMovieTextureBindingStateKey("shared", "srgb", sampler), autoMovieTextureBindingStateKey(binding, "linear", sampler));
  TestValidator.predicate("unreported inherited sampler", autoMovieTextureBindingStateKey("shared", "srgb") !== autoMovieTextureBindingStateKey(binding, "srgb"));
  const environment: ReturnType<typeof closure> = measureAutoMovieRenderTextureClosure({ materials: [first], sources: [source], environment: "shared" });
  const atlasBytes: number = 3 * 112 * 4 * 8;
  const cubeBytes: number = 6 * (4 * 4 * 4 + 4 * 4 * 4);
  TestValidator.equals("environment source and derivatives", imageRows(environment).map((row: ReturnType<typeof closure>[number]): number | null => row.bytes).sort((a: number | null, b: number | null): number => a! - b!), [64, cubeBytes, atlasBytes]);
  TestValidator.equals("renderer-owned blur", environment.filter((row: ReturnType<typeof closure>[number]): boolean => row.runtime === "pmrem-blur").map((row: ReturnType<typeof closure>[number]): number | null => row.bytes), [atlasBytes]);
  TestValidator.equals("background only needs no PBR derivatives", measureAutoMovieRenderTextureClosure({ materials: [], sources: [source], environment: "shared" }).map((row: ReturnType<typeof closure>[number]): number | null => row.bytes).sort((a: number | null, b: number | null): number => a! - b!), [64, cubeBytes]);
  TestValidator.equals("empty context closure", measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null }), []);
  TestValidator.equals("default PBR lookup", measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null, defaultPbr: true }).map((row: ReturnType<typeof closure>[number]): number | null => row.bytes), [1024]);
  const absent: ReturnType<typeof closure> = measureAutoMovieRenderTextureClosure({ materials: [first], sources: [], environment: "missing" });
  TestValidator.predicate("unknown source remains unknown", imageRows(absent).every((row: ReturnType<typeof closure>[number]): boolean => row.bytes === null));
  const unreported: ReturnType<typeof closure> = measureAutoMovieRenderTextureClosure({ materials: [first], sources: [{ ...source, format: undefined }], environment: null });
  TestValidator.equals("unreported format", imageRows(unreported)[0].bytes, null);
  const invalid: ReturnType<typeof closure> = measureAutoMovieRenderTextureClosure({ materials: [first], sources: [{ ...source, width: 0 }], environment: null });
  TestValidator.equals("invalid extent", imageRows(invalid)[0].bytes, null);
  for (const [format, expected] of [["rgba16f", 128], ["rgba32f", 256]] as const)
    TestValidator.equals("actual component width", imageRows(measureAutoMovieRenderTextureClosure({ materials: [first], sources: [{ ...source, format }], environment: null }))[0].bytes, expected);
  const linear: IAutoMovieMaterial = { ...first, baseColorTexture: { ...binding, colorSpace: "linear" as const } };
  TestValidator.equals("HDR environment LinearSRGB and material NoColorSpace allocate separately", imageRows(measureAutoMovieRenderTextureClosure({ materials: [linear], sources: [{ ...source, format: "rgba16f" }], environment: "shared" })).filter((row: ReturnType<typeof closure>[number]): boolean | undefined => row.variant?.startsWith("[")).length, 2);
  for (const [format, environmentBackgroundFormat, rawTexelBytes, cubeTexelBytes] of [
    ["r16f", "rgba16f", 2, 8], ["rg16f", "rgba16f", 4, 8],
    ["rgba8", "rgba8", 4, 4], ["rgba16f", "rgba16f", 8, 8],
    ["r16f", "rgba32f", 2, 16],
  ] as const) {
    for (const generateMipmaps of [false, true]) {
      const fact: IAutoMovieRenderTextureSource = { asset: "sky", width: 8, height: 4, format, environmentBackgroundFormat,
        mipmapped: generateMipmaps, generateMipmaps, sampler };
      const rows: ReturnType<typeof closure> = measureAutoMovieRenderTextureClosure({ materials: [], sources: [fact], environment: "sky" });
      const raw: number = (generateMipmaps ? 8 * 4 + 4 * 2 + 2 + 1 : 8 * 4) * rawTexelBytes;
      const cube: number = 6 * ((generateMipmaps ? 4 * 4 + 2 * 2 + 1 : 4 * 4) * cubeTexelBytes + 4 * 4 * 4);
      TestValidator.equals("native output channel/component width owns cube storage", rows.map((row: ReturnType<typeof closure>[number]): number | null => row.bytes).sort((left: number | null, right: number | null): number => left! - right!), [raw, cube]);
    }
  }
  const sky: Pick<IAutoMovieRenderTextureSource, "asset" | "width" | "height" | "mipmapped" | "sampler"> & { format: "r16f" } = { asset: "sky", width: 8, height: 4, mipmapped: false, format: "r16f" as const, sampler };
  const compiled: ReturnType<typeof compiledShotFixture> = compiledShotFixture({ models: [], scene: { ...sceneFixture(), nodes: [], lights: [],
    environment: { image: "sky", background: null, intensity: 1, rotationDeg: 0, exposure: 1,
      toneMapping: "none", shadows: { enabled: false, type: "pcf" } } } });
  const assess: (facts: typeof sky & { environmentBackgroundFormat?: "rgba16f" | "rgba32f" }) => ReturnType<typeof assessAutoMovieRenderBudget> = (facts: typeof sky & { environmentBackgroundFormat?: "rgba16f" | "rgba32f" }): ReturnType<typeof assessAutoMovieRenderBudget> => assessAutoMovieRenderBudget({
    compiled, shot: "background-format", budget: null, assets: [], textures: [facts],
    renderer: { api: "webgl2", vendor: "typed-host-facts", device: "no-gpu-unit" },
    settings: { width: 32, height: 32, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1 },
  });
  const unknown: ReturnType<typeof assess> = assess(sky);
  TestValidator.equals("missing derived format leaves required total unknown", unknown.inventory!.totals.textureBytes, null);
  TestValidator.predicate("normal preflight refuses missing native output facts", autoMovieRenderBudgetRefusal(autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments: [unknown] }))!.includes("sky"));
  const known: ReturnType<typeof assess> = assess({ ...sky, environmentBackgroundFormat: "rgba16f" });
  TestValidator.equals("observed half cube recovers independent storage sum", known.inventory!.totals.textureBytes, 8 * 4 * 2 + 6 * 4 * 4 * (8 + 4));
  TestValidator.equals("observed output admits normal preflight", autoMovieRenderBudgetRefusal(autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments: [known] })), null);
  TestValidator.predicate("derived format recovery reseals the target", unknown.target!.textureDigest !== known.target!.textureDigest);
  TestValidator.predicate("equal raw format cannot hide different native cube width", autoMovieRenderTextureDigest([{ ...sky, environmentBackgroundFormat: "rgba16f" }]) !==
    autoMovieRenderTextureDigest([{ ...sky, environmentBackgroundFormat: "rgba32f" }]));
}
