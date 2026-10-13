import { IAutoMovieRenderInventory } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { renderBudgetPoseFixture as pose } from "../internal/renderBudgetPoseFixture";
import { renderBudgetStagedFixture as staged } from "../internal/renderBudgetStagedFixture";
import { sharedTextureModelFixture as sharedTexture } from "../internal/sharedTextureModelFixture";
import { renderShadowTargetFixture } from "../internal/renderShadowTargetFixture";

/**
 * Environment image derivatives and material uploads retain separate physical storage and shadow policy.
 *
 * Scenarios:
 *
 * 1. Shared maps count once, environment derivatives count their extents, area lights cast no map, and missing image facts remain unknown.
 */
export const test_render_budget_environment_storage = (): void => {
  const costBag = (rows: readonly { asset: string | null; materials: string[]; bytes: number | null }[]): string[] =>
    rows.map((row) => JSON.stringify(row)).sort((left, right) => left.localeCompare(right, "en"));
  // A declared environment owns the shadow policy and adds one background
  // draw; an area light rasterizes no shadow camera however it is flagged; a
  // texture bound by two materials is one texture; an unmipmapped texture is
  // its base level exactly.
  const lit = (shadows: boolean, knownEnvironment = true): IAutoMovieRenderInventory =>
    measure({
      scene: {
        id: "lit",
        name: null,
        nodes: [staged("a", "left"), staged("b", "right")],
        cameras: [],
        lights: [
          {
            id: "sun",
            type: "directional",
            transform: pose(),
            color: { r: 1, g: 1, b: 1, a: 1, hex: null },
            intensity: 1,
            castShadow: true,
            shadow: {
              mapSize: 512,
              bias: 0,
              normalBias: 0,
              near: 0.1,
              far: 20,
            },
          },
          {
            id: "panel",
            type: "area",
            transform: pose(),
            color: { r: 1, g: 1, b: 1, a: 1, hex: null },
            intensity: 1,
            castShadow: true,
            width: 1,
            height: 1,
          },
        ],
        environment: {
          image: "env/sky.hdr",
          background: null,
          intensity: 1,
          rotationDeg: 0,
          exposure: 1,
          toneMapping: "acesFilmic",
          shadows: { enabled: shadows, type: "pcf" },
        },
      },
      models: [
        sharedTexture("left", "left-mat", "shared"),
        sharedTexture("right", "right-mat", "reference"),
      ],
      textureResidency: { owner: "current", residents: [], dfgRetained: false, pmremRetained: null,
        renderTargets: shadows ? [renderShadowTargetFixture()] : [],
        runtimeTextures: (["area-ltc-1", "area-ltc-2"] as const).map((purpose) => ({ owner: purpose, purpose, residents: ["current"],
          texture: { width: 64, height: 64, format: "rgba32f", colorSpace: "linear", mipmapped: false,
            sourceIdentity: purpose, uploadState: "native-float-ltc" },
        })),
      },
      waterBodies: [
        {
          id: "basin",
          owner: null,
          nodes: [],
          cells: 10,
          particles: null,
          domain: null,
          material: null,
        },
      ],
      textures: [
        { format: "rgba8" as const, asset: "textures/shared.png", width: 4, height: 4, mipmapped: false },
        { format: "rgba8" as const, asset: "textures/normal.png", width: 2, height: 2, mipmapped: false },
        ...(knownEnvironment ? [{ format: "rgba16f" as const, environmentBackgroundFormat: "rgba16f" as const, asset: "env/sky.hdr",
          width: 512, height: 256, mipmapped: false,
          sampler: { wrapS: "clamp" as const, wrapT: "clamp" as const, minFilter: "linear" as const, magFilter: "linear" as const } }] : []),
      ],
    });

  TestValidator.equals(
    "a declared environment owns shadows, an area light casts none, and a shared texture counts once",
    {
      off: {
        drawCalls: lit(false).totals.drawCalls,
        shadowMaps: lit(false).totals.shadowMaps,
      },
      on: {
        drawCalls: lit(true).totals.drawCalls,
        shadowMaps: lit(true).totals.shadowMaps,
      },
      lights: lit(true).totals.lights,
      textures: costBag(lit(true).textures.map((texture) => ({
        asset: texture.asset,
        materials: texture.materials,
        bytes: texture.bytes,
      }))),
      textureBytes: lit(true).totals.textureBytes,
      fluid: [lit(true).totals.fluidCells, lit(true).totals.fluidParticles],
    },
    {
      off: { drawCalls: 2 + 2 + 1, shadowMaps: 0 },
      on: { drawCalls: 2 + 2 + 1, shadowMaps: 1 },
      lights: 2,
      textures: costBag([
        { asset: null, materials: [], bytes: 64 * 64 * 4 * 4 },
        { asset: null, materials: [], bytes: 64 * 64 * 4 * 4 },
        {
          asset: null,
          materials: ["left-mat", "right-mat"],
          bytes: 16 * 16 * 2 * 2,
        },
        { asset: null, materials: [], bytes: 384 * 512 * 8 },
        { asset: null, materials: [], bytes: 512 * 512 * (4 + 4) },
        { asset: "env/sky.hdr", materials: [], bytes: 512 * 256 * 8 },
        { asset: "env/sky.hdr", materials: [], bytes: 6 * (256 * 256 * 8 + 256 * 256 * 4) },
        { asset: "env/sky.hdr", materials: [], bytes: 384 * 512 * 8 },
        {
          asset: "textures/normal.png",
          materials: ["right-mat"],
          bytes: 2 * 2 * 4,
        },
        {
          asset: "textures/shared.png",
          materials: ["left-mat", "right-mat"],
          bytes: 4 * 4 * 4,
        },
      ]),
      textureBytes: 2 * 2 * 4 + 4 * 4 * 4 + 1024 + 512 * 256 * 8 +
        6 * 256 * 256 * (8 + 4) + 2 * 384 * 512 * 8 + 512 * 512 * (4 + 4) + 2 * 64 * 64 * 4 * 4,
      fluid: [10, 0],
    },
  );

  TestValidator.equals("missing declared environment facts keep total unbounded", lit(true, false).totals.textureBytes, null);
};
