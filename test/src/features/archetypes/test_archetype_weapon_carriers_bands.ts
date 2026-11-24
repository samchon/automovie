import {
  AutoMovieArchetypeUnits,
  createHolster,
  createSword,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** Wulflund's rule of fit for a scabbard. */
const FIT: string = "Wulflund, 1.5 cm longer and 2 cm wider than the blade";

/**
 * Every carrier kind stays inside its cited dimensions for every seed, measured on the produced thing, and a scabbard made to fit a drawn sword holds it.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: a holster's mouth 1.5 in below to 1.5 in above its belt line; a scabbard 0.621 m (a katana's shortest blade) to 1.055 m (a rapier's) and a sheath 0.193 to 0.375 m from tip to mouth; a quiver 18 to 22.5 in deep and 0.62 to 0.68 kg.
 * 2. For ten seeds of each blade a scabbard or a sheath is made to, the four read swords and the sabre, katana, rapier, dagger and knife: one made to that blade, at its read size or at the drawn blade's size with Wulflund's fit, is admitted, is longer than the blade and its throat wider than the blade at its guard.
 * 3. A scabbard's `mouth` is the top of its throat.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each carrier for 200 seeds and measures its colliders and contact frames, then fits scabbards to drawn swords; a band other than the citation's, a seed that does not vary it, a scabbard shorter or narrower than its blade, or a mouth off the scabbard's top is caught.
 * @evidence contracts/development/testing.md#independent-expectations Safariland's ride heights, Wulflund's rule of fit on createSword's blades, the back quivers' depths and weights are written here from their sources; a blade must be shorter and narrower than the scabbard that holds it.
 * @evidence contracts/development/testing.md#distinguishing-cases Every kind; every blade a scabbard or a sheath is made to, read swords whole and banded kinds drawn; slots belong to `test_archetype_weapon_carriers_slots`, the default holster to `test_archetype_weapon_holster_unchanged`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_weapon_carriers_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "holster ride",
      -1.5 * AutoMovieArchetypeUnits.INCH,
      1.5 * AutoMovieArchetypeUnits.INCH,
      "Safariland ride heights",
      (seed: number): number =>
        createHolster({}, seed).affordance("socket").frame.translation.y,
    ),
    row(
      "scabbard length",
      0.606 + 0.015,
      1.04 + 0.015,
      FIT,
      (seed: number): number =>
        archetypeExtent(createHolster({ kind: "scabbard" }, seed), "y").size,
    ),
    row(
      "sheath length",
      0.178 + 0.015,
      0.36 + 0.015,
      FIT,
      (seed: number): number =>
        archetypeExtent(createHolster({ kind: "sheath" }, seed), "y").size,
    ),
    row(
      "quiver depth",
      18 * AutoMovieArchetypeUnits.INCH,
      22.5 * AutoMovieArchetypeUnits.INCH,
      "back quivers, 18 to 22.5 in",
      (seed: number): number =>
        createHolster({ kind: "quiver" }, seed).affordance("socket").frame
          .translation.y,
    ),
    row(
      "quiver mass",
      0.62,
      1.5 * AutoMovieArchetypeUnits.POUND,
      "20 in back quivers",
      (seed: number): number =>
        createHolster({ kind: "quiver" }, seed).body.mass,
    ),
  ]);

  // 2. A scabbard or a sheath made to a blade holds it: a read sword's at its own size, a banded kind's at the drawn blade's with the fit.
  for (const [sword, model, carrier, made] of [
    ["longsword", "crecy", "scabbard", "crecy"],
    ["longsword", "regent", "scabbard", "regent"],
    ["armingSword", "knight", "scabbard", "knight"],
    ["armingSword", "poitiers", "scabbard", "poitiers"],
    ["sabre", undefined, "scabbard", "sabre"],
    ["katana", undefined, "scabbard", "katana"],
    ["rapier", undefined, "scabbard", "rapier"],
    ["dagger", undefined, "sheath", "dagger"],
    ["knife", undefined, "sheath", "knife"],
  ] as const)
    for (let seed: number = 0; seed < 10; seed++) {
      const blade: ReturnType<typeof createSword> = createSword(
        model === undefined ? { kind: sword } : { kind: sword, model },
        seed,
      );
      const length: number = blade.dimensions.bladeLength!;
      const width: number = blade.dimensions.bladeWidth!;
      let fitted: ReturnType<typeof createHolster>;
      try {
        fitted = createHolster(
          model === undefined
            ? {
                kind: carrier,
                blade: made,
                length: length + 0.015,
                width: width + 0.02,
              }
            : { kind: carrier, blade: made },
          seed,
        );
      } catch (error) {
        findings.push(
          `${sword}@${seed}: no ${carrier} fits it (${error instanceof Error ? error.message : String(error)})`,
        );
        continue;
      }
      if (
        !(archetypeExtent(fitted, "y").size > length) ||
        !(archetypeExtent(fitted, "z", ["throat"]).size > width)
      )
        findings.push(`${sword}@${seed}: its ${carrier} does not hold it`);
    }

  for (const kind of ["scabbard", "sheath"] as const)
    for (const seed of [0, 1, 2]) {
      const scabbard: ReturnType<typeof createHolster> = createHolster(
        { kind },
        seed,
      );
      if (
        Math.abs(
          scabbard.affordance("mouth").frame.translation.y -
            archetypeExtent(scabbard, "y", ["throat"]).high,
        ) > 1e-9
      )
        findings.push(`${kind}@${seed}: the mouth is off the throat's top`);
    }
  TestValidator.equals("the carriers stay in their cited bands", findings, []);
}
