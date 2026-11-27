import { AutoMovieArchetypeUnits, AutoMovieArchetypeProjectile } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/**
 * Projectiles stay inside their cited sizes for every seed, measured on the produced thing, and rest where they were put.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a musket ball 0.66 to 0.72 in across its collider and as its pinch's width, a pound over fourteen in mass; an arrow 715 to 854 mm long on an 11 to 13 mm shaft, 50 to 62.5 g; a bolt 360 to 437 mm long on a 13.6 mm shaft, NMM 11461's derived 65.2 g to Met 33754's 74 g; a round shot 3.58 to 4.52 in across; an M67 grenade 2.5 in across its body, 3.53 in long with its fuze, 14 oz.
 * 2. For three seeds, a ball's and a shot's lowest point is at the origin, and a bolt's or an arrow's `nock` and `tip` are its two ends.
 * 3. The 12-pdr.'s shot is 4.52 in across and weighs 12.3 lb, and the 6-pdr.'s 3.58 in and 6.1 lb.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each projectile for 200 seeds and measures its collider, pinch width and mass; a calibre other than the citation's, a seed that does not vary it, a pinch that is not the ball's width, or a ball off the floor is caught.
 * @evidence contracts/development/testing.md#independent-expectations The excavated balls' .66 to .72 in and the service count of fourteen to the pound; the Mary Rose and Westminster Abbey arrows in Aston and Spencer's study; the two museum bolts; Roberts' shot table, each calibre with its own weight; NMM 11461's ash shaft and steel pyramid head; the M67's Army data sheet.
 * @evidence contracts/development/testing.md#distinguishing-cases Each kind built; the kinds that wait for sources have no rows.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_weapon_projectile_bands(): void {
  const row: (
    name: string,
    minimum: number,
    maximum: number,
    measure: (seed: number) => number,
  ) => archetypeBandSweep.IRow = (
    name: string,
    minimum: number,
    maximum: number,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source: "the cited records",
    measure,
  });
  const ball: (seed: number) => ReturnType<typeof AutoMovieArchetypeProjectile.create> = (
    seed: number,
  ): ReturnType<typeof AutoMovieArchetypeProjectile.create> =>
    AutoMovieArchetypeProjectile.create({ kind: "ball" }, seed);
  const arrow: (seed: number) => ReturnType<typeof AutoMovieArchetypeProjectile.create> = (
    seed: number,
  ): ReturnType<typeof AutoMovieArchetypeProjectile.create> =>
    AutoMovieArchetypeProjectile.create({ kind: "arrow" }, seed);
  const findings: string[] = archetypeBandSweep([
    row(
      "ball diameter",
      0.66 * AutoMovieArchetypeUnits.INCH,
      0.72 * AutoMovieArchetypeUnits.INCH,
      (s: number): number => archetypeExtent(ball(s), "x").size,
    ),
    row(
      "ball pinch",
      0.66 * AutoMovieArchetypeUnits.INCH,
      0.72 * AutoMovieArchetypeUnits.INCH,
      (s: number): number => ball(s).affordance("body").aperture!,
    ),
    row(
      "ball mass",
      AutoMovieArchetypeUnits.POUND / 14,
      AutoMovieArchetypeUnits.POUND / 14,
      (s: number): number => ball(s).body.mass,
    ),
    row(
      "arrow length",
      0.715,
      0.854,
      (s: number): number => archetypeExtent(arrow(s), "y").size,
    ),
    row(
      "arrow shaft",
      0.011,
      0.013,
      (s: number): number => arrow(s).affordance("shaft").aperture!,
    ),
    row("arrow mass", 0.05, 0.0625, (s: number): number => arrow(s).body.mass),
    row(
      "bolt length",
      0.36,
      0.437,
      (s: number): number =>
        archetypeExtent(AutoMovieArchetypeProjectile.create({ kind: "bolt" }, s), "y").size,
    ),
    row(
      "bolt shaft",
      0.0136,
      0.0136,
      (s: number): number =>
        AutoMovieArchetypeProjectile.create({ kind: "bolt" }, s).affordance("shaft").aperture!,
    ),
    row(
      "bolt mass",
      Math.PI * 0.0068 * 0.0068 * (0.36 - 0.077) * 680 +
        ((0.0136 * 0.0136 * 0.077) / 3) * 7850,
      0.074,
      (s: number): number => AutoMovieArchetypeProjectile.create({ kind: "bolt" }, s).body.mass,
    ),
    row(
      "grenade body",
      2.5 * AutoMovieArchetypeUnits.INCH,
      2.5 * AutoMovieArchetypeUnits.INCH,
      (s: number): number =>
        archetypeExtent(AutoMovieArchetypeProjectile.create({ kind: "grenade" }, s), "x").size,
    ),
    row(
      "grenade length",
      3.53 * AutoMovieArchetypeUnits.INCH,
      3.53 * AutoMovieArchetypeUnits.INCH,
      (s: number): number =>
        archetypeExtent(AutoMovieArchetypeProjectile.create({ kind: "grenade" }, s), "y").size,
    ),
    row(
      "grenade mass",
      14 * AutoMovieArchetypeUnits.OUNCE,
      14 * AutoMovieArchetypeUnits.OUNCE,
      (s: number): number => AutoMovieArchetypeProjectile.create({ kind: "grenade" }, s).body.mass,
    ),
    row(
      "shot diameter",
      3.58 * AutoMovieArchetypeUnits.INCH,
      4.52 * AutoMovieArchetypeUnits.INCH,
      (s: number): number =>
        archetypeExtent(AutoMovieArchetypeProjectile.create({ kind: "roundShot" }, s), "x").size,
    ),
  ]);
  for (const seed of [0, 1, 2]) {
    for (const kind of ["ball", "roundShot"] as const)
      if (
        !(
          Math.abs(
            archetypeExtent(AutoMovieArchetypeProjectile.create({ kind }, seed), "y").low,
          ) <= 1e-12
        )
      )
        findings.push(`${kind}@${seed}: off the floor`);
    for (const kind of ["arrow", "bolt"] as const) {
      const shaft: ReturnType<typeof AutoMovieArchetypeProjectile.create> = AutoMovieArchetypeProjectile.create(
        { kind },
        seed,
      );
      if (
        !(
          Math.abs(shaft.affordance("nock").frame.translation.y) <= 1e-12 &&
          Math.abs(
            shaft.affordance("tip").frame.translation.y -
              archetypeExtent(shaft, "y").high,
          ) <= 1e-12
        )
      )
        findings.push(`${kind}@${seed}: the nock or the tip is off its end`);
    }
  }
  for (const [model, diameter, pounds] of [
    ["sixPounder", 3.58, 6.1],
    ["twelvePounder", 4.52, 12.3],
  ] as const) {
    const shot: ReturnType<typeof AutoMovieArchetypeProjectile.create> = AutoMovieArchetypeProjectile.create(
      { kind: "roundShot", model },
      1,
    );
    if (
      !(
        Math.abs(
          archetypeExtent(shot, "x").size -
            diameter * AutoMovieArchetypeUnits.INCH,
        ) <= 1e-12 &&
        Math.abs(shot.body.mass - pounds * AutoMovieArchetypeUnits.POUND) <=
          1e-12
      )
    )
      findings.push(
        `the ${model}'s shot is not ${diameter} in and ${pounds} lb`,
      );
  }
  TestValidator.equals("projectiles stay in their cited bands", findings, []);
}
