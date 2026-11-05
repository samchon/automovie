import { TestValidator } from "@nestia/e2e";

import type { IFilm } from "../../src/IFilm";
import { selectFilm } from "../../src/selectFilm";

/**
 * Pin how the Viewer and render choose one film from the registry.
 *
 * Scenarios:
 * 1. A lone film is selected with or without its name; with several, the named one is selected.
 * 2. An omitted name with several films, an unknown or inherited name, and an empty registry are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the two scenarios, selection and refusal, and the rule each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls selectFilm on literal registries and asserts the selected name and film object or the thrown refusal; silently playing the first film, resolving an inherited key or accepting an unknown name fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected selections follow from the documented rule: a lone film is implied, several films need a name, and only registered names resolve.
 * @evidence contracts/development/testing.md#distinguishing-cases Cases cover a singleton with null, empty and explicit names, a two-film registry with each name and with null, an unknown name, the inherited key toString and an empty registry.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with in-memory registries, discovered by test/index.ts as an exported test_ function; it starts no Viewer or render.
 */
export function test_select_film(): void {
  const film: (durationSeconds: number) => IFilm = (
    durationSeconds: number,
  ): IFilm => ({
    durationSeconds,
    fps: 30,
    create: (): never => {
      throw new Error("not mounted in this test");
    },
  });
  const opening: IFilm = film(15);
  const ending: IFilm = film(30);

  for (const name of [null, "", "opening"])
    TestValidator.predicate(
      `lone film selected by ${JSON.stringify(name)}`,
      selectFilm({ opening }, name).film === opening,
    );
  TestValidator.equals(
    "lone film name",
    selectFilm({ opening }, null).name,
    "opening",
  );
  TestValidator.predicate(
    "named film among several",
    selectFilm({ opening, ending }, "ending").film === ending,
  );
  TestValidator.predicate(
    "other named film among several",
    selectFilm({ opening, ending }, "opening").film === opening,
  );

  for (const [label, registry, name] of [
    ["omitted name among several", { opening, ending }, null],
    ["empty name among several", { opening, ending }, ""],
    ["unknown name", { opening, ending }, "middle"],
    ["inherited key", { opening }, "toString"],
    ["empty registry", {}, null],
  ] as const)
    TestValidator.error(label, (): unknown => selectFilm(registry, name));
}
