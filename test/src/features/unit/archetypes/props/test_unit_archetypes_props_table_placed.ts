import {
  type AutoMovieArchetype,
  createFood,
  createLight,
  createMobilityAid,
  createTableware,
  createUmbrella,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypePlaced } from "../../../internal/archetypePlaced";

/**
 * The tableware, the food and the lights are placed in a scene where they were put, on the floor and on a table top.
 *
 * Scenarios:
 * 1. Every tableware and food kind, every light but the pendant (which hangs from its hook at its origin), a closed and an open umbrella and every walking aid, placed on a line through the public chain on the floor, each turned a different way: each rests at its placement, its lowest point on the floor within a millimetre, and every contact it declares is a named point of the prop at its own place.
 * 2. A plate, an apple and a candle placed on a support 0.74 m high, a dining table's top: each rests on it the same way.
 */
export function test_unit_archetypes_props_table_placed(): void {
  const kinds = <Kind extends string>(
    name: string,
    all: readonly Kind[],
    make: (kind: Kind) => AutoMovieArchetype,
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
        (kind: createTableware.Kind): AutoMovieArchetype =>
          createTableware({ kind }),
        0,
      ),
      ...kinds(
        "food",
        createFood.KINDS,
        (kind: createFood.Kind): AutoMovieArchetype => createFood({ kind }),
        90,
      ),
      ...kinds(
        "light",
        createLight.KINDS.filter(
          (kind: createLight.Kind): boolean => kind !== "pendant",
        ),
        (kind: createLight.Kind): AutoMovieArchetype => createLight({ kind }),
        180,
      ),
      { name: "umbrella", archetype: createUmbrella(), yaw: 270 },
      {
        name: "umbrella-open",
        archetype: createUmbrella({ open: true }),
        yaw: 285,
      },
      ...kinds(
        "mobilityAid",
        createMobilityAid.KINDS,
        (kind: createMobilityAid.Kind): AutoMovieArchetype =>
          createMobilityAid({ kind }),
        300,
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
