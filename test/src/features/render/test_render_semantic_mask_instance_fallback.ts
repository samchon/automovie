import {
  IAutoMovieSceneNode,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
  IAutoMovieSemanticMaskGap,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieRenderSubject, AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES, deriveAutoMovieSemanticMask, resolveAutoMovieSemanticMask } from "@automovie/engine";



import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";
import { instanceSetFixture } from "../internal/renderFixtures";

/**
 * Compact instances retain per-slot identity only when their whole set fits the declared entry bound.
 *
 * Scenarios:
 * 1. All 12 window slots have distinct colours, including a resolved seventh slot.
 * 2. A 65536-slot set cannot fit beside its entity claims and keeps one set-level colour with the original actionable gap.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives real compact-set metadata and resolves slot seven, checking unique slot colours when the set fits and explicit set-level fallback with an actionable gap when it does not.
 * @evidence contracts/testing.md#independent-expectations The authored twelve windows supply the expected slot population and index; 65536 slots plus existing entity claims exceed the same declared entry bound, so no partial slot palette is expected. Derived colours serve lookup keys and are not independent RGB expectations.
 * @evidence contracts/testing.md#distinguishing-cases Small fitting and oversized complete sets preserve per-slot versus set-level behaviour, distinct colours, bounded gap count and split remedy; raw entity capacity and general owner chains are separate units.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_semantic_mask_instance_fallback owns its cases. Portable compact metadata derivation, with no 65536-object scene construction, instanced drawing or GPU readback.
 */
export function test_render_semantic_mask_instance_fallback(): void {
  const {
    subject,
  }: {
    subject: () => IAutoMovieRenderSubject;
    bulk: (semantic: string) => IAutoMovieSceneNode;
    broken: (owner: string) => IAutoMovieSemanticMask;
    cyclic: () => IAutoMovieSemanticMask;
  } = createSemanticMaskTestInputs();

  const mask: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask(subject());

  const slots: IAutoMovieSemanticMaskEntry[] = mask.entries.filter(
    (entry: IAutoMovieSemanticMaskEntry): boolean => entry.slot !== null,
  );

  TestValidator.equals(
    "each repeated window slot is individually addressable",
    {
      count: slots.length,
      distinct: new Set(
        slots.map((entry: IAutoMovieSemanticMaskEntry): string => entry.color),
      ).size,
      seventh: resolveAutoMovieSemanticMask(
        mask,
        mask.entries.find(
          (entry: IAutoMovieSemanticMaskEntry): boolean =>
            entry.id === "instance-slot:windows#7",
        )!.color,
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

  const crowded: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask({
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
      slots: crowded.entries.filter(
        (entry: IAutoMovieSemanticMaskEntry): boolean => entry.slot !== null,
      ).length,
      set: crowded.entries.some(
        (entry: IAutoMovieSemanticMaskEntry): boolean =>
          entry.id === "instance-set:windows",
      ),
      gap: crowded.unaddressed.map(
        (
          gap: IAutoMovieSemanticMaskGap,
        ): {
          instanceSet: string;
          slots: number;
          bounded: boolean;
          actionable: boolean;
        } => ({
          instanceSet: gap.instanceSet,
          slots: gap.slots,
          bounded: gap.reason.includes("bounded maximum"),
          actionable: gap.remedy.includes("split"),
        }),
      ),
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
}
