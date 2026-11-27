import { AutoMovieEnginePopulationRuntime } from "@automovie/engine";
import type {
  IAutoMovieCompiledInstancePrototype,
  IAutoMovieSelectInstancePrototype,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * A supplied empty prototype table refuses selection instead of returning undefined.
 *
 * Scenarios:
 * 1. Empty tables reject both weighted selection and explicit default selection.
 * 2. An omitted table supplies the base model with id default and weight one.
 * 3. A singleton table returns its borrowed entry for weighted and explicit selection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the empty/omitted distinction and the identity preserved for a singleton table.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public selectInstancePrototype and requires an Error for empty tables while observing real default fields and singleton object identity.
 * @evidence contracts/development/testing.md#independent-expectations An empty authored table contains no selectable member; absence has the documented base-model default of weight one, and a singleton has exactly one possible answer. No seeded output is copied into an oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises empty, omitted and singleton tables with both weighted and explicit selection at slots zero and seven. Existing test_engine_prototype_selection owns multi-entry weighting and missing-name refusal; malformed weights remain outside this test.
 * @evidence contracts/development/testing.md#execution-ownership This named synchronous unit supplies in-memory instance-set records to the public engine selector without a compiled scene or host.
 */
export function test_engine_prototype_empty_table(): void {
  const base: IAutoMovieSelectInstancePrototype.IInstanceSet<
    Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight">
  > = { id: "admission-set", seed: 19, model: "base-model" };
  const entry: Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "model" | "weight"
  > = { id: "only", model: "alternate-model", weight: 2 };
  const failures: string[] = [];

  for (const slot of [0, 7]) {
    for (const explicit of [undefined, "default"])
      if (
        !throwsError(
          (): unknown =>
            AutoMovieEnginePopulationRuntime.selectInstancePrototype(
              { ...base, prototypes: [] },
              slot,
              explicit,
            ),
          "admission-set",
        )
      )
        failures.push(`empty table at slot ${slot}, explicit ${explicit}`);

    for (const explicit of [undefined, "default"]) {
      try {
        const selected: typeof entry = AutoMovieEnginePopulationRuntime.selectInstancePrototype(
          base,
          slot,
          explicit,
        );
        if (
          selected.id !== "default" ||
          selected.model !== "base-model" ||
          !nclose(selected.weight, 1, 0)
        )
          failures.push(`omitted table default at slot ${slot}`);
      } catch (error) {
        failures.push(`omitted table: ${String(error)}`);
      }
    }

    for (const explicit of [undefined, "only"]) {
      try {
        if (
          AutoMovieEnginePopulationRuntime.selectInstancePrototype(
            { ...base, prototypes: [entry] },
            slot,
            explicit,
          ) !== entry
        )
          failures.push(`singleton identity at slot ${slot}`);
      } catch (error) {
        failures.push(`singleton table: ${String(error)}`);
      }
    }
  }

  TestValidator.predicate(
    `prototype table admission: ${failures.join("; ")}`,
    failures.length === 0,
  );
}
