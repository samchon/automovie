import { instanceSlot, type IAutoMovieInstanceSetPlacement } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, throwsError } from "../internal/predicates";
import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";

const LEGACY_KEYS = [
  "facingDeg",
  "modelRecipe",
  "node",
  "palette",
  "position",
  "scale",
  "slot",
  "traits",
];

const keysOf = (value: object): string[] =>
  Object.keys(value).sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );


/**
 *
 * Legacy omission and each enhanced feature preserve their admitted output shape; explicit members select the declared prototype and refuse an unavailable identity.
 *
 * Scenarios:
 * 1. Each enhanced declaration adds the four contract fields beside the legacy eight.
 * 2. An explicit prototype resolves the named recipe; its adjacent missing name refuses.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `instanceSlot` on slot 0 of a legacy placement and six placements that each declare one enhanced feature, asserting the sorted key set of the returned member, then on an explicit member naming `short` and `ghost`; it catches a legacy set that starts emitting `prototype`, `rotation`, `scale3` or `visible`, an enhanced feature that omits any of the four, an explicit prototype that falls back to a weighted draw, and an unknown prototype that resolves silently.
 * @evidence contracts/testing.md#independent-expectations The eight legacy keys and the four added keys restate the member output contract the engine documents for sets with and without enhanced declarations; `short-body` is the recipe the authored table pairs with `short`, and the refusal is matched by its message fragment; key presence is checked, not the drawn values inside them.
 * @evidence contracts/testing.md#distinguishing-cases Negative legacy placement with no enhanced feature, positives for prototypes, lattice, explicit layout, `scale3`, `rotationDeg` and `visibleProbability` declared alone, a named prototype, and the adjacent missing name; weighted proportions belong to `test_engine_instance_prototype_distribution`, rotation and per-axis values to `test_engine_instance_transform_axes`, and lattice and explicit positions to `test_engine_instance_slot_layouts`.
 */
export const test_engine_instance_slot_variation = (): void => {
  const table = crowd({
    prototypes: [
      { id: "default", modelRecipe: "body", weight: 1 },
      { id: "tall", modelRecipe: "tall-body", weight: 2 },
      { id: "short", modelRecipe: "short-body", weight: 1 },
    ],
  });
  // 1. Legacy and enhanced shapes.
  const legacy = instanceSlot(crowd(), 0);
  const enhanced: Array<[string, IAutoMovieInstanceSetPlacement]> = [
    [
      "prototypes",
      crowd({
        prototypes: [{ id: "default", modelRecipe: "body", weight: 1 }],
      }),
    ],
    [
      "lattice",
      crowd({
        count: 8,
        layout: {
          kind: "lattice",
          rows: 2,
          columns: 2,
          layers: 2,
          spacing: { x: 1, y: 1, z: 1 },
        },
      }),
    ],
    [
      "explicit",
      crowd({
        count: 1,
        layout: {
          kind: "explicit",
          transforms: [
            {
              id: "one",
              translation: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            },
          ],
        },
      }),
    ],
    [
      "scale3",
      crowd({
        variation: {
          ...crowd().variation,
          scale3: { min: { x: 1, y: 1, z: 1 }, max: { x: 2, y: 2, z: 2 } },
        },
      }),
    ],
    [
      "rotationDeg",
      crowd({
        variation: {
          ...crowd().variation,
          rotationDeg: {
            x: { min: 0, max: 0 },
            y: { min: 0, max: 90 },
            z: { min: 0, max: 0 },
          },
        },
      }),
    ],
    [
      "visibleProbability",
      crowd({ variation: { ...crowd().variation, visibleProbability: 0.5 } }),
    ],
  ];
  TestValidator.equals(
    "only a set declaring an enhanced feature carries the enhanced fields",
    namedFacts([
      ["legacyKeys", () => keysOf(legacy).join(",") === LEGACY_KEYS.join(",")],
      ...enhanced.map(
        ([name, placement]) =>
          [
            name,
            () =>
              keysOf(instanceSlot(placement, 0)).join(",") ===
              [...LEGACY_KEYS, "prototype", "rotation", "scale3", "visible"]
                .sort((left, right) =>
                  left < right ? -1 : left > right ? 1 : 0,
                )
                .join(","),
          ] as const,
      ),
    ]),
    {
      legacyKeys: true,
      prototypes: true,
      lattice: true,
      explicit: true,
      scale3: true,
      rotationDeg: true,
      visibleProbability: true,
    },
  );


  // 5. Explicit prototype selection.
  const named = (prototype: string) =>
    crowd({
      count: 1,
      prototypes: table.prototypes,
      layout: {
        kind: "explicit",
        transforms: [
          {
            id: "named",
            translation: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
            prototype,
          },
        ],
      },
    });
  TestValidator.equals(
    "an explicit member selects the prototype it names",
    namedFacts([
      [
        "named",
        () => instanceSlot(named("short"), 0).modelRecipe === "short-body",
      ],
      [
        "missing",
        () =>
          throwsError(
            () => instanceSlot(named("ghost"), 0),
            'slot 0 references missing prototype "ghost"',
          ),
      ],
    ]),
    { named: true, missing: true },
  );


};
