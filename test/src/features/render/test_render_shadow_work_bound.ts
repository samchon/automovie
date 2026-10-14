import {
  type IAutoMovieRenderSubject,
  deriveAutoMovieSemanticMask,
  measureAutoMovieRenderInventory,
} from "@automovie/engine";
import type {
  IAutoMovieLight,
  IAutoMovieModel,
  IAutoMovieRenderInventory,
  IAutoMovieRenderOwnerCost,
  IAutoMovieScene,
  IAutoMovieSceneEnvironment,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { BOX_TRIANGLES, boxModel } from "../internal/renderFixtures";

/**
 * Shadow work is bounded per rasterized face and per filtering draw, while
 * allocation counts retain one resource owner per casting light. A point
 * shadow has six cube faces. A supported VSM shadow adds two fullscreen
 * triangles, one vertical and one horizontal blur. Outline is an alternative
 * frame peak, not an extra pass inside the beauty frame.
 *
 * Scenarios:
 *
 * 1. One box and a point light bound seven draws and 84 triangles: beauty and
 *    six depth faces, with one shadow-map owner.
 * 2. Directional and spot PCF each add one depth face; two mixed casters sum
 *    their faces instead of counting both as a single pass.
 * 3. Directional and spot VSM each add two filtering draws and two triangles;
 *    empty geometry still owes that fullscreen filtering work.
 * 4. Disabled shadows, noncasting lights and area lights retain the outline
 *    peak and allocate no shadow maps.
 * 5. Every measured draw and triangle is attributed, with shadow passes kept
 *    outside editable-owner ranking.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures real engine render inventories from a one-box subject and compares complete draw, triangle and map expectations, additive owner accounting and pass classifications; this catches counting point shadows once, dropping VSM filtering on an empty scene or ranking shadow resubmission as editable geometry.
 * @evidence contracts/testing.md#independent-expectations A six-face box has twelve triangles from the numerical fixture's six authored quads. Beauty plus six point faces, one directional/spot face, two fullscreen VSM triangles, and the alternate outline peak supply independently written case totals; owner sums are an additional consistency check anchored by those literal totals.
 * @evidence contracts/testing.md#distinguishing-cases Thirteen cases distinguish point, directional, spot and mixed casters; legacy PCF alias and VSM; empty lit and unlit scenes; and disabled, noncasting, area and absent lights. Every case checks additive attribution, while unsupported point VSM admission belongs to test_render_shadow_profile and attachment bytes belong to test_render_shadow_texture_storage.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_shadow_work_bound entry derives masks and inventories in-process from numerical models and policies, without creating actual lights, a renderer, GPU, browser or installed consumer; the local case array owns its thirteen comparisons.
 */
export function test_render_shadow_work_bound(): void {
  const transform: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const base: Pick<
    IAutoMovieLight,
    "transform" | "color" | "intensity" | "castShadow"
  > = {
    transform,
    color: { r: 1, g: 1, b: 1, a: 1, hex: null },
    intensity: 1,
    castShadow: true,
  };
  const point: IAutoMovieLight = {
    ...base,
    id: "point",
    type: "point",
    range: 0,
  };
  const directional: IAutoMovieLight = {
    ...base,
    id: "sun",
    type: "directional",
  };
  const spot: IAutoMovieLight = {
    ...base,
    id: "spot",
    type: "spot",
    range: 0,
    coneAngle: 45,
  };
  const area: IAutoMovieLight = {
    ...base,
    id: "panel",
    type: "area",
    width: 1,
    height: 1,
  };
  const model: IAutoMovieModel = boxModel({ id: "box" });
  const measure: (
    lights: IAutoMovieLight[],
    filter?: IAutoMovieSceneEnvironment["shadows"]["type"],
    enabled?: boolean,
    empty?: boolean,
  ) => IAutoMovieRenderInventory = (
    lights: IAutoMovieLight[],
    filter: IAutoMovieSceneEnvironment["shadows"]["type"] = "pcf",
    enabled: boolean = true,
    empty: boolean = false,
  ): IAutoMovieRenderInventory => {
    const scene: IAutoMovieScene = {
      id: "shadow-work",
      name: null,
      cameras: [],
      lights,
      nodes: empty
        ? []
        : [
            {
              id: "box-node",
              model: model.id,
              transform,
              motion: null,
              pose: null,
            },
          ],
      environment: {
        image: null,
        background: null,
        intensity: 1,
        rotationDeg: 0,
        exposure: 1,
        toneMapping: "none",
        shadows: { enabled, type: filter },
      },
    };
    const subject: IAutoMovieRenderSubject = { scene, models: [model] };
    return measureAutoMovieRenderInventory({
      subject,
      mask: deriveAutoMovieSemanticMask(subject),
    });
  };
  const cases: {
    inventory: IAutoMovieRenderInventory;
    draws: number;
    triangles: number;
    maps: number;
  }[] = [
    {
      inventory: measure([point]),
      draws: 7,
      triangles: 7 * BOX_TRIANGLES,
      maps: 1,
    },
    {
      inventory: measure([directional]),
      draws: 2,
      triangles: 2 * BOX_TRIANGLES,
      maps: 1,
    },
    {
      inventory: measure([spot], "pcfSoft"),
      draws: 2,
      triangles: 2 * BOX_TRIANGLES,
      maps: 1,
    },
    {
      inventory: measure([point, directional]),
      draws: 8,
      triangles: 8 * BOX_TRIANGLES,
      maps: 2,
    },
    {
      inventory: measure([directional], "vsm"),
      draws: 4,
      triangles: 2 * BOX_TRIANGLES + 2,
      maps: 1,
    },
    {
      inventory: measure([spot], "vsm"),
      draws: 4,
      triangles: 2 * BOX_TRIANGLES + 2,
      maps: 1,
    },
    {
      inventory: measure([directional, spot], "vsm"),
      draws: 7,
      triangles: 3 * BOX_TRIANGLES + 4,
      maps: 2,
    },
    {
      inventory: measure([directional], "vsm", true, true),
      draws: 2,
      triangles: 2,
      maps: 1,
    },
    {
      inventory: measure([point], "pcf", false),
      draws: 2,
      triangles: 2 * BOX_TRIANGLES,
      maps: 0,
    },
    {
      inventory: measure([{ ...point, castShadow: false }]),
      draws: 2,
      triangles: 2 * BOX_TRIANGLES,
      maps: 0,
    },
    {
      inventory: measure([area]),
      draws: 2,
      triangles: 2 * BOX_TRIANGLES,
      maps: 0,
    },
    { inventory: measure([]), draws: 2, triangles: 2 * BOX_TRIANGLES, maps: 0 },
    {
      inventory: measure([], "pcf", true, true),
      draws: 0,
      triangles: 0,
      maps: 0,
    },
  ];
  TestValidator.equals(
    "the frame bound includes every shadow face and filtering triangle",
    cases.map(
      ({
        inventory,
      }: (typeof cases)[number]): {
        draws: number | null;
        triangles: number | null;
        maps: number | null;
      } => ({
        draws: inventory.totals.drawCalls,
        triangles: inventory.totals.triangles,
        maps: inventory.totals.shadowMaps,
      }),
    ),
    cases.map(
      ({
        draws,
        triangles,
        maps,
      }: (typeof cases)[number]): {
        draws: number;
        triangles: number;
        maps: number;
      } => ({ draws, triangles, maps }),
    ),
  );
  for (const { inventory } of cases) {
    for (const metric of ["drawCalls", "triangles"] as const)
      TestValidator.equals(
        `${metric} owners add to the frame bound`,
        inventory.owners
          .filter(
            (row: IAutoMovieRenderOwnerCost): boolean => row.metric === metric,
          )
          .reduce(
            (sum: number, row: IAutoMovieRenderOwnerCost): number =>
              sum + row.cost,
            0,
          ),
        inventory.totals[metric],
      );
    TestValidator.predicate(
      "shadow draws remain pass costs",
      inventory.owners
        .filter(
          (row: IAutoMovieRenderOwnerCost): boolean =>
            row.owner.startsWith("light:") &&
            (row.metric === "drawCalls" || row.metric === "triangles"),
        )
        .every(
          (row: IAutoMovieRenderOwnerCost): boolean => row.kind === "pass",
        ),
    );
  }
}
