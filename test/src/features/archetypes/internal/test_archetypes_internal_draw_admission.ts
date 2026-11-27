import { AutoMovieArchetypeRefusal } from "@automovie/archetypes";
import {
  ArchetypeDraw
} from "../../../../../packages/archetypes/src/core/internal/ArchetypeDraw";
import { TestValidator } from "@nestia/e2e";

/** Admission preserves a selected variant's alternatives and explains a refusal. */
export function test_archetypes_internal_draw_admission(): void {
  type Saved = "red" | "green" | "blue";
  type Variant = "red" | "green";
  const choices: readonly Variant[] = ["red", "green"];
  const admit = (value: Saved | undefined): Variant | undefined =>
    ArchetypeDraw.admit<Saved, Variant>("sample", "color", value, choices);
  TestValidator.equals(
    "absent choice remains unresolved",
    admit(undefined),
    undefined,
  );
  TestValidator.equals("chosen variant value", admit("green"), "green");

  let refusal: unknown;
  try {
    admit("blue");
  } catch (error) {
    refusal = error;
  }
  if (!(refusal instanceof AutoMovieArchetypeRefusal))
    throw new Error("A value from another variant must give a typed refusal");
  TestValidator.equals(
    "a refused saved value identifies the variant's alternatives",
    {
      kind: refusal.kind,
      archetype: refusal.archetype,
      axis: refusal.axis,
      value: refusal.value,
      feasible: refusal.feasible,
    },
    {
      kind: "parameter",
      archetype: "sample",
      axis: "color",
      value: "blue",
      feasible: { kind: "alternatives", values: ["red", "green"] },
    },
  );
}
