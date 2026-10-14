import { instanceSlot, type IAutoMovieInstanceSetPlacement } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, throwsError } from "../internal/predicates";
import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";

const LEGACY_KEYS: readonly string[] = [
  "facingDeg",
  "modelRecipe",
  "node",
  "palette",
  "position",
  "scale",
  "slot",
  "traits",
];

const keysOf: (value: object) => string[] = (value: object): string[] =>
  Object.keys(value).sort((left: string, right: string): number =>
    left < right ? -1 : left > right ? 1 : 0,
  );


/**
 * Legacy omission and each enhanced feature preserve their admitted output shape; explicit members select the declared prototype and refuse an unavailable identity.
 *
 * Scenarios:
 * 1. Each enhanced declaration adds the four contract fields beside the legacy eight.
 * 2. An explicit prototype resolves the named recipe; its adjacent missing name refuses.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual member regenerator and compares its complete own-key population for legacy omission and each enhanced declaration, then observes explicit prototype recipe selection and the missing-id refusal.
 * @evidence contracts/testing.md#independent-expectations Literal legacy eight keys and four extended keys supply the exact shape oracle independently; literal short-body and missing-name error define prototype outcomes. Key-set checks do not establish all extended field values, which their transform/visibility/distribution units own.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts omission with prototypes, lattice, explicit layout, per-axis scale, rotation and visibility probability, plus selected/missing explicit prototype twins. Existing row labels, key order policy and all six enhanced declarations remain unchanged.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns local placements and key/selection callbacks through the existing canonical fixture; it opens no file, renderer, browser or GPU and replaces no foreign method or installed consumer.
 */
export function test_engine_instance_slot_variation(): void {
  const table: ReturnType<typeof crowd> = crowd({
    prototypes: [
      { id: "default", modelRecipe: "body", weight: 1 },
      { id: "tall", modelRecipe: "tall-body", weight: 2 },
      { id: "short", modelRecipe: "short-body", weight: 1 },
    ],
  });
  // 1. Legacy and enhanced shapes.
  const legacy: ReturnType<typeof instanceSlot> = instanceSlot(crowd(), 0);
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
      ["legacyKeys", (): boolean => keysOf(legacy).join(",") === LEGACY_KEYS.join(",")],
      ...enhanced.map(
        ([name, placement]: [string, IAutoMovieInstanceSetPlacement]): readonly [string, () => boolean] =>
          [
            name,
            (): boolean =>
              keysOf(instanceSlot(placement, 0)).join(",") ===
              [...LEGACY_KEYS, "prototype", "rotation", "scale3", "visible"]
                .sort((left: string, right: string): number =>
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
  const named: (prototype: string) => ReturnType<typeof crowd> = (prototype: string): ReturnType<typeof crowd> =>
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
        (): boolean => instanceSlot(named("short"), 0).modelRecipe === "short-body",
      ],
      [
        "missing",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> => instanceSlot(named("ghost"), 0),
            'slot 0 references missing prototype "ghost"',
          ),
      ],
    ]),
    { named: true, missing: true },
  );


}
