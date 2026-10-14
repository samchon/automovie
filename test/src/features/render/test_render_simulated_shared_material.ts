import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieRenderInventory, IAutoMovieRenderOwnerCost, IAutoMovieRenderTextureCost } from "@automovie/interface";
import { modelsFixture } from "../internal/renderFixtures";
import { softPanel } from "../internal/softFixtures";
import { simulatedRenderSceneFixture } from "../internal/simulatedRenderSceneFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";

/**
 * Shared simulated fabric is charged once while unnamed drawables own separate default materials.
 *
 * Scenarios:
 *
 * 1. Two panels share their declared material and upload; the third panel retains its own default PBR material.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures three cloth panels, two citing stone and one using a default, and checks material population, texture attribution and bytes, plus exact material-owner ids; this catches charging a shared material per panel or omitting the unnamed drawable's separate default material.
 * @evidence contracts/testing.md#independent-expectations The input declares one stone material used twice and one unnamed panel, requiring two materials. A 2-by-2 RGBA8 texture costs sixteen bytes and the shared 16-by-16 RG half-float PBR lookup costs 1024; literals and representation widths supply the expected rows without reading inventory output.
 * @evidence contracts/testing.md#distinguishing-cases Two equal named bindings contrast with an unnamed drawable, distinguishing shared authored storage from a per-drawable default and a renderer-owned lookup from the asset upload. Missing and conflicting material references belong to test_render_simulated_invalid_inputs.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported test_render_simulated_shared_material entry runs numerical inventory measurement in-process using explicit decoded dimensions; it performs no image decode, material allocation, GPU work, renderer startup or consumer installation.
 */
export function test_render_simulated_shared_material(): void {
  const scene: typeof simulatedRenderSceneFixture = simulatedRenderSceneFixture;

  // A fabric declared once and hung twice is one material and one texture, not
  // two of each; the renderer's own default is one object per drawable.
  const shared: IAutoMovieRenderInventory = measure({
    scene: scene(),
    models: modelsFixture(),
    softBodies: [
      {
        domain: softPanel({ columns: 2, rows: 2, overrides: { id: "left" } }),
        owner: null,
        material: "stone",
      },
      {
        domain: softPanel({ columns: 2, rows: 2, overrides: { id: "right" } }),
        owner: null,
        material: "stone",
      },
      {
        domain: softPanel({ columns: 2, rows: 2, overrides: { id: "bare" } }),
        owner: null,
        material: null,
      },
    ],
    textures: [
      { format: "rgba8" as const, asset: "textures/stone.png", width: 2, height: 2, mipmapped: false },
    ],
  });

  TestValidator.equals(
    "a shared fabric is one material and one texture; a default is one per drawable",
    {
      materials: shared.totals.materials,
      textures: shared.textures.map((texture: IAutoMovieRenderTextureCost): unknown[] => [
        texture.asset,
        texture.materials,
        texture.bytes,
      ]),
      textureBytes: shared.totals.textureBytes,
      defaults: shared.owners
        .filter((item: IAutoMovieRenderOwnerCost): boolean => item.metric === "materials")
        .map((item: IAutoMovieRenderOwnerCost): string => item.owner),
    },
    {
      materials: 2,
      textures: [[null, ["stone"], 1024], ["textures/stone.png", ["stone"], 2 * 2 * 4]],
      textureBytes: 2 * 2 * 4 + 1024,
      defaults: ["material:soft-body:bare/default", "material:stone"],
    },
  );
}
