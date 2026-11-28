import { AutoMovieArchetypeUnits, AutoMovieArchetypeBarrel } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";
import { archetypeModelSweep } from "../../internal/archetypeModelSweep";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A steel drum and a keg stand at their sources' sizes, taken by two hands at the top rim's ends and stacked on along their tops.
 *
 * Scenarios:
 * 1. The steel drum is Pipeline Packaging's 22.5 in across and, over 200 seeds, exactly its DWG20459, 34.75 in high and 38.4 lb, or its DWG20443, 35 1/4 in high and 43 lb, height and mass together, each drawn; the keg KegLand's 50 L DIN keg, 381 +/- 2 mm across and 600 +/- 3 mm high.
 * 2. Each barrel's `left` and `right` lie on the top rim at the `+X` and `-X` ends of its diameter, `+Y` pointing out, and its `top` outline lies inside the rim at the top.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two correlated drum models, the keg measurement interval and each rim-contact frame.
 * @evidence contracts/development/testing.md#behavioral-verification Measures the collider of each barrel and the contact position and normal in the built models. The seed sweep distinguishes paired drum variants from independently picked height and mass.
 * @evidence contracts/development/testing.md#independent-expectations Uses the drum sheets' paired heights and masses and the published DIN keg diameter and height intervals. The two rim hand positions follow from the measured diameter and top plane.
 */
export function test_archetype_barrel(): void {
  const findings: string[] = [];

  // 1. The sizes.
  const sweep = (
    kind: AutoMovieArchetypeBarrel.Kind,
    axis: "x" | "y",
    minimum: number,
    maximum: number,
    source: string,
  ): archetypeBandSweep.IRow => ({
    name: `${kind} ${axis === "x" ? "diameter" : "height"}`,
    measure: (seed: number): number =>
      archetypeExtent(AutoMovieArchetypeBarrel.create({ kind }, seed), axis).size,
    minimum,
    maximum,
    source,
  });
  findings.push(
    ...archetypeBandSweep([
      sweep(
        "steelDrum",
        "x",
        22.5 * AutoMovieArchetypeUnits.INCH,
        22.5 * AutoMovieArchetypeUnits.INCH,
        "Pipeline Packaging, 22.5 in",
      ),
      sweep("keg", "x", 0.379, 0.383, "KegLand 50 L DIN, 381 +/- 2 mm"),
      sweep("keg", "y", 0.597, 0.603, "KegLand 50 L DIN, 600 +/- 3 mm"),
    ]),
    ...archetypeModelSweep([
      {
        name: "steel drum height and mass",
        measure: (seed: number): readonly number[] => {
          const drum: ReturnType<typeof AutoMovieArchetypeBarrel.create> = AutoMovieArchetypeBarrel.create(
            { kind: "steelDrum" },
            seed,
          );
          return [archetypeExtent(drum, "y").size, drum.properties.mass];
        },
        models: [
          [
            34.75 * AutoMovieArchetypeUnits.INCH,
            38.4 * AutoMovieArchetypeUnits.POUND,
          ],
          [
            35.25 * AutoMovieArchetypeUnits.INCH,
            43 * AutoMovieArchetypeUnits.POUND,
          ],
        ],
        source: "Pipeline Packaging DWG20459 and DWG20443",
      },
    ]),
  );

  // 2. The hands and the top.
  for (const kind of AutoMovieArchetypeBarrel.KINDS)
    for (const seed of [0, 9]) {
      const barrel: ReturnType<typeof AutoMovieArchetypeBarrel.create> = AutoMovieArchetypeBarrel.create(
        { kind },
        seed,
      );
      const x: { low: number; high: number } = archetypeExtent(barrel, "x");
      const top: number = archetypeExtent(barrel, "y").high;
      for (const [id, rim, out] of [
        ["left", x.high, 1],
        ["right", x.low, -1],
      ] as const) {
        const frame: IAutoMovieTransform = barrel.affordance(id).frame;
        if (
          !(
            Math.abs(frame.translation.x - rim) <= MM &&
            Math.abs(frame.translation.y - top) <= MM &&
            Math.abs(frame.translation.z) <= MM
          )
        )
          findings.push(`${kind} ${seed}: ${id} is off the top rim`);
        const outward: number =
          AutoMovieEngineQuaternion.rotateVector(frame.rotation, AutoMovieEngineVector3.create(0, 1, 0)).x *
          out;
        if (!(outward > 1 - 1e-6))
          findings.push(`${kind} ${seed}: ${id} does not face out`);
      }
      const stack: IAutoMovieAffordance = barrel.affordance("top");
      const radius: number = (x.high - x.low) / 2;
      if (!(Math.abs(stack.frame.translation.y - top) <= MM))
        findings.push(`${kind} ${seed}: the top is off the barrel's top`);
      for (const corner of stack.extent!)
        if (!(Math.hypot(corner.x, corner.z) <= radius + 1e-9))
          findings.push(`${kind} ${seed}: the top reaches past the rim`);
    }
  TestValidator.equals(
    "barrels stand at their sources and are taken at their rims",
    findings,
    [],
  );
}
