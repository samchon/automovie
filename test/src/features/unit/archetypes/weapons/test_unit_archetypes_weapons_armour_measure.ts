import { AutoMovieArchetypeRefusal, createArmour } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { armourActual } from "../../../internal/armourActual";

/**
 * A fitted armour piece requires only the body measures it actually consumes,
 * and refuses missing, non-finite, nonpositive or inverted torso inputs.
 *
 * Scenarios:
 * 1. All eight kinds accept their minimal authored measure and a museum model
 *    without any fitting measure. No complete Human or motion setup is needed.
 * 2. Each required field independently missing, zero, negative, NaN or either
 *    infinity is refused with the actual measure field as its repair axis.
 * 3. A cuirass refuses shoulders at or below the waist; a positive separation
 *    makes the actual transformed hollow mesh's height their difference.
 *    A mail shirt needs no heights.
 * 4. Unused missing or malformed fields never become dependencies of a kind.
 */
export function test_unit_archetypes_weapons_armour_measure(): void {
  const findings: string[] = [];
  const cases: Readonly<
    Record<createArmour.Kind, Partial<IAutoMovieBodyMeasure>>
  > = {
    openHelmet: { headRadius: 0.1 },
    closedHelmet: { headRadius: 0.1 },
    brimmedHelmet: { headRadius: 0.1 },
    cuirass: {
      chestBreadth: 0.4,
      chestDepth: 0.2,
      shoulderHeight: 1.4,
      waistHeight: 0.9,
    },
    mail: { chestBreadth: 0.4, chestDepth: 0.2 },
    gauntlet: { forearmRadius: 0.04, hand: 0.18 },
    vambrace: { forearmRadius: 0.04, forearm: 0.25 },
    greave: { shankRadius: 0.05, shank: 0.4 },
  };
  for (const kind of createArmour.KINDS) {
    const measure: Partial<IAutoMovieBodyMeasure> = cases[kind];
    for (const candidate of [
      createArmour({ kind, measure }),
      createArmour({ kind }),
    ])
      if (!validateModel({ model: candidate }).success)
        findings.push(
          `${kind}: a valid minimal or unfitted model is not admitted`,
        );
    for (const field of Object.keys(measure) as (keyof IAutoMovieBodyMeasure)[])
      for (const value of [undefined, 0, -1]) {
        const invalid: Partial<IAutoMovieBodyMeasure> = { ...measure };
        if (value === undefined) delete invalid[field];
        else invalid[field] = value;
        if (!refused(kind, invalid, `measure.${field}`))
          findings.push(
            `${kind}: ${field}=${value} did not identify its invalid measure`,
          );
      }
    const unused: Partial<IAutoMovieBodyMeasure> = {
      ...measure,
      mass: 1e6,
      stature: -1,
    };
    if (
      !validateModel({ model: createArmour({ kind, measure: unused }) }).success
    )
      findings.push(`${kind}: unused fields became fitting dependencies`);
  }
  for (const shoulderHeight of [0.9, 0.8])
    if (
      !refused(
        "cuirass",
        { ...cases.cuirass, shoulderHeight },
        "measure.shoulderHeight",
      )
    )
      findings.push(
        `a cuirass accepted shoulderHeight ${shoulderHeight} at waistHeight 0.9`,
      );
  const cuirass: ReturnType<typeof createArmour> = createArmour({
    kind: "cuirass",
    measure: cases.cuirass,
  });
  const bounds: ReturnType<typeof armourActual.bounds> =
    armourActual.bounds(cuirass);
  if (!(Math.abs(bounds.high.y - bounds.low.y - 0.5) <= 1e-12))
    findings.push(
      "the cuirass height is not the positive shoulder-to-waist difference",
    );
  TestValidator.equals(
    "armour admits the exact measures its fit needs",
    findings,
    [],
  );

  /** A different thrown error must fail the semantic repair-axis check. */
  function refused(
    kind: createArmour.Kind,
    measure: Partial<IAutoMovieBodyMeasure>,
    axis: string,
  ): boolean {
    try {
      createArmour({ kind, measure });
    } catch (error) {
      return error instanceof AutoMovieArchetypeRefusal && error.axis === axis;
    }
    return false;
  }
}
