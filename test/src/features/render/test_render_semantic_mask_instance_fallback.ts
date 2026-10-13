import {
  AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES,
  deriveAutoMovieSemanticMask,
  resolveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  instanceSetFixture,
} from "../internal/renderFixtures";

import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";

/**
 * Compact instances retain per-slot identity only when their whole set fits the declared entry bound.
 *
 * Scenarios:
 * 1. All12 window slots have distinct colours, including a resolved seventh slot.
 * 2. A65536-slot set cannot fit beside its entity claims and keeps one set-level colour with the original actionable gap.
 */
export const test_render_semantic_mask_instance_fallback = (): void => {
  const { subject } = createSemanticMaskTestInputs();

  const mask = deriveAutoMovieSemanticMask(subject());

  const slots = mask.entries.filter((entry) => entry.slot !== null);

  TestValidator.equals(
      "each repeated window slot is individually addressable",
      {
        count: slots.length,
        distinct: new Set(slots.map((entry) => entry.color)).size,
        seventh: resolveAutoMovieSemanticMask(
          mask,
          mask.entries.find((entry) => entry.id === "instance-slot:windows#7")!
            .color,
        )!.entry.slot,
        unaddressed: mask.unaddressed,
      },
      {
        count: 12,
        distinct: 12,
        seventh: { instanceSet: "windows", index: 7 },
        unaddressed: [],
      },
    );

  const crowded = deriveAutoMovieSemanticMask({
      ...subject(),
      instanceSets: [
        instanceSetFixture({
          id: "windows",
          count: AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES,
          chunks: 4,
        }),
      ],
    });

  TestValidator.equals(
      "a set too large for the bound stays addressable as a whole and says why",
      {
        slots: crowded.entries.filter((entry) => entry.slot !== null).length,
        set: crowded.entries.some((entry) => entry.id === "instance-set:windows"),
        gap: crowded.unaddressed.map((gap) => ({
          instanceSet: gap.instanceSet,
          slots: gap.slots,
          bounded: gap.reason.includes("bounded maximum"),
          actionable: gap.remedy.includes("split"),
        })),
      },
      {
        slots: 0,
        set: true,
        gap: [
          {
            instanceSet: "windows",
            slots: AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES,
            bounded: true,
            actionable: true,
          },
        ],
      },
    );
};
