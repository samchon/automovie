import { TestValidator } from "@nestia/e2e";
import { modelsFixture } from "../internal/renderFixtures";
import { softPanel } from "../internal/softFixtures";
import { simulatedRenderSceneFixture } from "../internal/simulatedRenderSceneFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";

/**
 * Shared simulated fabric decodes once while unnamed drawables own separate default materials.
 *
 * Scenarios:
 *
 * 1. Two panels share their declared material and upload; the third panel retains its own default PBR material.
 */
export const test_render_simulated_shared_material = (): void => {
  const scene = simulatedRenderSceneFixture;

  // A fabric declared once and hung twice is one material and one texture, not
  // two of each; the renderer's own default is one object per drawable.
  const shared = measure({
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
      textures: shared.textures.map((texture) => [
        texture.asset,
        texture.materials,
        texture.bytes,
      ]),
      textureBytes: shared.totals.textureBytes,
      defaults: shared.owners
        .filter((item) => item.metric === "materials")
        .map((item) => item.owner),
    },
    {
      materials: 2,
      textures: [[null, ["stone"], 1024], ["textures/stone.png", ["stone"], 2 * 2 * 4]],
      textureBytes: 2 * 2 * 4 + 1024,
      defaults: ["material:soft-body:bare/default", "material:stone"],
    },
  );
};
