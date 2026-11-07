import assert from "node:assert/strict";

import type { IFilm } from "../../src/IFilm";
import { selectFilm } from "../../src/selectFilm";

/**
 * Pin the pure selection rule with caller-owned film capabilities.
 *
 * Scenarios:
 * 1. A literal one-film registry resolves its key with or without its name.
 * 2. With several films the named one is selected, and an omitted, unknown or inherited name, or an empty registry, is refused.
 *
 * @evidence contracts/testing.md#observable-behavior Calls selectFilm on literal registries and asserts the selected name and exact film capability or the thrown refusal; resolving an inherited key or accepting an unknown name fails. Actual production-registry wiring is inspected through the real product rather than imported by this unit.
 * @evidence contracts/testing.md#independent-cases Expectations follow from the documented rule: a lone film is implied, several films need a name, and only registered names resolve. Cases cover null, empty and explicit names for one film, each name and null for two, an unknown name, toString and an empty registry.
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
  for (const name of [null, "", "opening"]) {
    const selected: ReturnType<typeof selectFilm> = selectFilm({ opening }, name);
    assert.equal(selected.name, "opening");
    assert.equal(selected.film, opening);
  }
  assert.equal(selectFilm({ opening, ending }, "ending").film, ending);
  assert.equal(selectFilm({ opening, ending }, "opening").film, opening);
  for (const [registry, name] of [
    [{ opening, ending }, null],
    [{ opening, ending }, ""],
    [{ opening, ending }, "middle"],
    [{ opening }, "toString"],
    [{}, null],
  ] as const)
    assert.throws((): unknown => selectFilm(registry, name));
}
