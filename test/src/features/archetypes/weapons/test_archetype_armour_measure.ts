import { AutoMovieArchetypeRefusal, createArmour } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { armourActual } from "../../internal/armourActual";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fitting prerequisites, malformed and relative-height cases, the actual transformed hollow-mesh height observation and the authored fixture's distinction from anthropometric data.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public createArmour and engine admission, observes structured refusals and actual transformed torso mesh vertices through armourActual.bounds; catches incomplete Partial measures leaking NaN/invalid geometry and accidental dependence on unused body fields, without substituting a filled primitive or metadata dimension for the hollow artifact.
 * @evidence contracts/development/testing.md#independent-expectations A helmet uses head radius, torso armour uses chest breadth/depth, a cuirass's actual mesh envelope spans waist to shoulders, and each limb solid uses its radius and length; these geometric dependencies follow the documented fit contract. The authored heights 1.4 and 0.9 m require an observed 0.5 m span within the unchanged 1e-12 m allowance. Authored positive SI inputs isolate admission, while the existing armour_fit unit owns measured body sweeps and museum comparisons.
 * @evidence contracts/development/testing.md#distinguishing-cases Eight kind-specific minimal records and unfitted counterparts, every missing/zero/negative/non-finite dependency, equal and reversed torso heights, a valid height difference, and malformed unused fields.
 * @evidence contracts/development/testing.md#execution-ownership One portable discovered in-memory unit uses authored measures and actual armour construction; it starts no Human generation, compiler, runner, renderer or host.
 */
export function test_archetype_armour_measure(): void {
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
      for (const value of [undefined, 0, -1, Number.NaN, Infinity, -Infinity]) {
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
      mass: Number.NaN,
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
