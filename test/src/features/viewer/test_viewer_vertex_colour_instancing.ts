import { flattenInstancedModel } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../internal/vertexColourFixture";

/**
 * Exercises generated-model RGB lowering and material groups across bare neighboring parts.
 *
 * Scenarios:
 * 1. Mixed colored/bare parts lower authored RGB and white identity channels into independently specified material spans.
 * 2. All-colored and all-bare populations preserve their distinct output attribute rules.
 * 3. Ordered input values, numeric fields and original geometry/mesh identities remain unchanged; returned geometries/materials are retired.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual generated flattening and reads output RGB population, group spans, material flags and the caller's unchanged input projection.
 * @evidence contracts/testing.md#independent-expectations Existing authored RGB values, neutral white channels and literal material/index spans independently judge lowering; floats use numeric predicates rather than deep snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts mixed/all-colored/all-bare populations and separately retained caller input identities/values, so blanket color insertion or input mutation cannot pass.
 * @evidence contracts/testing.md#execution-ownership The named entry reuses canonical triangle/model inputs and owns returned CPU geometries/materials, retires them and starts no renderer or new asset/driver.
 */
export function test_viewer_vertex_colour_instancing(): void {
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
  const mixed: ReturnType<typeof flattenInstancedModel> =
    flattenInstancedModel(model);
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
    (mixed.materials as THREE.MeshStandardMaterial[]).map(
      (m: THREE.MeshStandardMaterial): boolean => m.vertexColors,
    ),
    [true, false],
  );
  TestValidator.predicate(
    "caller input keys, ordered values and numeric fields remain unchanged",
    sameModelInput(model, before),
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
  const all: ReturnType<typeof flattenInstancedModel> = flattenInstancedModel(
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
  const empty: ReturnType<typeof flattenInstancedModel> = flattenInstancedModel(
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

/** Compare this existing plain model input without putting floating fields through deep equality. */
function sameModelInput(actual: unknown, expected: unknown): boolean {
  if (typeof actual === "number" && typeof expected === "number")
    return nclose(actual, expected, 0);
  if (actual === expected) return true;
  if (
    typeof actual !== "object" ||
    actual === null ||
    typeof expected !== "object" ||
    expected === null
  )
    return false;
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (
      !Array.isArray(actual) ||
      !Array.isArray(expected) ||
      actual.length !== expected.length
    )
      return false;
    return actual.every((value: unknown, index: number): boolean =>
      sameModelInput(value, expected[index]),
    );
  }
  const actualRecord: Record<string, unknown> = actual as Record<
    string,
    unknown
  >;
  const expectedRecord: Record<string, unknown> = expected as Record<
    string,
    unknown
  >;
  const keys: string[] = Object.keys(actualRecord);
  return (
    keys.length === Object.keys(expectedRecord).length &&
    keys.every(
      (key: string): boolean =>
        Object.prototype.hasOwnProperty.call(expectedRecord, key) &&
        sameModelInput(actualRecord[key], expectedRecord[key]),
    )
  );
}
