import { createTable } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/** NKBA Guideline 9: a 42 in (1067 mm) counter with a 12 in (305 mm) deep knee space; NKBA's 508 to 635 mm deep counter under it. */
const NKBA: Readonly<{
  height: number;
  knee: number;
  counter: readonly [number, number];
}> = {
  height: 1.067,
  knee: 0.305,
  counter: [0.508, 0.635],
};

/**
 * A bar counter stands at the kitchen guideline's raised height, its top reaching the guideline's knee space past its base over the seated side.
 *
 * Scenarios:
 * 1. The top, its `stack` and its `front` edge lie 1067 mm up.
 * 2. The base stands under the top's back, as deep as NKBA's counter range, and the top reaches 305 mm past the base's front on `+Z`, where a seated person's knees go.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced top and base colliders and the contact frames over the seeds; a bar at a kitchen counter's height or with no knee space is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The 1067 and 305 mm and the counter depths are NKBA's figures restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases The raised bar against the plain counter's 50 mm overhang, which `test_archetype_furniture_bands` covers.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
 */
export function test_archetype_table_bar(): void {
  const findings: string[] = [];
  for (const seed of [0, 6, 13]) {
    const bar: ReturnType<typeof createTable> = createTable(
      { kind: "bar" },
      seed,
    );
    for (const id of ["top", "stack", "front"] as const)
      if (
        !(Math.abs(bar.affordance(id).frame.translation.y - NKBA.height) <= MM)
      )
        findings.push(`bar ${seed}: ${id} off the guideline's height`);
    const top: { low: number; high: number } = archetypeExtent(bar, "z", [
      "top",
    ]);
    const base: { low: number; high: number } = archetypeExtent(bar, "z", [
      "base",
    ]);
    if (!(Math.abs(top.high - base.high - NKBA.knee) <= MM))
      findings.push(
        `bar ${seed}: the knee space is ${top.high - base.high}, ${NKBA.knee} expected`,
      );
    if (!(Math.abs(top.low - base.low) <= MM))
      findings.push(`bar ${seed}: the base is not flush at the back`);
  }
  findings.push(
    ...archetypeBandSweep([
      {
        name: "bar counter base depth",
        measure: (seed: number): number =>
          archetypeExtent(createTable({ kind: "bar" }, seed), "z", ["base"])
            .size,
        minimum: NKBA.counter[0],
        maximum: NKBA.counter[1],
        source: "NKBA counter depth",
      },
    ]),
  );
  TestValidator.equals(
    "a bar counter stands at the guideline's height with its knee space",
    findings,
    [],
  );
}
