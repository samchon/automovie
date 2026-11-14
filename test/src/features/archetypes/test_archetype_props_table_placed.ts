import {
  type Archetype,
  createFood,
  createLight,
  createTableware,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypePlaced } from "../internal/archetypePlaced";

/**
 * The tableware, the food and the lights are placed in a scene where they were put, on the floor and on a table top.
 *
 * Scenarios:
 * 1. Every tableware, food and light kind, placed on a line through the public chain on the floor, each turned a different way: each rests at its placement, its lowest point on the floor within a millimetre, and every contact it declares is a named point of the prop at its own place.
 * 2. A plate, an apple and a candle placed on a support 0.74 m high, a dining table's top: each rests on it the same way.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places every archetype of the three producers through the public chain and reads the displayed prop frames and contacts; one that floats, sinks below its support or drops a contact fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Resting on the support is the producers' contract that an archetype's origin is on its own underside; the 0.74 m is only a height above the floor, any one serving.
 * @evidence contracts/development/testing.md#distinguishing-cases Every kind on the floor; three of the three producers on a raised support, where a frame that ignores the support's height would fail; sizes belong to the band tests.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
 */
export function test_archetype_props_table_placed(): void {
  const kinds = <Kind extends string>(
    name: string,
    all: readonly Kind[],
    make: (kind: Kind) => Archetype,
    yaw: number,
  ): archetypePlaced.IRow[] =>
    all.map(
      (kind: Kind, k: number): archetypePlaced.IRow => ({
        name: `${name}-${kind}`,
        archetype: make(kind),
        yaw: yaw + 15 * k,
      }),
    );
  TestValidator.equals(
    "the tableware, food and lights are placed",
    archetypePlaced([
      ...kinds(
        "tableware",
        createTableware.KINDS,
        (kind: createTableware.Kind): Archetype => createTableware({ kind }),
        0,
      ),
      ...kinds(
        "food",
        createFood.KINDS,
        (kind: createFood.Kind): Archetype => createFood({ kind }),
        90,
      ),
      ...kinds(
        "light",
        createLight.KINDS,
        (kind: createLight.Kind): Archetype => createLight({ kind }),
        180,
      ),
      {
        name: "plate-on-table",
        archetype: createTableware({ kind: "plate" }, 1),
        on: 0.74,
        yaw: 30,
      },
      {
        name: "apple-on-table",
        archetype: createFood({ kind: "apple" }, 1),
        on: 0.74,
        yaw: 60,
      },
      {
        name: "candle-on-table",
        archetype: createLight({ kind: "candle" }, 1),
        on: 0.74,
        yaw: 90,
      },
    ]),
    [],
  );
}
