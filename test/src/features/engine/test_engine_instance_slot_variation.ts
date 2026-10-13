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
 * Legacy omission and each enhanced feature preserve their admitted output shape; explicit members select the declared prototype and refuse an unavailable identity.
 *
 * Scenarios:
 * 1. Each enhanced declaration adds the four contract fields beside the legacy eight.
 * 2. An explicit prototype resolves the named recipe; its adjacent missing name refuses.
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
