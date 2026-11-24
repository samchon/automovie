import { AutoMovieArchetypeUnits, createShowcase } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A glass showcase is one of Econoco's two showcases read, whole.
 *
 * Scenarios:
 * 1. Each model given is the maker's: the PW/SC482 48 in long and 170 lb, the PW/SC702 70 in long and 190 lb, each 20 in deep and 38 in high with its top at 38 in and its edge at `+Z` half the depth out.
 * 2. Over 200 seeds every showcase drawn is one of the two exactly, length and mass together, and both are drawn.
 */
export function test_unit_archetypes_props_showcase(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const inch: number = AutoMovieArchetypeUnits.INCH;
  const read: Readonly<
    Record<createShowcase.Model, readonly [number, number]>
  > = {
    "PW/SC482": [48 * inch, 170 * AutoMovieArchetypeUnits.POUND],
    "PW/SC702": [70 * inch, 190 * AutoMovieArchetypeUnits.POUND],
  };
  const models: createShowcase.Model[] = Object.keys(
    read,
  ) as createShowcase.Model[];
  for (const model of models) {
    const showcase: ReturnType<typeof createShowcase> = createShowcase({
      model,
    });
    const [length, mass]: readonly [number, number] = read[model];
    near(`${model}'s length`, archetypeExtent(showcase, "x").size, length);
    near(`${model}'s mass`, showcase.properties.mass, mass);
    near(`${model}'s depth`, archetypeExtent(showcase, "z").size, 20 * inch);
    near(`${model}'s height`, archetypeExtent(showcase, "y").size, 38 * inch);
    near(
      `${model}'s top`,
      showcase.affordance("top").frame.translation.y,
      38 * inch,
    );
    near(
      `${model}'s edge`,
      showcase.affordance("edge").frame.translation.z,
      10 * inch,
    );
  }
  const drawn: Set<string> = new Set();
  for (let seed: number = 0; seed < 200; seed++) {
    const showcase: ReturnType<typeof createShowcase> = createShowcase(
      {},
      seed,
    );
    const length: number = archetypeExtent(showcase, "x").size;
    const mass: number = showcase.properties.mass;
    const match: createShowcase.Model | undefined = models.find(
      (model: createShowcase.Model): boolean =>
        Math.abs(read[model][0] - length) <= 1e-9 &&
        Math.abs(read[model][1] - mass) <= 1e-9,
    );
    if (match === undefined)
      findings.push(
        `seed ${seed}: ${length} m and ${mass} kg is no read model`,
      );
    else drawn.add(match);
  }
  if (drawn.size !== models.length)
    findings.push(`200 seeds drew only ${[...drawn].join(", ")}`);
  TestValidator.equals("a glass showcase is one the maker makes", findings, []);
}
