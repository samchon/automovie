import type { Archetype } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeCatalog } from "../internal/archetypeCatalog";

/**
 * Every grip an archetype declares states how it repeats as the hand turns about the axis it wraps (`IAutoMovieAffordance.symmetry`), so a grasp chooser knows which turns about a handle are the same grasp instead of guessing.
 *
 * A `handle`, a `bar` and a `rein` are the grips; the expected values below are each object's geometry: a round part a hand wraps alike from any side (a bottle's body, a bat's or a club's handle, a rung, a rail, a bar, a rope, a ball) is `round`; a flat part with two equal faces (a comb's back, a spoon's, a fork's or a hammer's handle, a hurdle's board) is `half`; a part a hand takes one way only (a pistol's grip, a blade's hilt, a mug's or a door's handle, a racket's flats, a device's body) is `none`.
 *
 * Scenarios, for every row of the archetype catalog at the middle of its bands:
 * 1. Every `handle`, `bar` and `rein` states a symmetry.
 * 2. The ones named below state the expected one.
 * 3. No other kind of contact states one.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds every catalog archetype and reads its declared affordances; a grip left without its symmetry, one with another, or a symmetry on a contact that is no grip fails with the row and the id.
 * @evidence contracts/development/testing.md#independent-expectations The named values are written here from each object's documented geometry, not read from the builders.
 * @evidence contracts/development/testing.md#distinguishing-cases All three values, kinds of one producer that differ (a screwdriver against a hammer), and every other contact kind.
 * @evidence contracts/development/testing.md#execution-ownership Builds each catalog archetype once in memory; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the contract, where the values come from and the 3 scenarios.
 */
export function test_archetype_contract_symmetry(): void {
  type Symmetry = "round" | "half" | "none";
  const GRIPS: ReadonlySet<string> = new Set(["handle", "bar", "rein"]);
  const EXPECTED: Readonly<Record<string, Readonly<Record<string, Symmetry>>>> =
    {
      "drinkware-mug": { body: "round", handle: "none" },
      "drinkware-beerBottle": { body: "round", neck: "round" },
      "club-bat": { grip: "round" },
      "handgun-fullSize": { grip: "none" },
      "sword-longsword": { grip: "none" },
      "racket-tennis": { grip: "none" },
      "tool-hammer": { grip: "half" },
      "tool-screwdriver": { grip: "round" },
      "tool-saw": { grip: "none" },
      "careItem-comb": { grip: "half" },
      "ladder-fixed": { rung1: "round", leftRail: "round" },
      "bar-high": { bar: "round" },
      "pull-up-bar-gym": { bar: "round" },
      "hurdle-men110": { bar: "half" },
      "ball-football": { grip: "round" },
      "device-phone": { grip: "none" },
      "tool-tableKnife": { grip: "none" },
      "tableware-plate": { leftRim: "half", rightRim: "half" },
      "food-apple": { grip: "round" },
      "light-lantern": { grip: "round" },
      "vessel-jug": { handle: "none" },
    };
  const complaints: string[] = [];
  for (const row of archetypeCatalog()) {
    const model: Archetype = row.create();
    for (const a of model.affordances as readonly IAutoMovieAffordance[]) {
      if (!GRIPS.has(a.kind)) {
        if (a.symmetry !== undefined)
          complaints.push(
            `${row.name}.${a.id}, a ${a.kind}, states ${a.symmetry}, no grip`,
          );
        continue;
      }
      if (a.symmetry === undefined) {
        complaints.push(`${row.name}.${a.id} states no symmetry`);
        continue;
      }
      const wanted: Symmetry | undefined = EXPECTED[row.name]?.[a.id];
      if (wanted !== undefined && a.symmetry !== wanted)
        complaints.push(
          `${row.name}.${a.id} states ${a.symmetry}, ${wanted} expected`,
        );
    }
  }
  TestValidator.equals("every grip states its symmetry", complaints, []);
}
