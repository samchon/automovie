import {
  AutoMovieArchetypeLoad,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

/**
 * A crate adds finite numeric contents to its base mass.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the empty and loaded cases, valid zero sack load and malformed or out-of-range contents.
 * @evidence contracts/development/testing.md#behavioral-verification Builds crate and sack models and reads their actual dimensions and body mass. Calls the same producer with invalid contents and checks the original value and applicable range on the structured load axis.
 * @evidence contracts/development/testing.md#independent-expectations A 2.5 kg crate plus 22.5 kg of contents has total mass 25 kg. Without contents it retains its 2.5 kg base mass. A sack models its full 25 kg, so its authorable extra mass is zero.
 */
export function test_archetypes_furniture_load_contents(): void {
  const crate = AutoMovieArchetypeLoad.create({
    kind: "crate",
    mass: 2.5,
    load: 22.5,
  });
  TestValidator.equals(
    "recorded and loaded crate mass",
    [crate.dimensions.mass, crate.properties.mass],
    [2.5, 25],
  );
  TestValidator.equals(
    "an empty crate retains its base mass",
    AutoMovieArchetypeLoad.create({ kind: "crate", mass: 2.5 }).properties.mass,
    2.5,
  );
  TestValidator.equals(
    "zero extra contents leave the sack mass unchanged",
    AutoMovieArchetypeLoad.create({ kind: "sack", load: 0 }).properties.mass,
    25,
  );
  for (const [kind, load, maximum] of [
    ["crate", "2", 22.5],
    ["crate", Symbol("load"), 22.5],
    ["crate", Infinity, 22.5],
    ["crate", -1, 22.5],
    ["crate", 22.6, 22.5],
    ["sack", "0", 0],
    ["sack", 0.1, 0],
  ] as const)
    assert.throws(
      () => AutoMovieArchetypeLoad.create({ kind, load: load as number }),
      (error: unknown): boolean =>
        error instanceof AutoMovieArchetypeRefusal &&
        error.kind === "parameter" &&
        error.archetype === "load" &&
        error.axis === "load" &&
        Object.is(error.value, load) &&
        error.feasible?.kind === "range" &&
        error.feasible.minimum === 0 &&
        error.feasible.maximum === maximum &&
        error.feasible.unit === "kg",
    );
}
