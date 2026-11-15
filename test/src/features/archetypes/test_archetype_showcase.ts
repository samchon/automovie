import { ArchetypeUnits, createShowcase } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A glass showcase stands at Econoco's sizes, its length and mass one showcase's between the two read.
 *
 * Scenarios:
 * 1. Over the seeds the length runs over the maker's 48 to 70 in; the case is 20 in deep and 38 in high, its top at 38 in.
 * 2. At either end of its size the showcase is the maker's: 48 in and 170 lb, or 70 in and 190 lb; midway, 59 in and 180 lb.
 * 3. The edge is the top's customer-side edge, at `+Z` half the depth out.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced collider, contacts and mass; a size off the sheet, a mass not following its length, or an edge on the clerk's side is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are the maker's restated here; the midway showcase is the two read ones' mean.
 * @evidence contracts/development/testing.md#distinguishing-cases Both ends of the size and its middle.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios and what each pins.
 */
export function test_archetype_showcase(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const inch: number = ArchetypeUnits.INCH;
  const pound: number = ArchetypeUnits.POUND;
  findings.push(
    ...archetypeBandSweep([
      {
        name: "showcase length",
        measure: (seed: number): number =>
          archetypeExtent(createShowcase({}, seed), "x").size,
        minimum: 48 * inch,
        maximum: 70 * inch,
        source: "Econoco Full Vision Showcase",
      },
    ]),
  );
  for (const [size, length, mass] of [
    [0, 48, 170],
    [0.5, 59, 180],
    [1, 70, 190],
  ] as const) {
    const showcase: ReturnType<typeof createShowcase> = createShowcase({
      size,
    });
    near(
      `size ${size}'s length`,
      archetypeExtent(showcase, "x").size,
      length * inch,
    );
    near(`size ${size}'s mass`, showcase.properties.mass, mass * pound);
    near(
      `size ${size}'s depth`,
      archetypeExtent(showcase, "z").size,
      20 * inch,
    );
    near(
      `size ${size}'s height`,
      archetypeExtent(showcase, "y").size,
      38 * inch,
    );
    near(
      `size ${size}'s top`,
      showcase.affordance("top").frame.translation.y,
      38 * inch,
    );
    near(
      `size ${size}'s edge`,
      showcase.affordance("edge").frame.translation.z,
      10 * inch,
    );
  }
  TestValidator.equals("a glass showcase is the maker's", findings, []);
}
