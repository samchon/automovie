import {
  deriveAutoMovieSemanticMask,
  measureAutoMovieRenderInventory,
} from "@automovie/engine";
import type {
  IAutoMovieLight,
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
 */
export const test_render_shadow_work_bound = (): void => {
  const transform: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const base = {
    transform,
    color: { r: 1, g: 1, b: 1, a: 1, hex: null },
    intensity: 1,
    castShadow: true,
  };
  const point: IAutoMovieLight = { ...base, id: "point", type: "point", range: 0 };
  const directional: IAutoMovieLight = { ...base, id: "sun", type: "directional" };
  const spot: IAutoMovieLight = {
    ...base, id: "spot", type: "spot", range: 0, coneAngle: 45,
  };
  const area: IAutoMovieLight = {
    ...base, id: "panel", type: "area", width: 1, height: 1,
  };
  const model = boxModel({ id: "box" });
  const measure = (
    lights: IAutoMovieLight[],
    filter: IAutoMovieSceneEnvironment["shadows"]["type"] = "pcf",
    enabled = true,
    empty = false,
  ) => {
    const scene: IAutoMovieScene = {
      id: "shadow-work", name: null, cameras: [], lights,
      nodes: empty ? [] : [{
        id: "box-node", model: model.id, transform, motion: null, pose: null,
      }],
      environment: {
        image: null, background: null, intensity: 1, rotationDeg: 0,
        exposure: 1, toneMapping: "none", shadows: { enabled, type: filter },
      },
    };
    const subject = { scene, models: [model] };
    return measureAutoMovieRenderInventory({
      subject, mask: deriveAutoMovieSemanticMask(subject),
    });
  };
  const cases = [
    { inventory: measure([point]), draws: 7, triangles: 7 * BOX_TRIANGLES, maps: 1 },
    { inventory: measure([directional]), draws: 2, triangles: 2 * BOX_TRIANGLES, maps: 1 },
    { inventory: measure([spot], "pcfSoft"), draws: 2, triangles: 2 * BOX_TRIANGLES, maps: 1 },
    { inventory: measure([point, directional]), draws: 8, triangles: 8 * BOX_TRIANGLES, maps: 2 },
    { inventory: measure([directional], "vsm"), draws: 4, triangles: 2 * BOX_TRIANGLES + 2, maps: 1 },
    { inventory: measure([spot], "vsm"), draws: 4, triangles: 2 * BOX_TRIANGLES + 2, maps: 1 },
    { inventory: measure([directional, spot], "vsm"), draws: 7, triangles: 3 * BOX_TRIANGLES + 4, maps: 2 },
    { inventory: measure([directional], "vsm", true, true), draws: 2, triangles: 2, maps: 1 },
    { inventory: measure([point], "pcf", false), draws: 2, triangles: 2 * BOX_TRIANGLES, maps: 0 },
    { inventory: measure([{ ...point, castShadow: false }]), draws: 2, triangles: 2 * BOX_TRIANGLES, maps: 0 },
    { inventory: measure([area]), draws: 2, triangles: 2 * BOX_TRIANGLES, maps: 0 },
    { inventory: measure([]), draws: 2, triangles: 2 * BOX_TRIANGLES, maps: 0 },
    { inventory: measure([], "pcf", true, true), draws: 0, triangles: 0, maps: 0 },
  ];
  TestValidator.equals(
    "the frame bound includes every shadow face and filtering triangle",
    cases.map(({ inventory }) => ({
      draws: inventory.totals.drawCalls,
      triangles: inventory.totals.triangles,
      maps: inventory.totals.shadowMaps,
    })),
    cases.map(({ draws, triangles, maps }) => ({ draws, triangles, maps })),
  );
  for (const { inventory } of cases) {
    for (const metric of ["drawCalls", "triangles"] as const)
      TestValidator.equals(
        `${metric} owners add to the frame bound`,
        inventory.owners.filter((row) => row.metric === metric)
          .reduce((sum, row) => sum + row.cost, 0),
        inventory.totals[metric],
      );
    TestValidator.predicate(
      "shadow draws remain pass costs",
      inventory.owners.filter((row) => row.owner.startsWith("light:") &&
        (row.metric === "drawCalls" || row.metric === "triangles"))
        .every((row) => row.kind === "pass"),
    );
  }
};
