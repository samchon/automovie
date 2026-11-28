import { AutoMovieArchetypeTable } from "@automovie/archetypes";
import type { IAutoMoviePhysicalShape } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { nclose } from "../../internal/nclose";

/**
 * A raised kitchen bar places its base behind the seated knee space.
 *
 * Scenarios:
 * 1. Its work surface is 1.067 m above the floor.
 * 2. Its 0.305 m overhang is on +Z and the back of the base is flush.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the raised work surface, forward seated knee clearance and flush rear base.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the actual kitchen bar and compares the top and base box extents in Y and Z. Confirms clearance on the seated side and no rear overhang.
 * @evidence contracts/development/testing.md#independent-expectations The authored fixture uses a surface 1.067 metres above its floor and 0.305 metres of knee space. The difference between actual front faces must equal the latter within one millimetre.
 */
export function test_archetypes_furniture_bar_knee_space(): void {
  const item: ReturnType<typeof AutoMovieArchetypeTable.create> = AutoMovieArchetypeTable.create({ kind: "bar" });
  const shapes: IAutoMoviePhysicalShape[] = item.shapes();
  const top: IAutoMoviePhysicalShape | undefined = shapes.find(
    (part): boolean => part.id === "top",
  );
  const base: IAutoMoviePhysicalShape | undefined = shapes.find(
    (part): boolean => part.id === "base",
  );
  assert.ok(top?.kind === "box" && base?.kind === "box");
  const topZ: number = top.transform.position.z;
  const baseZ: number = base.transform.position.z;
  TestValidator.predicate(
    "the 42-inch counter and its knee space face the sitter",
    nclose(top.transform.position.y + top.halfExtents.y, 1.067, 1e-3) &&
      nclose(
        topZ + top.halfExtents.z - (baseZ + base.halfExtents.z),
        0.305,
        1e-3,
      ) &&
      nclose(topZ - top.halfExtents.z, baseZ - base.halfExtents.z, 1e-3),
  );
}
