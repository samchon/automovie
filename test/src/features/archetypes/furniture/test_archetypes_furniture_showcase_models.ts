import { createShowcase } from "@automovie/archetypes";
import type { IAutoMoviePhysicalShape } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Conversion from inches to metres. */
const INCH: number = 0.0254;

/** Conversion from avoirdupois pounds to kilograms. */
const POUND: number = 0.45359237;

/**
 * The two listed Full Vision cases carry their own width and mass together.
 *
 * Scenarios:
 * 1. The 48-inch 170-pound and 70-inch 190-pound models use the specified size.
 * 2. Each model's service edge lies halfway along its depth on the case top.
 */
export function test_archetypes_furniture_showcase_models(): void {
  for (const [model, length, mass] of [
    ["PW/SC482", 48 * INCH, 170 * POUND],
    ["PW/SC702", 70 * INCH, 190 * POUND],
  ] as const) {
    const item: ReturnType<typeof createShowcase> = createShowcase({ model });
    const body: IAutoMoviePhysicalShape | undefined = item
      .shapes()
      .find((part): boolean => part.id === "case");
    assert.ok(body?.kind === "box", `${model} emits its solid case`);
    TestValidator.predicate(
      `${model} uses the maker's case dimensions and mass`,
      vclose(
        body.halfExtents,
        { x: length / 2, y: 19 * INCH, z: 10 * INCH },
        1e-9,
      ) &&
        nclose(item.properties.mass, mass, 1e-9) &&
        vclose(
          item.affordance("edge").frame.translation,
          { x: 0, y: 38 * INCH, z: 10 * INCH },
          1e-9,
        ),
    );
  }
}
