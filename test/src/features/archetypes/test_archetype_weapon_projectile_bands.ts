import { createProjectile } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * Projectiles stay inside their cited sizes for every seed, measured on the produced thing, and rest where they were put.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a musket ball 0.66 to 0.72 in across its collider and as its pinch's width, a pound over fourteen in mass; a bolt 360 to 437 mm long on a 13.6 mm shaft, 74 g; a round shot 3.58 to 4.52 in across; an M67 grenade 2.5 in across its body, 3.53 in long with its fuze, 14 oz.
 * 2. For three seeds, a ball's and a shot's lowest point is at the origin, and a bolt's 
ock and 	ip are its two ends, its tip +Y along it.
 * 3. A 4.52 in shot weighs the 12-pdr.'s 12.3 lb within a tenth of a pound, and a 3.58 in shot the 6-pdr.'s 6.1 lb.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each projectile for 200 seeds and measures its collider, pinch width and mass; a calibre other than the citation's, a seed that does not vary it, a pinch that is not the ball's width, or a ball off the floor is caught.
 * @evidence contracts/development/testing.md#independent-expectations The excavated balls' .66 to .72 in and the service count of fourteen to the pound; the two museum bolts; Roberts' shot table, whose two calibres' weights the cube law must reproduce, the 12-pdr.'s being an independent check; the M67's Army data sheet.
 * @evidence contracts/development/testing.md#distinguishing-cases Each kind built; the kinds that wait for sources have no rows.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_weapon_projectile_bands(): void {
  const row = (
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
  const ball = (seed: number): ReturnType<typeof createProjectile> =>
    createProjectile({ kind: "ball" }, seed);
  const findings: string[] = archetypeBandSweep([
    row("ball diameter", 0.66 * 0.0254, 0.72 * 0.0254, (s: number): number =>
      archetypeExtent(ball(s), "x").size,
    ),
    row("ball pinch", 0.66 * 0.0254, 0.72 * 0.0254, (s: number): number =>
      ball(s).affordance("body").aperture!,
    ),
    row("ball mass", 0.4536 / 14, 0.4536 / 14, (s: number): number =>
      ball(s).body.mass,
    ),
    row("bolt length", 0.36, 0.437, (s: number): number =>
      archetypeExtent(createProjectile({ kind: "bolt" }, s), "y").size,
    ),
    row("bolt shaft", 0.0136, 0.0136, (s: number): number =>
      createProjectile({ kind: "bolt" }, s).affordance("shaft").aperture!,
    ),
    row("bolt mass", 0.074, 0.074, (s: number): number =>
      createProjectile({ kind: "bolt" }, s).body.mass,
    ),
    row("grenade body", 2.5 * 0.0254, 2.5 * 0.0254, (s: number): number =>
      archetypeExtent(createProjectile({ kind: "grenade" }, s), "x").size,
    ),
    row("grenade length", 3.53 * 0.0254, 3.53 * 0.0254, (s: number): number =>
      archetypeExtent(createProjectile({ kind: "grenade" }, s), "y").size,
    ),
    row("grenade mass", 14 * 0.02835, 14 * 0.02835, (s: number): number =>
      createProjectile({ kind: "grenade" }, s).body.mass,
    ),
    row("shot diameter", 3.58 * 0.0254, 4.52 * 0.0254, (s: number): number =>
      archetypeExtent(createProjectile({ kind: "roundShot" }, s), "x").size,
    ),
  ]);
  for (const seed of [0, 1, 2]) {
    for (const kind of ["ball", "roundShot"] as const)
      if (
        Math.abs(
          archetypeExtent(createProjectile({ kind }, seed), "y").low,
        ) > 1e-12
      )
        findings.push(`${kind}@${seed}: off the floor`);
    const bolt: ReturnType<typeof createProjectile> = createProjectile(
      { kind: "bolt" },
      seed,
    );
    if (
      Math.abs(bolt.affordance("nock").frame.translation.y) > 1e-12 ||
      Math.abs(
        bolt.affordance("tip").frame.translation.y -
          archetypeExtent(bolt, "y").high,
      ) > 1e-12
    )
      findings.push(`bolt@${seed}: the nock or the tip is off its end`);
  }
  for (const [diameter, pounds] of [
    [3.58, 6.1],
    [4.52, 12.3],
  ] as const) {
    const mass: number = createProjectile(
      { kind: "roundShot", diameter: diameter * 0.0254 },
      1,
    ).body.mass;
    if (Math.abs(mass / 0.4536 - pounds) > 0.1)
      findings.push(`a ${diameter} in shot weighs ${mass / 0.4536} lb`);
  }
  TestValidator.equals("projectiles stay in their cited bands", findings, []);
}
