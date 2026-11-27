import { AutoMovieRenderFormationGeometry } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../internal/nclose";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../../internal/vertexColourFixture";

/**
 * Exercises generated-model RGB lowering and material groups across bare
 * neighboring parts.
 *
 * Scenarios:
 *
 * 1. Mixed colored/bare parts lower authored RGB and white identity channels into
 *    independently specified material spans.
 * 2. All-colored and all-bare populations preserve their distinct output attribute
 *    rules.
 * 3. Ordered input values, numeric fields and original geometry/mesh identities
 *    remain unchanged; returned geometries/materials are retired.
 */
export function test_render_scene_flatten_instanced_model_vertex_colour_instancing(): void {
  const colored: import("@automovie/interface").IAutoMovieMesh =
    vertexColourMesh();
  const {
    colors: _colors,
    ...bare
  }: import("@automovie/interface").IAutoMovieMesh = colored;
  const model: import("@automovie/interface").IAutoMovieModel =
    vertexColourModel([colored, bare]);
  const before: import("@automovie/interface").IAutoMovieModel =
    structuredClone(model);
  const firstGeometry: (typeof model.parts)[number]["geometry"] =
    model.parts[0]!.geometry;
  const secondGeometry: (typeof model.parts)[number]["geometry"] =
    model.parts[1]!.geometry;
  const mixed: ReturnType<typeof AutoMovieRenderFormationGeometry.flattenInstancedModel> =
    AutoMovieRenderFormationGeometry.flattenInstancedModel(model);
  const expectedMixed: number[] = [
    ...colored.colors!,
    ...new Array<number>(9).fill(1),
  ];
  const mixedColors: ArrayLike<number> =
    mixed.geometry.getAttribute("color").array;
  TestValidator.predicate(
    "mixed identity RGB",
    mixedColors.length === expectedMixed.length &&
      Array.from(mixedColors).every((value: number, index: number): boolean =>
        nclose(value, expectedMixed[index]!, 0),
      ),
  );
  TestValidator.equals("material spans", mixed.geometry.groups, [
    { start: 0, count: 3, materialIndex: 0 },
    { start: 3, count: 3, materialIndex: 1 },
  ]);
  TestValidator.equals(
    "only coloured material reads RGB",
    mixed.materials.map((m: THREE.Material): boolean => m.vertexColors),
    [true, false],
  );
  TestValidator.predicate(
    "caller input keys, ordered values and numeric fields remain unchanged",
    JSON.stringify(model) === JSON.stringify(before),
  );
  TestValidator.predicate(
    "the caller retains its original geometry and mesh record identities",
    model.parts[0]!.geometry === firstGeometry &&
      model.parts[1]!.geometry === secondGeometry &&
      firstGeometry.type === "mesh" &&
      firstGeometry.mesh === colored &&
      secondGeometry.type === "mesh" &&
      secondGeometry.mesh === bare,
  );
  const all: ReturnType<typeof AutoMovieRenderFormationGeometry.flattenInstancedModel> = AutoMovieRenderFormationGeometry.flattenInstancedModel(
    vertexColourModel([colored, colored]),
  );
  const expectedAll: number[] = [...colored.colors!, ...colored.colors!];
  const allColors: ArrayLike<number> = all.geometry.getAttribute("color").array;
  TestValidator.predicate(
    "all RGB preserved",
    allColors.length === expectedAll.length &&
      Array.from(allColors).every((value: number, index: number): boolean =>
        nclose(value, expectedAll[index]!, 0),
      ),
  );
  const empty: ReturnType<typeof AutoMovieRenderFormationGeometry.flattenInstancedModel> = AutoMovieRenderFormationGeometry.flattenInstancedModel(
    vertexColourModel([bare, bare]),
  );
  TestValidator.equals(
    "bare has no colour",
    empty.geometry.hasAttribute("color"),
    false,
  );
  for (const result of [mixed, all, empty]) {
    result.geometry.dispose();
    for (const material of new Set(result.materials)) material.dispose();
  }
}
